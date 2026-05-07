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

export async function requireApiKey(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const rawKey = getApiKeyFromRequest(req);
    if (!rawKey) {
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
      return res.status(401).json({ success: false, error: "Invalid API key" });
    }

    if (apiKey.status !== "ACTIVE" || apiKey.revokedAt) {
      return res.status(401).json({ success: false, error: "API key revoked/suspended" });
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
