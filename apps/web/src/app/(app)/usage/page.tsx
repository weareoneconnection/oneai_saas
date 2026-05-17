"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

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
};

type RangeKey = "7d" | "30d" | "all";
type ViewKey = "models" | "tasks" | "keys" | "providers";

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
  const [range, setRange] = useState<RangeKey>("30d");
  const [view, setView] = useState<ViewKey>("models");
  const [data, setData] = useState<UsageResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const rangeLabel = useMemo(() => {
    if (range === "7d") return "Last 7 days";
    if (range === "30d") return "Last 30 days";
    return "All time";
  }, [range]);

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
            <Badge>Console</Badge>
            <Badge>Usage</Badge>
            <span className="text-xs text-black/45">
              Range: <b className="text-black">{rangeLabel}</b>
            </span>
            {err ? <span className="text-xs text-red-600">Error: {err}</span> : null}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-black">Usage</h1>
          <p className="mt-1 text-sm text-black/55">Requests, tokens, cost, failures, and recent gateway activity.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className="min-w-[180px]">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All</option>
          </Select>

          <Button variant="secondary" onClick={() => load(range)} disabled={loading} className="whitespace-nowrap">
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Empty */}
      {!data ? (
        <Card>
          <CardContent className="p-6">
            <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-black/70">
              No data yet. Trigger a few requests via your API key, then refresh.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI */}
          <div className="grid gap-3 md:grid-cols-5">
            <Stat label="Total requests" value={fmtNum(data.totalRequests)} />
            <Stat label="Total tokens" value={fmtNum(data.totalTokens)} />
            <Stat label="Estimated cost" value={fmtUSD(data.totalCostUSD)} sub="Aggregated from request logs" />
            <Stat label="Error rate" value={`${Number(data.errorRatePct || 0).toFixed(2)}%`} sub={`${fmtNum(data.errorCount || 0)} failed`} />
            <Stat label="Avg latency" value={data.avgLatencyMs ? `${fmtNum(data.avgLatencyMs)}ms` : "—"} sub={unitCost ? `${fmtUSD(unitCost * 1000)} / 1K tokens` : "No token cost yet"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Operational Signals</CardTitle>
              <CardDescription>Quick checks for traffic, cost, failures, and task adoption.</CardDescription>
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
                  <div className="text-sm font-bold text-black">Top tasks</div>
                  <div className="mt-3 space-y-2">
                    {operations.topTasks.length ? (
                      operations.topTasks.map((row) => (
                        <div key={row.task} className="flex items-center justify-between gap-3 text-sm">
                          <code className="truncate text-xs text-black/70">{row.task}</code>
                          <span className="shrink-0 font-semibold text-black">{fmtNum(row.requests)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-black/50">No task usage yet.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                  <div className="text-sm font-bold text-black">Expensive recent calls</div>
                  <div className="mt-3 space-y-2">
                    {operations.expensiveRecent.length ? (
                      operations.expensiveRecent.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
                          <code className="truncate text-xs text-black/70">{row.model || row.type}</code>
                          <span className="shrink-0 font-semibold text-black">{fmtUSD(row.costUSD)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-black/50">No cost-bearing calls yet.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                  <div className="text-sm font-bold text-black">Recent failures</div>
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
                      <div className="text-sm text-black/50">No recent failures.</div>
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
                  <CardTitle>Breakdown</CardTitle>
                  <CardDescription>Compare spend and volume by model, task, key, or provider.</CardDescription>
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
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2 text-right">Requests</div>
                    <div className="col-span-2 text-right">Errors</div>
                    <div className="col-span-2 text-right">Tokens</div>
                    <div className="col-span-2 text-right">Cost</div>
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
                    <div className="p-4 text-sm text-black/60">No usage for this breakdown yet.</div>
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
              <CardTitle>Recent requests</CardTitle>
              <CardDescription>Latest calls recorded by the gateway</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/60">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                    <div className="col-span-2">ID</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Model</div>
                    <div className="col-span-2 text-right">Tokens</div>
                    <div className="col-span-1 text-right">Status</div>
                    <div className="col-span-2 text-right">Time</div>
                  </div>

                  {data.recent?.length ? (
                    data.recent.map((r) => (
                      <div key={r.id} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm">
                      <div className="col-span-2">
                        <code className="text-xs text-black/75">{r.id.slice(0, 8)}</code>
                      </div>
                      <div className="col-span-2 text-black/75">{r.type}</div>
                      <div className="col-span-3">
                        <code className="text-xs text-black/75">{r.model || "-"}</code>
                        {r.provider ? <div className="mt-1 text-xs text-black/40">{r.provider}</div> : null}
                      </div>
                      <div className="col-span-2 text-right text-black/75">{fmtNum(r.tokens)}</div>
                      <div className="col-span-1 text-right">
                        <span title={r.error || undefined} className={["rounded-full px-2 py-0.5 text-xs", r.success === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"].join(" ")}>
                          {r.success === false ? "Failed" : "OK"}
                        </span>
                        {r.latencyMs ? <div className="mt-1 text-xs text-black/35">{r.latencyMs}ms</div> : null}
                      </div>
                      <div className="col-span-2 text-right text-black/55">{fmtTime(r.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-black/60">No recent requests.</div>
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
