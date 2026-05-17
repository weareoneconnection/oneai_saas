// apps/api/src/core/security/auth.ts
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import { applyPlanPolicyOverrides, getPlanPolicy } from "../billing/planPolicy.js";

export type AuthedRequest = Request & {
  auth?: {
    isAdmin: boolean;
    orgId: string | null;
    apiKeyId: string | null;
    apiKey?: any;
  };
};

export function getApiKeyFromRequest(req: Request) {
  const headerKey = String(req.header("x-api-key") || "").trim();
  if (headerKey) return headerKey;

  const auth = String(req.header("authorization") || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match?.[1]?.trim() || "";
}

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function requestMeta(req: Request) {
  return {
    path: req.originalUrl || req.url,
    method: req.method,
    ip: String(req.ip || req.headers["x-forwarded-for"] || "").slice(0, 120) || null,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 500) || null,
  };
}

async function writeAuthAudit(params: {
  action: string;
  req: Request;
  keyHash?: string;
  apiKey?: {
    id: string;
    orgId: string;
    prefix?: string | null;
    userEmail?: string | null;
    status?: string | null;
  } | null;
}) {
  try {
    const meta = requestMeta(params.req);
    await prisma.auditLog.create({
      data: {
        ...(params.apiKey?.orgId ? { org: { connect: { id: params.apiKey.orgId } } } : {}),
        ...(params.apiKey?.id ? { apiKey: { connect: { id: params.apiKey.id } } } : {}),
        action: params.action,
        target: params.apiKey?.prefix || meta.path || null,
        metadata: {
          path: meta.path,
          method: meta.method,
          keyHashPrefix: params.keyHash ? params.keyHash.slice(0, 12) : null,
          apiKeyPrefix: params.apiKey?.prefix || null,
          status: params.apiKey?.status || null,
          userEmail: params.apiKey?.userEmail || null,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      } as any,
    });
  } catch (err) {
    console.error("[auth] failed to write audit log", err);
  }
}

export async function requireApiKey(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const rawKey = getApiKeyFromRequest(req);
    if (!rawKey) {
      void writeAuthAudit({ action: "api_key.missing", req });
      return res.status(401).json({ success: false, error: "Missing API key" });
    }

    const keyHash = sha256Hex(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        orgId: true,
        status: true,
        revokedAt: true,
        scopes: true,
        rateLimitRpm: true,
        monthlyBudgetUsd: true,
        allowedIps: true,
        allowedTasks: true,
        allowedModels: true,
        environment: true,
        lastUsedAt: true,
        prefix: true,
        name: true,
        userEmail: true,
        org: {
          select: {
            billing: {
              select: {
                plan: true,
                status: true,
                monthlyRequestLimit: true,
                monthlyCostLimitUsd: true,
                rateLimitRpm: true,
              },
            },
          },
        },
      },
    });

    if (!apiKey) {
      void writeAuthAudit({ action: "api_key.invalid", req, keyHash });
      return res.status(401).json({ success: false, error: "Invalid API key" });
    }

    if (apiKey.status !== "ACTIVE" || apiKey.revokedAt) {
      void writeAuthAudit({ action: "api_key.rejected", req, keyHash, apiKey });
      return res.status(401).json({ success: false, error: "API key revoked/suspended" });
    }

    const rawIp = String(req.headers["x-forwarded-for"] || req.ip || "")
      .split(",")[0]
      .trim();
    if (Array.isArray(apiKey.allowedIps) && apiKey.allowedIps.length > 0 && !apiKey.allowedIps.includes(rawIp)) {
      void writeAuthAudit({ action: "api_key.ip_denied", req, keyHash, apiKey });
      return res.status(403).json({
        success: false,
        error: "API key is not allowed from this IP",
        code: "API_KEY_IP_FORBIDDEN",
      });
    }

    // isAdmin：用 scopes 控制（推荐）
    const isAdmin = Array.isArray(apiKey.scopes) && apiKey.scopes.includes("admin");
    const billingIsActive = ["active", "trialing"].includes(String(apiKey.org?.billing?.status));
    const effectivePlan = billingIsActive ? apiKey.org?.billing?.plan || "free" : "free";
    const policy = applyPlanPolicyOverrides(
      getPlanPolicy(effectivePlan),
      billingIsActive ? apiKey.org?.billing : null
    );
    const effectiveApiKey = {
      ...apiKey,
      rateLimitRpm: apiKey.rateLimitRpm || policy.rateLimitRpm,
      effectivePlan,
      planPolicy: policy,
    };

    // 记录 lastUsedAt（异步即可）
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    req.auth = {
      isAdmin,
      orgId: apiKey.orgId,
      apiKeyId: apiKey.id,
      apiKey: effectiveApiKey,
    };

    return next();
  } catch (e: any) {
    const message = String(e?.message || "");
    const isMissingTable =
      message.includes("does not exist in the current database") ||
      message.includes("relation") ||
      message.includes("does not exist");

    if (isMissingTable) {
      return res.status(503).json({
        success: false,
        error: "Database schema is not ready. Run Prisma migration or db push.",
        code: "DATABASE_SCHEMA_NOT_READY",
        retryable: false,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_FAILED",
      retryable: false,
    });
  }
}
