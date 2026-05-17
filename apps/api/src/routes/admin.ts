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

function normalizeApiKeyEnvironment(raw: string) {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "PROD" || value === "PRODUCTION") return "PRODUCTION";
  if (value === "STAGE" || value === "STAGING" || value === "TEST") return "STAGING";
  if (value === "DEV" || value === "DEVELOPMENT") return "DEVELOPMENT";
  return "";
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
      environment: true,
      rateLimitRpm: true,
      monthlyBudgetUsd: true,
      scopes: true,
      allowedIps: true,
      allowedTasks: true,
      allowedModels: true,
    } as any,
  });

  return res.json({ success: true, data: keys, org });
});

router.get("/team", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  if (!userEmail) return res.status(400).json({ success: false, error: "userEmail required" });

  const org = await getOrCreateOrgForUserEmail(userEmail);

  const [members, billing, keySummary, usage, recentAudit] = await Promise.all([
    prisma.membership.findMany({
      where: { orgId: org.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }] as any,
      select: {
        id: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      } as any,
    }),
    prisma.orgBilling.findUnique({
      where: { orgId: org.id },
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      } as any,
    }),
    prisma.apiKey.groupBy({
      by: ["status", "environment"],
      where: { orgId: org.id },
      _count: { _all: true },
    } as any),
    prisma.request.aggregate({
      where: { orgId: org.id },
      _count: { _all: true },
      _sum: {
        totalTokens: true,
        estimatedCostUsd: true,
      },
      _max: { createdAt: true },
    } as any),
    prisma.auditLog.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        target: true,
        metadata: true,
        createdAt: true,
      } as any,
    }),
  ]);

  const keyCounts = {
    total: 0,
    active: 0,
    revoked: 0,
    development: 0,
    staging: 0,
    production: 0,
  };
  const usageAny = usage as any;
  for (const row of keySummary as any[]) {
    const count = row._count?._all || 0;
    keyCounts.total += count;
    if (row.status === "ACTIVE") keyCounts.active += count;
    if (row.status === "REVOKED") keyCounts.revoked += count;
    if (row.environment === "DEVELOPMENT") keyCounts.development += count;
    if (row.environment === "STAGING") keyCounts.staging += count;
    if (row.environment === "PRODUCTION") keyCounts.production += count;
  }

  const currentMembership = (members as any[]).find(
    (member) => String(member.user?.email || "").toLowerCase() === userEmail
  );

  return res.json({
    success: true,
    data: {
      org,
      currentUser: {
        email: userEmail,
        role: currentMembership?.role || "OWNER",
      },
      billing: billing || { plan: "free", status: "inactive", currentPeriodEnd: null, cancelAtPeriodEnd: false },
      members: (members as any[]).map((member) => ({
        id: member.id,
        email: member.user?.email || null,
        name: member.user?.name || null,
        image: member.user?.image || null,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      })),
      keyCounts,
      usage: {
        requests: usageAny._count?._all || 0,
        tokens: usageAny._sum?.totalTokens || 0,
        costUsd: usageAny._sum?.estimatedCostUsd || 0,
        lastRequestAt: usageAny._max?.createdAt || null,
      },
      recentAudit,
      permissions: {
        canCreateKeys: ["OWNER", "ADMIN"].includes(currentMembership?.role || "OWNER"),
        canManageBilling: (currentMembership?.role || "OWNER") === "OWNER",
        canReviewProof: ["OWNER", "ADMIN"].includes(currentMembership?.role || "OWNER"),
        canManageMembers: (currentMembership?.role || "OWNER") === "OWNER",
      },
    },
  });
});

router.post("/keys", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const name = (req.body?.name ? String(req.body.name) : "default").slice(0, 60);
  const environmentRaw = normalizeApiKeyEnvironment(String(req.body?.environment || ""));
  const rateLimitRpmRaw = req.body?.rateLimitRpm == null ? undefined : Number(req.body.rateLimitRpm);
  const monthlyBudgetUsdRaw = req.body?.monthlyBudgetUsd == null ? undefined : Number(req.body.monthlyBudgetUsd);
  const scopes = Array.isArray(req.body?.scopes)
    ? req.body.scopes.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 20)
    : [];
  const allowedIps = Array.isArray(req.body?.allowedIps)
    ? req.body.allowedIps.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 50)
    : [];
  const allowedTasks = Array.isArray(req.body?.allowedTasks)
    ? req.body.allowedTasks.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 80)
    : [];
  const allowedModels = Array.isArray(req.body?.allowedModels)
    ? req.body.allowedModels.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 80)
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
      ...(environmentRaw ? { environment: environmentRaw } : {}),
      ...(Number.isFinite(rateLimitRpmRaw) && Number(rateLimitRpmRaw) > 0 ? { rateLimitRpm: Number(rateLimitRpmRaw) } : {}),
      ...(Number.isFinite(monthlyBudgetUsdRaw) && Number(monthlyBudgetUsdRaw) > 0 ? { monthlyBudgetUsd: Number(monthlyBudgetUsdRaw) } : {}),
      ...(scopes.length ? { scopes } : {}),
      ...(allowedIps.length ? { allowedIps } : {}),
      ...(allowedTasks.length ? { allowedTasks } : {}),
      ...(allowedModels.length ? { allowedModels } : {}),
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
    metadata: { name, prefix, scopes, environment: environmentRaw || null, allowedIps, allowedTasks, allowedModels },
    req,
  });

  // 明文只返回一次
  return res.json({ success: true, data: { ...row, plainKey }, org });
});

router.patch("/keys/:id/policy", requireAdminKey, async (req, res) => {
  const userEmail = String(req.body?.userEmail || "").trim().toLowerCase();
  const id = String(req.params.id || "").trim();
  if (!userEmail || !id) return res.status(400).json({ success: false, error: "userEmail & id required" });

  const org = await getOrCreateOrgForUserEmail(userEmail);
  const row = await prisma.apiKey.findFirst({
    where: { id, orgId: org.id, userEmail } as any,
    select: { id: true } as any,
  });
  if (!row) return res.status(404).json({ success: false, error: "not found" });

  const environmentRaw = normalizeApiKeyEnvironment(String(req.body?.environment || ""));
  const rateLimitRpm = req.body?.rateLimitRpm == null || req.body?.rateLimitRpm === "" ? null : Number(req.body.rateLimitRpm);
  const monthlyBudgetUsd =
    req.body?.monthlyBudgetUsd == null || req.body?.monthlyBudgetUsd === "" ? null : Number(req.body.monthlyBudgetUsd);
  const scopes = Array.isArray(req.body?.scopes)
    ? req.body.scopes.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 20)
    : undefined;
  const allowedIps = Array.isArray(req.body?.allowedIps)
    ? req.body.allowedIps.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 50)
    : undefined;
  const allowedTasks = Array.isArray(req.body?.allowedTasks)
    ? req.body.allowedTasks.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 80)
    : undefined;
  const allowedModels = Array.isArray(req.body?.allowedModels)
    ? req.body.allowedModels.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 80)
    : undefined;

  const updated = await prisma.apiKey.update({
    where: { id } as any,
    data: {
      ...(environmentRaw ? { environment: environmentRaw } : {}),
      ...(Number.isFinite(rateLimitRpm) && Number(rateLimitRpm) > 0 ? { rateLimitRpm: Number(rateLimitRpm) } : { rateLimitRpm: null }),
      ...(Number.isFinite(monthlyBudgetUsd) && Number(monthlyBudgetUsd) > 0
        ? { monthlyBudgetUsd: Number(monthlyBudgetUsd) }
        : { monthlyBudgetUsd: null }),
      ...(scopes ? { scopes } : {}),
      ...(allowedIps ? { allowedIps } : {}),
      ...(allowedTasks ? { allowedTasks } : {}),
      ...(allowedModels ? { allowedModels } : {}),
    } as any,
    select: {
      id: true,
      name: true,
      prefix: true,
      environment: true,
      rateLimitRpm: true,
      monthlyBudgetUsd: true,
      scopes: true,
      allowedIps: true,
      allowedTasks: true,
      allowedModels: true,
      updatedAt: true,
    } as any,
  });

  await writeAuditLog({
    userEmail,
    action: "api_key.policy_updated",
    target: id,
    apiKeyId: id,
    metadata: {
      environment: environmentRaw || null,
      rateLimitRpm,
      monthlyBudgetUsd,
      scopes,
      allowedIps,
      allowedTasks,
      allowedModels,
    },
    req,
  });

  return res.json({ success: true, data: updated });
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
  const [
    keys,
    requestByKey,
    requestByOrg,
    failedByOrg,
    billingRows,
    membershipRows,
    audits,
    recentFailures,
    executionByOrg,
    recentExecutions,
  ] = await Promise.all([
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
    prisma.request.groupBy({
      by: ["orgId"],
      where: { success: false },
      _count: { _all: true },
      _max: { createdAt: true },
    } as any),
    prisma.orgBilling.findMany({
      select: {
        orgId: true,
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      } as any,
    }),
    prisma.membership.findMany({
      select: {
        orgId: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
      } as any,
      orderBy: { createdAt: "asc" },
    }),
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
    prisma.request.findMany({
      where: { success: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        requestId: true,
        orgId: true,
        apiKeyId: true,
        endpoint: true,
        task: true,
        provider: true,
        model: true,
        errorCode: true,
        statusCode: true,
        error: true,
        createdAt: true,
        apiKey: {
          select: {
            prefix: true,
            name: true,
            userEmail: true,
          },
        },
      } as any,
    }),
    (prisma as any).agentExecution.groupBy({
      by: ["orgId", "status"],
      _count: { _all: true },
      _max: { updatedAt: true },
    }).catch(() => []),
    (prisma as any).agentExecution.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        handoffId: true,
        agentPlanId: true,
        orgId: true,
        apiKeyId: true,
        executorType: true,
        executorRunId: true,
        objective: true,
        status: true,
        approvalMode: true,
        approvalRequired: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
        apiKey: {
          select: {
            prefix: true,
            name: true,
            userEmail: true,
          },
        },
      } as any,
    }).catch(() => []),
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
  const failedByOrgMap = new Map(
    failedByOrg.map((row: any) => [
      row.orgId,
      {
        failedRequests: row._count?._all || 0,
        lastFailedAt: row._max?.createdAt || null,
      },
    ])
  );
  const executionByOrgMap = new Map<string, any>();
  for (const row of executionByOrg as any[]) {
    const orgId = row.orgId || "unknown";
    const current = executionByOrgMap.get(orgId) || {
      total: 0,
      succeeded: 0,
      failed: 0,
      running: 0,
      pending: 0,
      lastUpdatedAt: null,
    };
    const count = row._count?._all || 0;
    current.total += count;
    if (row.status === "SUCCEEDED") current.succeeded += count;
    if (row.status === "FAILED") current.failed += count;
    if (row.status === "RUNNING") current.running += count;
    if (row.status === "PENDING_APPROVAL" || row.status === "APPROVED") current.pending += count;
    current.lastUpdatedAt =
      row._max?.updatedAt && (!current.lastUpdatedAt || row._max.updatedAt > current.lastUpdatedAt)
        ? row._max.updatedAt
        : current.lastUpdatedAt;
    executionByOrgMap.set(orgId, current);
  }
  const billingByOrg = new Map(
    billingRows.map((row: any) => [
      row.orgId,
      {
        plan: row.plan || "free",
        status: row.status || "inactive",
        currentPeriodEnd: row.currentPeriodEnd || null,
        cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
      },
    ])
  );
  const membersByOrg = new Map<string, any[]>();
  for (const membership of membershipRows as any[]) {
    const list = membersByOrg.get(membership.orgId) || [];
    list.push({
      email: membership.user?.email || null,
      role: membership.role,
      createdAt: membership.createdAt,
    });
    membersByOrg.set(membership.orgId, list);
  }

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
      failedRequestCount: 0,
      totalTokens: 0,
      costUsd: 0,
      lastRequestAt: null,
      lastFailedRequestAt: null,
      billing: null,
      members: [],
      keys: [],
      executions: { total: 0, succeeded: 0, failed: 0, running: 0, pending: 0, lastUpdatedAt: null },
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
    const failedUsage = failedByOrgMap.get(key.orgId) || { failedRequests: 0, lastFailedAt: null };
    current.failedRequestCount = failedUsage.failedRequests || current.failedRequestCount || 0;
    current.lastFailedRequestAt =
      failedUsage.lastFailedAt && (!current.lastFailedRequestAt || failedUsage.lastFailedAt > current.lastFailedRequestAt)
        ? failedUsage.lastFailedAt
        : current.lastFailedRequestAt;
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
    current.billing = billingByOrg.get(key.orgId) || current.billing || { plan: "free", status: "inactive" };
    current.members = membersByOrg.get(key.orgId) || current.members || [];
    current.executions = executionByOrgMap.get(key.orgId) || current.executions;
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
      failedRequestCount: 0,
      totalTokens: 0,
      costUsd: 0,
      lastRequestAt: null,
      lastFailedRequestAt: null,
      billing: audit.orgId ? billingByOrg.get(audit.orgId) || { plan: "free", status: "inactive" } : null,
      members: audit.orgId ? membersByOrg.get(audit.orgId) || [] : [],
      keys: [],
      executions: audit.orgId
        ? executionByOrgMap.get(audit.orgId) || { total: 0, succeeded: 0, failed: 0, running: 0, pending: 0, lastUpdatedAt: null }
        : { total: 0, succeeded: 0, failed: 0, running: 0, pending: 0, lastUpdatedAt: null },
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
    if (audit.orgId && failedByOrgMap.has(audit.orgId)) {
      const failedUsage = failedByOrgMap.get(audit.orgId);
      current.failedRequestCount = failedUsage?.failedRequests || 0;
      current.lastFailedRequestAt = failedUsage?.lastFailedAt || null;
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
  const recentFailedRequests = (recentFailures as any[]).map((request) => ({
    id: request.requestId || request.id,
    orgId: request.orgId,
    apiKeyId: request.apiKeyId,
    endpoint: request.endpoint,
    task: request.task,
    provider: request.provider,
    model: request.model,
    errorCode: request.errorCode,
    statusCode: request.statusCode,
    error: request.error,
    createdAt: request.createdAt,
    apiKey: request.apiKey
      ? {
          prefix: request.apiKey.prefix,
          name: request.apiKey.name,
          userEmail: request.apiKey.userEmail,
        }
      : null,
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
      recentFailedRequests,
      recentExecutions,
    },
  });
});

router.get("/agent-executions", requireAdminKey, async (req, res) => {
  const userEmail = String(req.query.userEmail || "").trim().toLowerCase();
  const status = String(req.query.status || "").trim();
  const executorType = String(req.query.executorType || "").trim();
  const handoffId = String(req.query.handoffId || "").trim();
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const org = userEmail ? await getOrCreateOrgForUserEmail(userEmail) : null;

  const records = await (prisma as any).agentExecution.findMany({
    where: {
      ...(org ? { orgId: org.id } : {}),
      ...(status ? { status } : {}),
      ...(executorType ? { executorType } : {}),
      ...(handoffId ? { handoffId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      orgId: true,
      apiKeyId: true,
      handoffId: true,
      agentPlanId: true,
      protocolVersion: true,
      executorType: true,
      executorRunId: true,
      objective: true,
      status: true,
      approvalMode: true,
      approvalRequired: true,
      approvedBy: true,
      approvedAt: true,
      handoffJson: true,
      proofJson: true,
      resultJson: true,
      error: true,
      callbackUrl: true,
      createdAt: true,
      updatedAt: true,
      apiKey: {
        select: {
          prefix: true,
          name: true,
          userEmail: true,
        },
      },
    } as any,
  }).catch(() => []);

  function buildTimeline(row: any) {
    const proofReceivedAt = row.proofJson?.receivedAt || null;
    const resultReceivedAt = row.resultJson?.receivedAt || null;
    return [
      {
        key: "contract_created",
        label: "Contract created",
        status: "done",
        at: row.createdAt,
      },
      {
        key: "approval",
        label: row.approvalRequired ? "Approval required" : "Auto approved",
        status: row.approvedAt || !row.approvalRequired ? "done" : "pending",
        at: row.approvedAt || null,
      },
      {
        key: "executor_received",
        label: "Executor handoff",
        status: row.executorRunId || row.status !== "PENDING_APPROVAL" ? "done" : "pending",
        at: row.updatedAt,
      },
      {
        key: "proof_received",
        label: "Proof received",
        status: row.proofJson ? "done" : "pending",
        at: proofReceivedAt,
      },
      {
        key: "result_received",
        label: "Result received",
        status: row.resultJson ? "done" : row.status === "FAILED" ? "failed" : "pending",
        at: resultReceivedAt,
      },
      {
        key: "completed",
        label: "Execution completed",
        status: ["SUCCEEDED", "FAILED", "CANCELED"].includes(row.status) ? "done" : "pending",
        at: ["SUCCEEDED", "FAILED", "CANCELED"].includes(row.status) ? row.updatedAt : null,
      },
    ];
  }

  function verifyProof(row: any) {
    if (!row.proofJson) {
      return {
        status: "missing",
        label: "Missing proof",
        notes: ["No proof callback has been stored for this handoff."],
      };
    }

    const reviewStatus = String(row.proofJson?.review?.status || "").toLowerCase();
    if (reviewStatus === "verified") {
      return {
        status: "verified",
        label: "Verified",
        notes: [
          `Reviewed by ${row.proofJson?.review?.reviewer || "operator"}.`,
          row.proofJson?.review?.note || "Proof accepted by operator review.",
        ].filter(Boolean),
      };
    }
    if (reviewStatus === "rejected") {
      return {
        status: "rejected",
        label: "Rejected",
        notes: [
          `Reviewed by ${row.proofJson?.review?.reviewer || "operator"}.`,
          row.proofJson?.review?.note || "Proof rejected by operator review.",
        ].filter(Boolean),
      };
    }
    if (reviewStatus === "needs_review") {
      return {
        status: "needs_review",
        label: "Needs review",
        notes: [
          `Reviewed by ${row.proofJson?.review?.reviewer || "operator"}.`,
          row.proofJson?.review?.note || "Proof requires another review.",
        ].filter(Boolean),
      };
    }

    const artifacts = Array.isArray(row.proofJson?.artifacts) ? row.proofJson.artifacts : [];
    const verifiedFlag = row.proofJson?.verified === true;
    const hasArtifacts = artifacts.length > 0 || Boolean(row.proofJson?.summary);

    if (verifiedFlag && hasArtifacts) {
      return {
        status: "verified",
        label: "Verified",
        notes: ["Proof includes verifier confirmation and reviewable artifacts."],
      };
    }

    if (hasArtifacts) {
      return {
        status: "needs_review",
        label: "Needs review",
        notes: ["Proof was received, but no explicit verifier confirmation was found."],
      };
    }

    return {
      status: "unverified",
      label: "Unverified",
      notes: ["Proof payload exists but does not include artifacts or a summary."],
    };
  }

  const decoratedRecords = (records as any[]).map((row) => ({
    ...row,
    timeline: buildTimeline(row),
    proofVerification: verifyProof(row),
  }));

  const summary = decoratedRecords.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === "SUCCEEDED") acc.succeeded += 1;
      if (row.status === "FAILED") acc.failed += 1;
      if (row.status === "RUNNING") acc.running += 1;
      if (row.status === "PENDING_APPROVAL" || row.status === "APPROVED") acc.pending += 1;
      if (row.proofJson) acc.withProof += 1;
      if (row.resultJson) acc.withResult += 1;
      if (row.proofVerification?.status === "verified") acc.verifiedProof += 1;
      if (row.proofVerification?.status === "needs_review") acc.needsReview += 1;
      return acc;
    },
    {
      total: 0,
      succeeded: 0,
      failed: 0,
      running: 0,
      pending: 0,
      withProof: 0,
      withResult: 0,
      verifiedProof: 0,
      needsReview: 0,
    }
  );

  return res.json({
    success: true,
    data: {
      scope: userEmail ? "customer" : "operator",
      userEmail: userEmail || null,
      orgId: org?.id || null,
      filters: {
        status: status || null,
        executorType: executorType || null,
        handoffId: handoffId || null,
      },
      summary,
      executions: decoratedRecords,
    },
  });
});

router.post("/agent-executions/:handoffId/review-proof", requireAdminKey, async (req, res) => {
  const handoffId = String(req.params.handoffId || "").trim();
  const reviewer = String(req.body?.reviewer || req.body?.userEmail || "operator").trim().slice(0, 160);
  const reviewStatus = String(req.body?.reviewStatus || "").trim().toLowerCase();
  const reviewNote = String(req.body?.reviewNote || "").trim().slice(0, 2000);

  if (!handoffId) return res.status(400).json({ success: false, error: "handoffId required" });
  if (!["verified", "rejected", "needs_review"].includes(reviewStatus)) {
    return res.status(400).json({
      success: false,
      error: "reviewStatus must be verified, rejected, or needs_review",
    });
  }

  const existing = await (prisma as any).agentExecution.findUnique({
    where: { handoffId },
    select: {
      id: true,
      orgId: true,
      apiKeyId: true,
      proofJson: true,
      status: true,
    } as any,
  });

  if (!existing) return res.status(404).json({ success: false, error: "not found" });

  const nextProof = {
    ...((existing.proofJson && typeof existing.proofJson === "object" ? existing.proofJson : {}) as any),
    review: {
      status: reviewStatus,
      reviewer,
      reviewedAt: new Date().toISOString(),
      note: reviewNote || null,
    },
    verified: reviewStatus === "verified",
  };

  const updated = await (prisma as any).agentExecution.update({
    where: { handoffId },
    data: {
      proofJson: nextProof,
      ...(reviewStatus === "rejected" ? { status: "FAILED", error: reviewNote || "Proof rejected by operator" } : {}),
    },
    select: {
      id: true,
      handoffId: true,
      objective: true,
      status: true,
      proofJson: true,
      resultJson: true,
      updatedAt: true,
    } as any,
  });

  await writeAuditLog({
    action: "agent_execution.proof_reviewed",
    target: handoffId,
    apiKeyId: existing.apiKeyId || undefined,
    metadata: {
      reviewer,
      reviewStatus,
      reviewNote,
      orgId: existing.orgId,
    },
    req,
  });

  return res.json({ success: true, data: updated });
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

  const executionWhere: any = { orgId: org.id };
  if (from) executionWhere.createdAt = { gte: from };

  const executions = await (prisma as any).agentExecution.findMany({
    where: executionWhere,
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      handoffId: true,
      agentPlanId: true,
      executorType: true,
      executorRunId: true,
      objective: true,
      status: true,
      approvalMode: true,
      approvalRequired: true,
      proofJson: true,
      resultJson: true,
      createdAt: true,
      updatedAt: true,
      apiKeyId: true,
      apiKey: {
        select: {
          prefix: true,
          name: true,
        },
      },
    } as any,
  }).catch(() => []);

  const executionSummary = (executions as any[]).reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === "SUCCEEDED") acc.succeeded += 1;
      if (row.status === "FAILED") acc.failed += 1;
      if (row.status === "RUNNING") acc.running += 1;
      if (row.status === "PENDING_APPROVAL" || row.status === "APPROVED") acc.pending += 1;
      if (row.proofJson) acc.withProof += 1;
      if (row.resultJson) acc.withResult += 1;
      return acc;
    },
    { total: 0, succeeded: 0, failed: 0, running: 0, pending: 0, withProof: 0, withResult: 0 }
  );

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
    executionSummary,
    recentExecutions: (executions as any[]).map((row) => ({
      id: row.id,
      handoffId: row.handoffId,
      agentPlanId: row.agentPlanId,
      executorType: row.executorType,
      executorRunId: row.executorRunId,
      objective: row.objective,
      status: row.status,
      approvalMode: row.approvalMode,
      approvalRequired: row.approvalRequired,
      hasProof: Boolean(row.proofJson),
      hasResult: Boolean(row.resultJson),
      apiKeyId: row.apiKeyId,
      apiKey: row.apiKey
        ? {
            prefix: row.apiKey.prefix,
            name: row.apiKey.name,
          }
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };

  return res.json({ success: true, data, org });
});

export default router;
