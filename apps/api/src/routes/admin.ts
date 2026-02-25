// apps/api/src/routes/admin.ts
import { Router } from "express";
import crypto from "crypto";
import { requireAdminKey } from "../core/security/admin.js";
import { prisma } from "../config/prisma.js";

const router = Router();

/** =========================
 * helpers
 * ========================= */
function hashKey(plain: string) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

function makeKey() {
  const raw = crypto.randomBytes(32).toString("hex");
  return `oak_${raw}`;
}

function prefixOf(k: string) {
  return k.slice(0, 12);
}

/**
 * ✅ ApiKey 需要 org 关系：提供默认 org
 * 如果你的 Organization model 有额外必填字段，在 create 里补上即可
 */
async function getOrCreateDefaultOrg() {
  const bySlug = await prisma.organization.findUnique({
    where: { slug: "default" },
    select: { id: true, slug: true, name: true },
  });
  if (bySlug) return bySlug;

  const any = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, name: true },
  });
  if (any) return any;

  const created = await prisma.organization.create({
    data: {
      slug: "default",
      name: "Default Org",
      // ⚠️ 如果 schema 还有必填字段，例如 ownerEmail，就加在这里：
      // ownerEmail: "info@weareoneconncetion.com",
    } as any,
    select: { id: true, slug: true, name: true },
  });

  return created;
}

/** =========================
 * keys
 * ========================= */

router.get("/keys", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  // 当前先用 default org 策略（后面再做 user->org 归属）
  const org = await getOrCreateDefaultOrg();

  const keys = await prisma.apiKey.findMany({
    where: { orgId: org.id, userEmail } as any,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      revokedAt: true,
      lastUsedAt: true,
      status: true,
    } as any,
  });

  return res.json({ success: true, data: keys, org });
});

router.post("/keys", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const name = (req.body?.name ? String(req.body.name) : "default").slice(0, 60);
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateDefaultOrg();

  const plainKey = makeKey();
  const prefix = prefixOf(plainKey);
  const keyHash = hashKey(plainKey);

  const row = await prisma.apiKey.create({
    data: {
      userEmail, // ✅ 必填
      name,
      prefix,
      keyHash,
      status: "ACTIVE", // ✅ 不依赖 enum
      org: { connect: { id: org.id } },
    } as any,
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      status: true,
    } as any,
  });

  // 明文只返回一次
  return res.json({ success: true, data: { ...row, plainKey }, org });
});

router.post("/keys/revoke", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const id = String(req.body?.id || "").trim();
  if (!userEmail || !id) return res.status(400).json({ success: false, error: "userEmail & id required" });

  const org = await getOrCreateDefaultOrg();

  const row = await prisma.apiKey.findFirst({
    where: { id, orgId: org.id, userEmail } as any,
    select: { id: true } as any,
  });

  if (!row) return res.status(404).json({ success: false, error: "not found" });

  await prisma.apiKey.update({
    where: { id } as any,
    data: { revokedAt: new Date(), status: "REVOKED" } as any,
  });

  return res.json({ success: true });
});

/** =========================
 * usage
 * ========================= */

router.get("/usage", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  const range = String(req.query.range || "30d");
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateDefaultOrg();

  let from: Date | null = null;
  if (range === "7d") from = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  if (range === "30d") from = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // ✅ 先按 org 聚合（后面做多 org / RBAC 再细分）
  const where: any = { orgId: org.id };
  if (from) where.createdAt = { gte: from };

  const total = await prisma.request.aggregate({
    where,
    _count: { _all: true },
    _sum: { totalTokens: true, estimatedCostUsd: true },
  });

  const byModelRaw = await prisma.request.groupBy({
    by: ["model"],
    where,
    _count: { _all: true },
    _sum: { totalTokens: true, estimatedCostUsd: true },
    // ✅ FIX: Prisma 版本不支持 _count._all 排序，用 id 计数等价
    orderBy: { _count: { id: "desc" } },
  });

  const recent = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      // ✅ FIX: 你的 Request model 没有 type 字段
      model: true,
      totalTokens: true,
      estimatedCostUsd: true,
      createdAt: true,
    },
  });

  const data = {
    totalRequests: total._count._all || 0,
    totalTokens: total._sum.totalTokens || 0,
    totalCostUSD: Number(total._sum.estimatedCostUsd || 0),
    byModel: byModelRaw.map((m: any) => ({
      model: m.model || "(unknown)",
      requests: m._count._all,
      tokens: m._sum.totalTokens || 0,
      costUSD: Number(m._sum.estimatedCostUsd || 0),
    })),
    recent: recent.map((r: any) => ({
      id: r.id,
      // ✅ FIX: 不返回 type
      model: r.model,
      tokens: r.totalTokens || 0,
      costUSD: Number(r.estimatedCostUsd || 0),
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return res.json({ success: true, data, org });
});

export default router;