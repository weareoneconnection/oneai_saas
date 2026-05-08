// apps/api/src/routes/admin.ts
import { Router } from "express";
import crypto from "crypto";
import { requireAdminKey } from "../core/security/admin.js";
import { prisma } from "../config/prisma.js";
import { getOrCreateOrgForUserEmail } from "../core/orgs/ensureOrg.js";

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

function clientMeta(req: any) {
  return {
    ip: String(req.ip || req.headers?.["x-forwarded-for"] || "").slice(0, 120) || null,
    userAgent: String(req.headers?.["user-agent"] || "").slice(0, 500) || null,
  };
}

async function writeAuditLog(params: {
  userEmail?: string;
  action: string;
  target?: string;
  metadata?: any;
  apiKeyId?: string;
  req?: any;
}) {
  try {
    const email = String(params.userEmail || "").trim().toLowerCase();
    const org = email ? await getOrCreateOrgForUserEmail(email) : null;
    const meta = params.req ? clientMeta(params.req) : { ip: null, userAgent: null };

    await prisma.auditLog.create({
      data: {
        ...(org ? { org: { connect: { id: org.id } } } : {}),
        ...(params.apiKeyId ? { apiKey: { connect: { id: params.apiKeyId } } } : {}),
        action: params.action,
        target: params.target || email || null,
        metadata: {
          ...(params.metadata || {}),
          ...(email ? { userEmail: email } : {}),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      } as any,
    });
  } catch (err) {
    console.error("[admin] failed to write audit log", err);
  }
}

/** =========================
 * keys
 * ========================= */

router.get("/keys", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateOrgForUserEmail(userEmail);

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
      rateLimitRpm: true,
      monthlyBudgetUsd: true,
      scopes: true,
      allowedIps: true,
    } as any,
  });

  return res.json({ success: true, data: keys, org });
});

router.post("/keys", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const name = (req.body?.name ? String(req.body.name) : "default").slice(0, 60);
  const rateLimitRpmRaw = req.body?.rateLimitRpm == null ? undefined : Number(req.body.rateLimitRpm);
  const monthlyBudgetUsdRaw = req.body?.monthlyBudgetUsd == null ? undefined : Number(req.body.monthlyBudgetUsd);
  const scopes = Array.isArray(req.body?.scopes)
    ? req.body.scopes.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 20)
    : [];
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateOrgForUserEmail(userEmail);

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
      ...(Number.isFinite(rateLimitRpmRaw) && Number(rateLimitRpmRaw) > 0 ? { rateLimitRpm: Number(rateLimitRpmRaw) } : {}),
      ...(Number.isFinite(monthlyBudgetUsdRaw) && Number(monthlyBudgetUsdRaw) > 0 ? { monthlyBudgetUsd: Number(monthlyBudgetUsdRaw) } : {}),
      ...(scopes.length ? { scopes } : {}),
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
  const rowAny = row as any;

  await writeAuditLog({
    userEmail,
    action: "api_key.created",
    target: rowAny.id,
    apiKeyId: rowAny.id,
    metadata: { name, prefix, scopes },
    req,
  });

  // 明文只返回一次
  return res.json({ success: true, data: { ...row, plainKey }, org });
});

router.post("/keys/revoke", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const id = String(req.body?.id || "").trim();
  if (!userEmail || !id) return res.status(400).json({ success: false, error: "userEmail & id required" });

  const org = await getOrCreateOrgForUserEmail(userEmail);

  const row = await prisma.apiKey.findFirst({
    where: { id, orgId: org.id, userEmail } as any,
    select: { id: true } as any,
  });

  if (!row) return res.status(404).json({ success: false, error: "not found" });

  await prisma.apiKey.update({
    where: { id } as any,
    data: { revokedAt: new Date(), status: "REVOKED" } as any,
  });

  await writeAuditLog({
    userEmail,
    action: "api_key.revoked",
    target: id,
    apiKeyId: id,
    req,
  });

  return res.json({ success: true });
});

/** =========================
 * operator visibility
 * ========================= */

router.post("/audit/event", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const action = String(req.body?.action || "").trim().slice(0, 120);
  const target = req.body?.target ? String(req.body.target).slice(0, 255) : undefined;
  const metadata = req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {};

  if (!action) return res.status(400).json({ success: false, error: "action required" });

  await writeAuditLog({
    userEmail,
    action,
    target,
    metadata,
    req,
  });

  return res.json({ success: true });
});

router.get("/customers", requireAdminKey, async (_req, res) => {
  const [keys, requestByKey, requestByOrg, audits] = await Promise.all([
    prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orgId: true,
        userEmail: true,
        name: true,
        prefix: true,
        status: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      } as any,
    }),
    prisma.request.groupBy({
      by: ["apiKeyId"],
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      _max: { createdAt: true },
    } as any),
    prisma.request.groupBy({
      by: ["orgId"],
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      _max: { createdAt: true },
    } as any),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        orgId: true,
        action: true,
        target: true,
        metadata: true,
        createdAt: true,
      } as any,
    }),
  ]);

  const usageByKey = new Map(
    requestByKey.map((row: any) => [
      row.apiKeyId,
      {
        requests: row._count?._all || 0,
        tokens: row._sum?.totalTokens || 0,
        costUsd: row._sum?.estimatedCostUsd || 0,
        lastRequestAt: row._max?.createdAt || null,
      },
    ])
  );
  const usageByOrg = new Map(
    requestByOrg.map((row: any) => [
      row.orgId,
      {
        requests: row._count?._all || 0,
        tokens: row._sum?.totalTokens || 0,
        costUsd: row._sum?.estimatedCostUsd || 0,
        lastRequestAt: row._max?.createdAt || null,
      },
    ])
  );

  const customers = new Map<string, any>();

  for (const key of keys as any[]) {
    const email = String(key.userEmail || "").toLowerCase();
    if (!email) continue;
    const current = customers.get(email) || {
      email,
      orgId: key.orgId,
      keyCount: 0,
      activeKeyCount: 0,
      revokedKeyCount: 0,
      latestKeyCreatedAt: null,
      latestKeyUsedAt: null,
      latestLoginAt: null,
      requestCount: 0,
      totalTokens: 0,
      costUsd: 0,
      lastRequestAt: null,
      keys: [],
    };
    const usage = usageByKey.get(key.id) || { requests: 0, tokens: 0, costUsd: 0, lastRequestAt: null };
    current.keyCount += 1;
    current.activeKeyCount += key.revokedAt ? 0 : 1;
    current.revokedKeyCount += key.revokedAt ? 1 : 0;
    current.latestKeyCreatedAt =
      !current.latestKeyCreatedAt || key.createdAt > current.latestKeyCreatedAt ? key.createdAt : current.latestKeyCreatedAt;
    current.latestKeyUsedAt =
      key.lastUsedAt && (!current.latestKeyUsedAt || key.lastUsedAt > current.latestKeyUsedAt) ? key.lastUsedAt : current.latestKeyUsedAt;
    current.requestCount += usage.requests;
    current.totalTokens += usage.tokens;
    current.costUsd += usage.costUsd;
    current.lastRequestAt =
      usage.lastRequestAt && (!current.lastRequestAt || usage.lastRequestAt > current.lastRequestAt)
        ? usage.lastRequestAt
        : current.lastRequestAt;
    current.keys.push({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      status: key.status,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
      usage,
    });
    customers.set(email, current);
  }

  for (const audit of audits as any[]) {
    const email = String(audit.metadata?.userEmail || "").toLowerCase();
    if (!email) continue;
    const current = customers.get(email) || {
      email,
      orgId: audit.orgId,
      keyCount: 0,
      activeKeyCount: 0,
      revokedKeyCount: 0,
      latestKeyCreatedAt: null,
      latestKeyUsedAt: null,
      latestLoginAt: null,
      requestCount: 0,
      totalTokens: 0,
      costUsd: 0,
      lastRequestAt: null,
      keys: [],
    };
    if (audit.action === "console.sign_in") {
      current.latestLoginAt =
        !current.latestLoginAt || audit.createdAt > current.latestLoginAt ? audit.createdAt : current.latestLoginAt;
    }
    if (audit.orgId && usageByOrg.has(audit.orgId) && current.requestCount === 0) {
      const orgUsage = usageByOrg.get(audit.orgId);
      if (orgUsage) {
        current.requestCount = orgUsage.requests;
        current.totalTokens = orgUsage.tokens;
        current.costUsd = orgUsage.costUsd;
        current.lastRequestAt = orgUsage.lastRequestAt;
      }
    }
    customers.set(email, current);
  }

  const recentEvents = (audits as any[]).map((audit) => ({
    id: audit.id,
    action: audit.action,
    target: audit.target,
    userEmail: audit.metadata?.userEmail || null,
    createdAt: audit.createdAt,
    metadata: audit.metadata,
  }));

  return res.json({
    success: true,
    data: {
      customers: Array.from(customers.values()).sort((a, b) => {
        const at = new Date(a.latestLoginAt || a.latestKeyCreatedAt || a.lastRequestAt || 0).getTime();
        const bt = new Date(b.latestLoginAt || b.latestKeyCreatedAt || b.lastRequestAt || 0).getTime();
        return bt - at;
      }),
      recentEvents,
    },
  });
});

/** =========================
 * usage
 * ========================= */

router.get("/usage", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  const range = String(req.query.range || "30d");
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateOrgForUserEmail(userEmail);

  let from: Date | null = null;
  if (range === "7d") from = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  if (range === "30d") from = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // ✅ 先按 org 聚合（后面做多 org / RBAC 再细分）
  const where: any = { orgId: org.id };
  if (from) where.createdAt = { gte: from };

  const total = await prisma.request.aggregate({
    where,
    _count: { _all: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true, estimatedCostUsd: true },
    _avg: { latencyMs: true },
  });

  const errors = await prisma.request.aggregate({
    where: { ...where, success: false },
    _count: { _all: true },
  });

  const [byModelRaw, byTaskRaw, byProviderRaw] = await Promise.all([
    prisma.request.groupBy({
      by: ["provider", "model"],
      where,
      _count: { _all: true, success: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _count: { id: "desc" } },
    } as any),
    prisma.request.groupBy({
      by: ["task"],
      where,
      _count: { _all: true, success: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _count: { id: "desc" } },
    } as any),
    prisma.request.groupBy({
      by: ["provider"],
      where,
      _count: { _all: true, success: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _count: { id: "desc" } },
    } as any),
  ]);

  const byKeyRaw = await prisma.request.groupBy({
    by: ["apiKeyId"],
    where,
    _count: { _all: true },
    _sum: { totalTokens: true, estimatedCostUsd: true },
    orderBy: { _count: { id: "desc" } },
    take: 25,
  } as any);

  const keyIds = byKeyRaw.map((x: any) => x.apiKeyId).filter(Boolean);
  const keyRows = keyIds.length
    ? await prisma.apiKey.findMany({
        where: { id: { in: keyIds } },
        select: { id: true, name: true, prefix: true },
      })
    : [];
  const keyById = new Map(keyRows.map((x) => [x.id, x]));

  const recent = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      requestId: true,
      task: true,
      provider: true,
      model: true,
      success: true,
      error: true,
      latencyMs: true,
      totalTokens: true,
      estimatedCostUsd: true,
      createdAt: true,
    },
  });

  const totalRequests = total._count._all || 0;
  const errorCount = errors._count._all || 0;
  const data = {
    totalRequests,
    errorCount,
    errorRatePct: totalRequests ? Number(((errorCount / totalRequests) * 100).toFixed(2)) : 0,
    avgLatencyMs: total._avg.latencyMs ? Math.round(Number(total._avg.latencyMs)) : null,
    promptTokens: total._sum.promptTokens || 0,
    completionTokens: total._sum.completionTokens || 0,
    totalTokens: total._sum.totalTokens || 0,
    totalCostUSD: Number(total._sum.estimatedCostUsd || 0),
    byProvider: byProviderRaw.map((m: any) => {
      const requests = m._count._all || 0;
      const success = m._count.success || 0;
      const errorCount = requests - success;
      return {
        provider: m.provider || "unknown",
        requests,
        errorCount,
        errorRatePct: requests ? Number(((errorCount / requests) * 100).toFixed(2)) : 0,
        tokens: m._sum.totalTokens || 0,
        costUSD: Number(m._sum.estimatedCostUsd || 0),
      };
    }),
    byModel: byModelRaw.map((m: any) => ({
      provider: m.provider || "unknown",
      model: m.model || "(unknown)",
      requests: m._count._all,
      errorCount: m._count._all - (m._count.success || 0),
      tokens: m._sum.totalTokens || 0,
      costUSD: Number(m._sum.estimatedCostUsd || 0),
    })),
    byTask: byTaskRaw.map((m: any) => ({
      task: m.task || "(unknown)",
      requests: m._count._all,
      errorCount: m._count._all - (m._count.success || 0),
      tokens: m._sum.totalTokens || 0,
      costUSD: Number(m._sum.estimatedCostUsd || 0),
    })),
    byKey: byKeyRaw.map((m: any) => {
      const key = m.apiKeyId ? keyById.get(m.apiKeyId) : null;
      return {
        apiKeyId: m.apiKeyId || null,
        name: key?.name || "unknown",
        prefix: key?.prefix || null,
        requests: m._count._all,
        tokens: m._sum.totalTokens || 0,
        costUSD: Number(m._sum.estimatedCostUsd || 0),
      };
    }),
    recent: recent.map((r: any) => ({
      id: r.requestId || r.id,
      type: r.task,
      provider: r.provider,
      model: r.model,
      success: r.success,
      error: r.error,
      latencyMs: r.latencyMs,
      tokens: r.totalTokens || 0,
      costUSD: Number(r.estimatedCostUsd || 0),
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return res.json({ success: true, data, org });
});

export default router;
