import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAdminKey } from "../core/security/admin.js";

const router = Router();

type EnvKey = "prod" | "dev";

function toEnvFromKeyName(name?: string | null): EnvKey {
  const s = String(name || "").toLowerCase();
  // 你可以按自己的命名规则扩展
  if (s.includes("dev") || s.startsWith("dev_") || s.includes("_dev_")) return "dev";
  return "prod";
}

function hourKey(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  return `${h}:00`;
}

function dayKey(d: Date): string {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return (n / d) * 100;
}

function p95(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const arr = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(arr.length - 1, Math.ceil(arr.length * 0.95) - 1));
  return arr[idx];
}

router.get("/dashboard", requireAdminKey, async (req, res) => {
  try {
    const range = String(req.query.range || "24h");
    // 当前先固定 24h（你前端就是 24h dashboard）
    const now = new Date();
    const toISO = now.toISOString();
    const from = new Date(now.getTime() - 24 * 3600 * 1000);
    const fromISO = from.toISOString();

    // 如果你未来要按 org 做 RBAC，这里可以加 orgId
    // 目前沿用你 admin.ts 的 default org 策略：直接聚合全库或按 org 过滤
    // 为了保持一致，我们复用你 admin.ts 的 default org 策略（slug=default / first org）
    const org =
      (await prisma.organization.findUnique({
        where: { slug: "default" },
        select: { id: true },
      })) ||
      (await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }));

    const orgId = org?.id || null;

    const where24h: any = { createdAt: { gte: from } };
    if (orgId) where24h.orgId = orgId;

    /** 1) 基础聚合：总量/错误率 */
    const totalAgg = await prisma.request.aggregate({
      where: where24h,
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
    });

    const errorAgg = await prisma.request.aggregate({
      where: { ...where24h, success: false },
      _count: { _all: true },
    });

    /** 2) p95 latency：简单实现（近 24h latencyMs 不大就直接拉） */
    const latencyRows = await prisma.request.findMany({
      where: where24h,
      select: { latencyMs: true },
      take: 5000, // 防止极端大流量；真大流量建议换 ClickHouse/聚合表
      orderBy: { createdAt: "desc" },
    });

    const latVals = latencyRows
      .map((r) => (typeof r.latencyMs === "number" ? r.latencyMs : null))
      .filter((x): x is number => x !== null);

    const p95LatencyMs = p95(latVals);

    /** 3) Active Keys：从 ApiKey 表拿（按 org） */
    const keys = await prisma.apiKey.findMany({
      where: orgId ? { orgId } : undefined,
      select: { id: true, name: true, status: true, revokedAt: true, lastUsedAt: true },
    });

    const activeKeys = keys.filter((k) => k.status === "ACTIVE" && !k.revokedAt).length;

    /** 4) timeseries 24 桶：把 Request 拉出来按小时累加（够用版） */
    const reqRows = await prisma.request.findMany({
      where: where24h,
      select: {
        createdAt: true,
        totalTokens: true,
        estimatedCostUsd: true,
        success: true,
        model: true,
        apiKeyId: true,
      },
      take: 20000, // 同理：真大流量建议用 UsageDaily / ClickHouse
      orderBy: { createdAt: "asc" },
    });

    const buckets: Record<string, { hour: string; requests: number; tokens: number; costUSD: number }> =
      {};

    // 先填满 24h 的 hour 轴，避免缺点导致图表抽风
    for (let i = 0; i < 24; i++) {
      const d = new Date(from.getTime() + i * 3600 * 1000);
      const hk = hourKey(d);
      buckets[hk] = { hour: hk, requests: 0, tokens: 0, costUSD: 0 };
    }

    // 让 apiKeyId -> keyName/env 可用
    const keyMetaById = new Map<string, { name: string; env: EnvKey; lastUsedAt?: Date | null }>();
    for (const k of keys) {
      keyMetaById.set(k.id, {
        name: k.name,
        env: toEnvFromKeyName(k.name),
        lastUsedAt: k.lastUsedAt,
      });
    }

    // env / keyUsage / modelBreakdown 累加器
    const envAgg: Record<EnvKey, { env: EnvKey; requests: number; tokens: number; costUSD: number }> =
      {
        prod: { env: "prod", requests: 0, tokens: 0, costUSD: 0 },
        dev: { env: "dev", requests: 0, tokens: 0, costUSD: 0 },
      };

    const keyAgg = new Map<
      string,
      { key: string; env: EnvKey; requests: number; tokens: number; costUSD: number; lastUsedISO?: string }
    >();

    const modelAgg = new Map<string, { model: string; tokens: number; requests: number; costUSD: number }>();

    for (const r of reqRows) {
      const hk = hourKey(new Date(r.createdAt));
      const b = buckets[hk] || (buckets[hk] = { hour: hk, requests: 0, tokens: 0, costUSD: 0 });

      const tok = Number(r.totalTokens || 0);
      const cost = Number(r.estimatedCostUsd || 0);

      b.requests += 1;
      b.tokens += tok;
      b.costUSD += cost;

      // env / key
      const apiKeyId = r.apiKeyId ? String(r.apiKeyId) : "";
      const meta = apiKeyId ? keyMetaById.get(apiKeyId) : undefined;
      const env: EnvKey = meta?.env || "prod";
      envAgg[env].requests += 1;
      envAgg[env].tokens += tok;
      envAgg[env].costUSD += cost;

      if (apiKeyId) {
        const keyName = meta?.name || apiKeyId;
        const item =
          keyAgg.get(apiKeyId) ||
          ({
            key: keyName,
            env,
            requests: 0,
            tokens: 0,
            costUSD: 0,
            lastUsedISO: meta?.lastUsedAt ? meta.lastUsedAt.toISOString() : undefined,
          } as const);
        // clone 可变
        const next = { ...item };
        next.requests += 1;
        next.tokens += tok;
        next.costUSD += cost;
        keyAgg.set(apiKeyId, next);
      }

      // model
      const model = String(r.model || "unknown") || "unknown";
      const m = modelAgg.get(model) || { model, tokens: 0, requests: 0, costUSD: 0 };
      m.requests += 1;
      m.tokens += tok;
      m.costUSD += cost;
      modelAgg.set(model, m);
    }

    const timeseries24h = Object.values(buckets)
      .sort((a, b) => a.hour.localeCompare(b.hour))
      .map((x) => ({
        hour: x.hour,
        requests: x.requests,
        tokens: x.tokens,
        costUSD: Number(x.costUSD.toFixed(4)),
      }));

    const modelBreakdown = Array.from(modelAgg.values())
      .sort((a, b) => b.costUSD - a.costUSD)
      .map((m) => ({
        model: m.model,
        tokens: m.tokens,
        requests: m.requests,
        costUSD: Number(m.costUSD.toFixed(4)),
      }));

    const envSegmentation = (["prod", "dev"] as const).map((k) => ({
      env: k,
      requests: envAgg[k].requests,
      tokens: envAgg[k].tokens,
      costUSD: Number(envAgg[k].costUSD.toFixed(4)),
    }));

    const keyUsage = Array.from(keyAgg.values())
      .sort((a, b) => b.costUSD - a.costUSD)
      .slice(0, 50)
      .map((k) => ({
        key: k.key,
        env: k.env,
        requests: k.requests,
        tokens: k.tokens,
        costUSD: Number(k.costUSD.toFixed(4)),
        lastUsedISO: k.lastUsedISO,
      }));

    /** 5) forecast7d：用近 7 天日均 cost 外推 */
    const from7d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const where7d: any = { createdAt: { gte: from7d } };
    if (orgId) where7d.orgId = orgId;

    const rows7d = await prisma.request.findMany({
      where: where7d,
      select: { createdAt: true, estimatedCostUsd: true },
      take: 20000,
      orderBy: { createdAt: "asc" },
    });

    const costByDay = new Map<string, number>();
    for (const r of rows7d) {
      const dk = dayKey(new Date(r.createdAt));
      costByDay.set(dk, (costByDay.get(dk) || 0) + Number(r.estimatedCostUsd || 0));
    }

    // 近 7 天（含今天）缺失日补 0
    const dayKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      dayKeys.push(dayKey(d));
    }
    const costs = dayKeys.map((k) => costByDay.get(k) || 0);
    const avgDaily = costs.reduce((a, b) => a + b, 0) / Math.max(1, costs.length);

    const forecast7d = Array.from({ length: 7 }).map((_, i) => ({
      day: `D${i + 1}`,
      forecastCostUSD: Number((avgDaily * (1 + i * 0.06)).toFixed(4)),
    }));

    const totalRequests = Number(totalAgg._count._all || 0);
    const totalTokens = Number(totalAgg._sum.totalTokens || 0);
    const totalCostUSD = Number(totalAgg._sum.estimatedCostUsd || 0);
    const errorCount = Number(errorAgg._count._all || 0);

    return res.json({
      range: { fromISO, toISO },
      kpis: {
        requests24h: totalRequests,
        tokens24h: totalTokens,
        cost24hUSD: Number(totalCostUSD.toFixed(4)),
        activeKeys,
        p95LatencyMs,
        errorRatePct: Number(pct(errorCount, totalRequests).toFixed(4)),
      },
      timeseries24h,
      modelBreakdown,
      envSegmentation,
      keyUsage,
      forecast7d,
    });
  } catch (e: any) {
    console.error("[admin/dashboard] error:", e?.message || e, e);
    return res.status(500).json({ success: false, error: e?.message || "dashboard_failed" });
  }
});

export default router;