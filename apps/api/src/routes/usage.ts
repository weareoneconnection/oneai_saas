import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireApiKey, type AuthedRequest } from "../core/security/auth.js";

const router = Router();

router.use(requireApiKey);

function getOrgId(req: AuthedRequest): string | null {
  return req.auth?.orgId || req.auth?.apiKey?.orgId || null;
}

function rangeToDate(range: string): Date | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 3600 * 1000);
  if (range === "7d") return new Date(now - 7 * 24 * 3600 * 1000);
  if (range === "30d") return new Date(now - 30 * 24 * 3600 * 1000);
  if (range === "90d") return new Date(now - 90 * 24 * 3600 * 1000);
  return new Date(now - 30 * 24 * 3600 * 1000);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

router.get("/summary", async (req, res) => {
  const r = req as AuthedRequest;
  const orgId = getOrgId(r);
  if (!orgId) return res.status(401).json({ success: false, error: "Missing org" });

  const from = rangeToDate(String(req.query.range || "30d"));
  const where: any = { orgId };
  if (from) where.createdAt = { gte: from };

  const [total, errors, byTask, byModel] = await Promise.all([
    prisma.request.aggregate({
      where,
      _count: { _all: true },
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true, estimatedCostUsd: true },
    }),
    prisma.request.aggregate({
      where: { ...where, success: false },
      _count: { _all: true },
    }),
    prisma.request.groupBy({
      by: ["task"],
      where,
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _count: { id: "desc" } },
      take: 25,
    } as any),
    prisma.request.groupBy({
      by: ["provider", "model"],
      where,
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _count: { id: "desc" } },
      take: 25,
    } as any),
  ]);

  return res.json({
    success: true,
    data: {
      range: String(req.query.range || "30d"),
      requests: total._count._all,
      errors: errors._count._all,
      promptTokens: total._sum.promptTokens || 0,
      completionTokens: total._sum.completionTokens || 0,
      totalTokens: total._sum.totalTokens || 0,
      costUsd: Number(total._sum.estimatedCostUsd || 0),
      byTask: byTask.map((x: any) => ({
        task: x.task,
        requests: x._count._all,
        tokens: x._sum.totalTokens || 0,
        costUsd: Number(x._sum.estimatedCostUsd || 0),
      })),
      byModel: byModel.map((x: any) => ({
        provider: x.provider || "unknown",
        model: x.model || "unknown",
        requests: x._count._all,
        tokens: x._sum.totalTokens || 0,
        costUsd: Number(x._sum.estimatedCostUsd || 0),
      })),
    },
  });
});

router.get("/daily", async (req, res) => {
  const r = req as AuthedRequest;
  const orgId = getOrgId(r);
  if (!orgId) return res.status(401).json({ success: false, error: "Missing org" });

  const from = rangeToDate(String(req.query.range || "30d"));
  const where: any = { orgId };
  if (from) where.createdAt = { gte: from };

  const rows = await prisma.request.findMany({
    where,
    select: { createdAt: true, totalTokens: true, estimatedCostUsd: true, success: true },
    orderBy: { createdAt: "asc" },
    take: 50000,
  });

  const days = new Map<string, { day: string; requests: number; errors: number; tokens: number; costUsd: number }>();
  for (const row of rows) {
    const day = dayKey(row.createdAt);
    const item = days.get(day) || { day, requests: 0, errors: 0, tokens: 0, costUsd: 0 };
    item.requests += 1;
    item.errors += row.success ? 0 : 1;
    item.tokens += Number(row.totalTokens || 0);
    item.costUsd += Number(row.estimatedCostUsd || 0);
    days.set(day, item);
  }

  return res.json({
    success: true,
    data: Array.from(days.values()).map((x) => ({
      ...x,
      costUsd: Number(x.costUsd.toFixed(6)),
    })),
  });
});

export default router;
