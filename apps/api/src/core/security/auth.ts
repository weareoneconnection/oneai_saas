// apps/api/src/core/security/auth.ts
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";

export type AuthedRequest = Request & {
  auth?: {
    isAdmin: boolean;
    orgId: string | null;
    apiKeyId: string | null;
    apiKey?: any;
  };
};

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function requireApiKey(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const rawKey = String(req.header("x-api-key") || "").trim();
    if (!rawKey) {
      return res.status(401).json({ success: false, error: "Missing x-api-key" });
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

    // 记录 lastUsedAt（异步即可）
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    req.auth = {
      isAdmin,
      orgId: apiKey.orgId,
      apiKeyId: apiKey.id,
      apiKey,
    };

    return next();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Auth failed" });
  }
}