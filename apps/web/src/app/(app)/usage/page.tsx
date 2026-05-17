"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { SignInRequired, isConsoleAccessNotice } from "@/components/auth/SignInRequired";
import { useI18n } from "@/lib/i18n";

type UsageResp = {
  totalRequests: number;
  errorCount?: number;
  errorRatePct?: number;
  avgLatencyMs?: number | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens: number;
  totalCostUSD: number;
  byProvider?: { provider: string; requests: number; errorCount?: number; errorRatePct?: number; tokens: number; costUSD: number }[];
  byModel: { provider?: string; model: string; requests: number; errorCount?: number; tokens: number; costUSD: number }[];
  byTask?: { task: string; requests: number; errorCount?: number; tokens: number; costUSD: number }[];
  byKey?: { apiKeyId: string | null; name: string; prefix: string | null; requests: number; tokens: number; costUSD: number }[];
  recent: { id: string; type: string; provider?: string | null; model: string | null; success?: boolean; error?: string | null; latencyMs?: number | null; tokens: number; costUSD: number; createdAt: string }[];
  executionSummary?: {
    total: number;
    succeeded: number;
    failed: number;
    running: number;
    pending: number;
    withProof: number;
    withResult: number;
  };
  recentExecutions?: {
    id: string;
    handoffId: string;
    agentPlanId?: string | null;
    executorType: string;
    executorRunId?: string | null;
    objective: string;
    status: string;
    approvalMode: string;
    approvalRequired: boolean;
    hasProof: boolean;
    hasResult: boolean;
    apiKeyId?: string | null;
    apiKey?: { prefix?: string | null; name?: string | null } | null;
    createdAt: string;
    updatedAt: string;
  }[];
};

type RangeKey = "7d" | "30d" | "all";
type ViewKey = "models" | "tasks" | "keys" | "providers";

const DEFAULT_RESELL_MARKUP = 2.5;

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur">
      <div className="text-xs text-black/55">{label}</div>
      <div className="mt-2 text-xl font-semibold text-black">{value}</div>
      {sub ? <div className="mt-1 text-xs text-black/45">{sub}</div> : null}
    </div>
  );
}

async function safeJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function UsagePage() {
  const { isZh } = useI18n();
  const [range, setRange] = useState<RangeKey>("30d");
  const [view, setView] = useState<ViewKey>("models");
  const [data, setData] = useState<UsageResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const c = {
    console: isZh ? "控制台" : "Console",
    usage: isZh ? "用量" : "Usage",
    range: isZh ? "范围" : "Range",
    title: isZh ? "用量分析" : "Usage",
    subtitle: isZh ? "请求、tokens、成本、失败率和最近网关活动。" : "Requests, tokens, cost, failures, and recent gateway activity.",
    last7: isZh ? "最近 7 天" : "Last 7 days",
    last30: isZh ? "最近 30 天" : "Last 30 days",
    all: isZh ? "全部时间" : "All time",
    refresh: isZh ? "刷新" : "Refresh",
    loading: isZh ? "加载中..." : "Loading...",
    empty: isZh ? "暂无数据。先用 API key 发起几次请求，然后刷新。" : "No data yet. Trigger a few requests via your API key, then refresh.",
    totalRequests: isZh ? "总请求数" : "Total requests",
    totalTokens: isZh ? "总 tokens" : "Total tokens",
    estimatedCost: isZh ? "预估成本" : "Estimated cost",
    aggregatedLogs: isZh ? "来自请求日志汇总" : "Aggregated from request logs",
    errorRate: isZh ? "错误率" : "Error rate",
    failed: isZh ? "失败" : "failed",
    avgLatency: isZh ? "平均延迟" : "Avg latency",
    noTokenCost: isZh ? "暂无 token 成本" : "No token cost yet",
    costMargin: isZh ? "成本与毛利控制" : "Cost and Margin Control",
    costMarginDesc: isZh ? "API 转售定价的运营方估算，实际客户价格请在商业套餐中设置。" : "Operator estimate for API resale pricing. Adjust the actual customer price in your commercial plan.",
    providerCost: isZh ? "上游成本" : "Provider cost",
    providerCostSub: isZh ? "预估模型进货成本" : "Your estimated upstream model spend",
    suggestedResale: isZh ? "建议转售收入" : "Suggested resale",
    markupRef: isZh ? "倍加价参考" : "x markup reference",
    grossProfit: isZh ? "毛利" : "Gross profit",
    grossProfitSub: isZh ? "未扣除基础设施、支持和支付费用" : "Before infra, support, and payment fees",
    grossMargin: isZh ? "毛利率" : "Gross margin",
    referenceOnly: isZh ? "仅作参考" : "Reference only",
    pricingNote: isZh
      ? "价格提示：OneAI 记录预估上游成本。对外付费套餐应叠加产品毛利、支持成本、支付手续费和风险缓冲。"
      : "Pricing note: OneAI logs estimated provider cost. Customer billing should add your product margin, support cost, payment fees, and risk buffer before you expose a public paid plan.",
    agentOsLink: isZh ? "Agent OS 用量关联" : "Agent OS Usage Link",
    agentOsDesc: isZh ? "该账号生成的 handoff 合约，与普通 API 请求和成本放在一起追踪。" : "Handoff contracts generated by this account, linked beside normal API requests and costs.",
    executions: isZh ? "执行记录" : "Executions",
    succeeded: isZh ? "成功" : "Succeeded",
    proofReceived: isZh ? "收到证明" : "Proof received",
    resultsStored: isZh ? "结果入库" : "Results stored",
    operationalSignals: isZh ? "运营信号" : "Operational Signals",
    operationalSignalsDesc: isZh ? "快速检查流量、成本、失败和 task 使用情况。" : "Quick checks for traffic, cost, failures, and task adoption.",
    topTasks: isZh ? "热门 tasks" : "Top tasks",
    expensiveRecent: isZh ? "最近高成本调用" : "Expensive recent calls",
    recentFailures: isZh ? "最近失败" : "Recent failures",
    noTaskUsage: isZh ? "暂无 task 用量。" : "No task usage yet.",
    noCostCalls: isZh ? "暂无产生费用的调用。" : "No cost-bearing calls yet.",
    noFailures: isZh ? "暂无最近失败。" : "No recent failures.",
    breakdown: isZh ? "拆分统计" : "Breakdown",
    breakdownDesc: isZh ? "按模型、task、key 或 provider 对比花费和调用量。" : "Compare spend and volume by model, task, key, or provider.",
    name: isZh ? "名称" : "Name",
    requests: isZh ? "请求" : "Requests",
    errors: isZh ? "错误" : "Errors",
    tokens: "Tokens",
    cost: isZh ? "成本" : "Cost",
    noBreakdown: isZh ? "当前拆分暂无用量。" : "No usage for this breakdown yet.",
    recentRequests: isZh ? "最近请求" : "Recent requests",
    recentRequestsDesc: isZh ? "网关记录的最新调用" : "Latest calls recorded by the gateway",
    type: isZh ? "类型" : "Type",
    model: isZh ? "模型" : "Model",
    status: isZh ? "状态" : "Status",
    time: isZh ? "时间" : "Time",
    ok: isZh ? "成功" : "OK",
    noRecent: isZh ? "暂无最近请求。" : "No recent requests.",
  };

  const rangeLabel = useMemo(() => {
    if (range === "7d") return c.last7;
    if (range === "30d") return c.last30;
    return c.all;
  }, [c.all, c.last30, c.last7, range]);

  async function load(rng: RangeKey) {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/usage?range=${rng}`, { cache: "no-store" });
      const j = await safeJson(res);

      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      if (!j?.success) throw new Error(j?.error || "Failed to load usage");

      setData(j.data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load usage");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const topModels = useMemo(() => {
    if (!data?.byModel?.length) return [];
    return [...data.byModel].sort((a, b) => b.costUSD - a.costUSD).slice(0, 6);
  }, [data?.byModel]);

  const operations = useMemo(() => {
    if (!data) {
      return {
        alerts: [] as { title: string; desc: string; tone: "red" | "amber" | "green" }[],
        topTasks: [] as NonNullable<UsageResp["byTask"]>,
        failedRecent: [] as UsageResp["recent"],
        expensiveRecent: [] as UsageResp["recent"],
      };
    }

    const alerts: { title: string; desc: string; tone: "red" | "amber" | "green" }[] = [];
    const errorRate = Number(data.errorRatePct || 0);
    const cost = Number(data.totalCostUSD || 0);
    const requests = Number(data.totalRequests || 0);

    alerts.push(
      requests
        ? {
            title: "Traffic is recording",
            desc: `${fmtNum(requests)} request(s) logged in ${rangeLabel}.`,
            tone: "green",
          }
        : {
            title: "No traffic yet",
            desc: "Run a Playground request or call the API to validate logging, cost, and usage visibility.",
            tone: "amber",
          }
    );

    if (errorRate >= 5) {
      alerts.push({
        title: "High error rate",
        desc: `${errorRate.toFixed(2)}% of requests failed. Check recent failed requests and provider configuration.`,
        tone: "red",
      });
    }

    if (cost >= 5) {
      alerts.push({
        title: "Cost review recommended",
        desc: `${fmtUSD(cost)} estimated model cost in this range. Review top models and expensive requests.`,
        tone: "amber",
      });
    }

    const expensiveRecent = [...(data.recent || [])]
      .filter((row) => Number(row.costUSD || 0) > 0)
      .sort((a, b) => Number(b.costUSD || 0) - Number(a.costUSD || 0))
      .slice(0, 5);

    const failedRecent = (data.recent || []).filter((row) => row.success === false).slice(0, 5);
    const topTasks = [...(data.byTask || [])]
      .sort((a, b) => b.requests - a.requests || b.costUSD - a.costUSD)
      .slice(0, 5);

    return { alerts, topTasks, failedRecent, expensiveRecent };
  }, [data, rangeLabel]);

  const unitCost = data?.totalTokens ? data.totalCostUSD / data.totalTokens : 0;
  const commercialEstimate = useMemo(() => {
    const providerCost = Number(data?.totalCostUSD || 0);
    const suggestedRevenue = providerCost * DEFAULT_RESELL_MARKUP;
    const grossProfit = Math.max(0, suggestedRevenue - providerCost);
    const grossMarginPct = suggestedRevenue > 0 ? (grossProfit / suggestedRevenue) * 100 : 0;
    return { providerCost, suggestedRevenue, grossProfit, grossMarginPct };
  }, [data?.totalCostUSD]);

  const sortedRows = useMemo(() => {
    if (!data) return [];
    if (view === "tasks") {
      return (data.byTask || []).map((row) => ({
        key: row.task,
        label: row.task,
        sub: "task",
        requests: row.requests,
        errors: row.errorCount || 0,
        tokens: row.tokens,
        costUSD: row.costUSD,
      }));
    }
    if (view === "keys") {
      return (data.byKey || []).map((row) => ({
        key: row.apiKeyId || row.name,
        label: row.name,
        sub: row.prefix ? `prefix ${row.prefix}` : "api key",
        requests: row.requests,
        errors: 0,
        tokens: row.tokens,
        costUSD: row.costUSD,
      }));
    }
    if (view === "providers") {
      return (data.byProvider || []).map((row) => ({
        key: row.provider,
        label: row.provider,
        sub: "provider",
        requests: row.requests,
        errors: row.errorCount || 0,
        tokens: row.tokens,
        costUSD: row.costUSD,
      }));
    }
    return (data.byModel || []).map((row) => ({
      key: `${row.provider || ""}:${row.model}`,
      label: row.model,
      sub: row.provider || "model",
      requests: row.requests,
      errors: row.errorCount || 0,
      tokens: row.tokens,
      costUSD: row.costUSD,
    }));
  }, [data, view]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{c.console}</Badge>
            <Badge>{c.usage}</Badge>
            <span className="text-xs text-black/45">
              {c.range}: <b className="text-black">{rangeLabel}</b>
            </span>
            {err && !isConsoleAccessNotice(err) ? <span className="text-xs text-red-600">Error: {err}</span> : null}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-black">{c.title}</h1>
          <p className="mt-1 text-sm text-black/55">{c.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className="min-w-[180px]">
            <option value="7d">{c.last7}</option>
            <option value="30d">{c.last30}</option>
            <option value="all">{c.all}</option>
          </Select>

          <Button variant="secondary" onClick={() => load(range)} disabled={loading} className="whitespace-nowrap">
            {loading ? c.loading : c.refresh}
          </Button>
        </div>
      </div>

      {err && isConsoleAccessNotice(err) ? <SignInRequired message={err} /> : null}

      {/* Empty */}
      {!data ? (
        <Card>
          <CardContent className="p-6">
            <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-black/70">
              {c.empty}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI */}
          <div className="grid gap-3 md:grid-cols-5">
            <Stat label={c.totalRequests} value={fmtNum(data.totalRequests)} />
            <Stat label={c.totalTokens} value={fmtNum(data.totalTokens)} />
            <Stat label={c.estimatedCost} value={fmtUSD(data.totalCostUSD)} sub={c.aggregatedLogs} />
            <Stat label={c.errorRate} value={`${Number(data.errorRatePct || 0).toFixed(2)}%`} sub={`${fmtNum(data.errorCount || 0)} ${c.failed}`} />
            <Stat label={c.avgLatency} value={data.avgLatencyMs ? `${fmtNum(data.avgLatencyMs)}ms` : "—"} sub={unitCost ? `${fmtUSD(unitCost * 1000)} / 1K tokens` : c.noTokenCost} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{c.costMargin}</CardTitle>
              <CardDescription>
                {c.costMarginDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Stat label={c.providerCost} value={fmtUSD(commercialEstimate.providerCost)} sub={c.providerCostSub} />
                <Stat label={c.suggestedResale} value={fmtUSD(commercialEstimate.suggestedRevenue)} sub={`${DEFAULT_RESELL_MARKUP}${c.markupRef}`} />
                <Stat label={c.grossProfit} value={fmtUSD(commercialEstimate.grossProfit)} sub={c.grossProfitSub} />
                <Stat label={c.grossMargin} value={`${commercialEstimate.grossMarginPct.toFixed(1)}%`} sub={c.referenceOnly} />
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                {c.pricingNote}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{c.agentOsLink}</CardTitle>
              <CardDescription>{c.agentOsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Stat label={c.executions} value={fmtNum(data.executionSummary?.total || 0)} />
                <Stat label={c.succeeded} value={fmtNum(data.executionSummary?.succeeded || 0)} />
                <Stat label={c.proofReceived} value={fmtNum(data.executionSummary?.withProof || 0)} />
                <Stat label={c.resultsStored} value={fmtNum(data.executionSummary?.withResult || 0)} />
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-white/60">
                <div className="min-w-[820px]">
                  <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                    <div className="col-span-4">Objective</div>
                    <div className="col-span-2">Executor</div>
                    <div className="col-span-2">Key</div>
                    <div className="col-span-2">Proof / Result</div>
                    <div className="col-span-2 text-right">Updated</div>
                  </div>
                  {data.recentExecutions?.length ? (
                    data.recentExecutions.map((row) => (
                      <div key={row.id} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-xs">
                        <div className="col-span-4 min-w-0">
                          <Link href={`/executions/${encodeURIComponent(row.handoffId)}`} className="truncate font-semibold text-black underline underline-offset-4">
                            {row.objective}
                          </Link>
                          <div className="truncate font-mono text-black/40">{row.handoffId}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="font-semibold text-black">{row.executorType}</div>
                          <div className="text-black/40">{row.status}</div>
                        </div>
                        <div className="col-span-2 font-mono text-black/55">{row.apiKey?.prefix || "-"}</div>
                        <div className="col-span-2 text-black/55">
                          {row.hasProof ? "proof" : "no proof"} · {row.hasResult ? "result" : "no result"}
                        </div>
                        <div className="col-span-2 text-right text-black/45">{fmtTime(row.updatedAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-black/55">No Agent OS executions in this range.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{c.operationalSignals}</CardTitle>
              <CardDescription>{c.operationalSignalsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {operations.alerts.map((alert) => (
                  <div
                    key={alert.title}
                    className={[
                      "rounded-2xl border p-4",
                      alert.tone === "red"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : alert.tone === "amber"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-green-200 bg-green-50 text-green-800",
                    ].join(" ")}
                  >
                    <div className="text-sm font-bold">{alert.title}</div>
                    <p className="mt-2 text-sm leading-relaxed opacity-80">{alert.desc}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                  <div className="text-sm font-bold text-black">{c.topTasks}</div>
                  <div className="mt-3 space-y-2">
                    {operations.topTasks.length ? (
                      operations.topTasks.map((row) => (
                        <div key={row.task} className="flex items-center justify-between gap-3 text-sm">
                          <code className="truncate text-xs text-black/70">{row.task}</code>
                          <span className="shrink-0 font-semibold text-black">{fmtNum(row.requests)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-black/50">{c.noTaskUsage}</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                  <div className="text-sm font-bold text-black">{c.expensiveRecent}</div>
                  <div className="mt-3 space-y-2">
                    {operations.expensiveRecent.length ? (
                      operations.expensiveRecent.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
                          <code className="truncate text-xs text-black/70">{row.model || row.type}</code>
                          <span className="shrink-0 font-semibold text-black">{fmtUSD(row.costUSD)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-black/50">{c.noCostCalls}</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                  <div className="text-sm font-bold text-black">{c.recentFailures}</div>
                  <div className="mt-3 space-y-2">
                    {operations.failedRecent.length ? (
                      operations.failedRecent.map((row) => (
                        <div key={row.id} className="text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <code className="truncate text-xs text-black/70">{row.type}</code>
                            <span className="shrink-0 text-xs font-semibold text-red-700">{fmtTime(row.createdAt)}</span>
                          </div>
                          {row.error ? <div className="mt-1 line-clamp-2 text-xs text-black/45">{row.error}</div> : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-black/50">{c.noFailures}</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdowns */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>{c.breakdown}</CardTitle>
                  <CardDescription>{c.breakdownDesc}</CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["models", "tasks", "keys", "providers"] as ViewKey[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setView(item)}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                        view === item ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/60",
                      ].join(" ")}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/60">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                    <div className="col-span-4">{c.name}</div>
                    <div className="col-span-2 text-right">{c.requests}</div>
                    <div className="col-span-2 text-right">{c.errors}</div>
                    <div className="col-span-2 text-right">{c.tokens}</div>
                    <div className="col-span-2 text-right">{c.cost}</div>
                  </div>

                  {sortedRows.length ? (
                    sortedRows.map((m) => (
                      <div key={m.key} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm">
                      <div className="col-span-4 min-w-0">
                        <code className="break-all rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black/75">
                          {m.label}
                        </code>
                        <div className="mt-1 text-xs text-black/40">{m.sub}</div>
                      </div>
                      <div className="col-span-2 text-right text-black/75">{fmtNum(m.requests)}</div>
                      <div className="col-span-2 text-right text-black/75">{fmtNum(m.errors)}</div>
                      <div className="col-span-2 text-right text-black/75">{fmtNum(m.tokens)}</div>
                      <div className="col-span-2 text-right font-semibold text-black">{fmtUSD(m.costUSD)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-black/60">{c.noBreakdown}</div>
                  )}
                </div>
              </div>
              {topModels.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-black/50">
                  <span>Top models by cost:</span>
                  {topModels.map((m) => (
                    <span key={`${m.provider || ""}:${m.model}`} className="rounded-full border border-black/10 bg-white/60 px-2 py-0.5">
                      {m.model}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Recent */}
          <Card>
            <CardHeader>
              <CardTitle>{c.recentRequests}</CardTitle>
              <CardDescription>{c.recentRequestsDesc}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/60">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                    <div className="col-span-2">ID</div>
                    <div className="col-span-2">{c.type}</div>
                    <div className="col-span-2">{c.model}</div>
                    <div className="col-span-2 text-right">{c.tokens}</div>
                    <div className="col-span-1 text-right">{c.cost}</div>
                    <div className="col-span-1 text-right">{c.status}</div>
                    <div className="col-span-2 text-right">{c.time}</div>
                  </div>

                  {data.recent?.length ? (
                    data.recent.map((r) => (
                      <div key={r.id} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm">
                      <div className="col-span-2">
                        <code className="text-xs text-black/75">{r.id.slice(0, 8)}</code>
                      </div>
                      <div className="col-span-2 text-black/75">{r.type}</div>
                      <div className="col-span-2">
                        <code className="text-xs text-black/75">{r.model || "-"}</code>
                        {r.provider ? <div className="mt-1 text-xs text-black/40">{r.provider}</div> : null}
                      </div>
                      <div className="col-span-2 text-right text-black/75">{fmtNum(r.tokens)}</div>
                      <div className="col-span-1 text-right text-black/75">
                        {fmtUSD(r.costUSD)}
                        <div className="mt-1 text-[11px] text-black/35">
                          {r.costUSD > 0 ? "model price x tokens" : "no price / no charge"}
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <span title={r.error || undefined} className={["rounded-full px-2 py-0.5 text-xs", r.success === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"].join(" ")}>
                          {r.success === false ? c.failed : c.ok}
                        </span>
                        {r.latencyMs ? <div className="mt-1 text-xs text-black/35">{r.latencyMs}ms</div> : null}
                      </div>
                      <div className="col-span-2 text-right text-black/55">{fmtTime(r.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-black/60">{c.noRecent}</div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-xs text-black/45">
                Tip: later we can add env segmentation (prod/dev) and key-level grouping once those fields exist in logs.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
