// apps/web/src/app/dashboard/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type EnvKey = "prod" | "dev";

type DashboardPayload = {
  range: { fromISO: string; toISO: string };
  kpis: {
    requests24h: number;
    tokens24h: number;
    cost24hUSD: number;
    activeKeys: number;
    p95LatencyMs?: number;
    errorRatePct?: number;
  };
  timeseries24h: Array<{ hour: string; requests: number; tokens: number; costUSD: number }>;
  modelBreakdown: Array<{ model: string; tokens: number; requests: number; costUSD: number }>;
  envSegmentation: Array<{ env: EnvKey; requests: number; tokens: number; costUSD: number }>;
  keyUsage: Array<{
    key: string;
    env: EnvKey;
    requests: number;
    tokens: number;
    costUSD: number;
    lastUsedISO?: string;
  }>;
  forecast7d: Array<{ day: string; forecastCostUSD: number }>;
};

type ModelRow = {
  provider: string;
  model: string;
  configured?: boolean;
  hasPricing?: boolean;
  health?: { ok: boolean; testedAt: string; latencyMs?: number; error?: string } | null;
};

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function pct(n?: number) {
  if (n === undefined) return "—";
  return `${n.toFixed(2)}%`;
}

function buildMock(): DashboardPayload {
  const now = new Date();
  const toISO = now.toISOString();
  const fromISO = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  const timeseries24h = Array.from({ length: 24 }).map((_, i) => {
    const h = i.toString().padStart(2, "0");
    const requests = Math.floor(250 + Math.random() * 700);
    const tokens = Math.floor(requests * (400 + Math.random() * 900));
    const costUSD = Number((tokens / 1_000_000 * (2.2 + Math.random() * 1.2)).toFixed(2));
    return { hour: `${h}:00`, requests, tokens, costUSD };
  });

  const sumReq = timeseries24h.reduce((a, b) => a + b.requests, 0);
  const sumTok = timeseries24h.reduce((a, b) => a + b.tokens, 0);
  const sumCost = Number(timeseries24h.reduce((a, b) => a + b.costUSD, 0).toFixed(2));

  const modelBreakdown = [
    { model: "gpt-4o", tokens: Math.floor(sumTok * 0.38), requests: Math.floor(sumReq * 0.34), costUSD: Number((sumCost * 0.42).toFixed(2)) },
    { model: "gpt-4o-mini", tokens: Math.floor(sumTok * 0.32), requests: Math.floor(sumReq * 0.40), costUSD: Number((sumCost * 0.25).toFixed(2)) },
    { model: "claude-3", tokens: Math.floor(sumTok * 0.18), requests: Math.floor(sumReq * 0.16), costUSD: Number((sumCost * 0.22).toFixed(2)) },
    { model: "deepseek", tokens: Math.floor(sumTok * 0.12), requests: Math.floor(sumReq * 0.10), costUSD: Number((sumCost * 0.11).toFixed(2)) },
  ];

  const envSegmentation = [
    { env: "prod" as const, requests: Math.floor(sumReq * 0.78), tokens: Math.floor(sumTok * 0.82), costUSD: Number((sumCost * 0.86).toFixed(2)) },
    { env: "dev" as const, requests: Math.floor(sumReq * 0.22), tokens: Math.floor(sumTok * 0.18), costUSD: Number((sumCost * 0.14).toFixed(2)) },
  ];

  const keyUsage = [
    { key: "prod_live_1", env: "prod" as const, requests: Math.floor(sumReq * 0.32), tokens: Math.floor(sumTok * 0.34), costUSD: Number((sumCost * 0.32).toFixed(2)), lastUsedISO: new Date(now.getTime() - 2 * 60 * 1000).toISOString() },
    { key: "prod_live_2", env: "prod" as const, requests: Math.floor(sumReq * 0.24), tokens: Math.floor(sumTok * 0.27), costUSD: Number((sumCost * 0.26).toFixed(2)), lastUsedISO: new Date(now.getTime() - 15 * 60 * 1000).toISOString() },
    { key: "prod_batch", env: "prod" as const, requests: Math.floor(sumReq * 0.22), tokens: Math.floor(sumTok * 0.21), costUSD: Number((sumCost * 0.19).toFixed(2)), lastUsedISO: new Date(now.getTime() - 45 * 60 * 1000).toISOString() },
    { key: "dev_key_1", env: "dev" as const, requests: Math.floor(sumReq * 0.14), tokens: Math.floor(sumTok * 0.10), costUSD: Number((sumCost * 0.10).toFixed(2)), lastUsedISO: new Date(now.getTime() - 4 * 3600 * 1000).toISOString() },
    { key: "dev_key_2", env: "dev" as const, requests: Math.floor(sumReq * 0.08), tokens: Math.floor(sumTok * 0.08), costUSD: Number((sumCost * 0.13).toFixed(2)), lastUsedISO: new Date(now.getTime() - 10 * 3600 * 1000).toISOString() },
  ];

  const forecast7d = Array.from({ length: 7 }).map((_, i) => ({
    day: `D${i + 1}`,
    forecastCostUSD: Number((sumCost / 24 * 24 * (0.95 + i * 0.06)).toFixed(2)),
  }));

  return {
    range: { fromISO, toISO },
    kpis: {
      requests24h: sumReq,
      tokens24h: sumTok,
      cost24hUSD: sumCost,
      activeKeys: 5,
      p95LatencyMs: 860,
      errorRatePct: 0.42,
    },
    timeseries24h,
    modelBreakdown,
    envSegmentation,
    keyUsage,
    forecast7d,
  };
}

function KpiCard(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur">
      <div className="text-xs text-black/55">{props.label}</div>
      <div className="mt-2 text-xl font-semibold text-black">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-black/45">{props.sub}</div> : null}
    </div>
  );
}

function EnvPill({ env }: { env: EnvKey }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        env === "prod" ? "bg-black text-white" : "bg-black/10 text-black",
      ].join(" ")}
    >
      {env.toUpperCase()}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload>(() => buildMock());
  const [source, setSource] = useState<"mock" | "live">("mock");
  const [models, setModels] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/analytics/dashboard", {
      cache: "no-store",
      credentials: "include", // ✅ 加这个
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DashboardPayload;
      setData(json);
      setSource("live");

      const modelRes = await fetch("/api/models", { cache: "no-store", credentials: "include" });
      const modelJson = await modelRes.json().catch(() => null);
      const modelRows = Array.isArray(modelJson?.data)
        ? modelJson.data
        : modelJson?.data?.models || [];
      setModels(modelRows);
    } catch (e: any) {
      // 没有 API 就保持 mock（正式上线也能展示）
      setData((prev) => prev || buildMock());
      setSource("mock");
      setErr(e?.message || "Failed to load live analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 有 API 就自动用 live；没 API 则不影响页面可用性
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topKeys = useMemo(() => {
    return [...data.keyUsage].sort((a, b) => b.costUSD - a.costUSD).slice(0, 8);
  }, [data.keyUsage]);

  const modelStats = useMemo(() => {
    const total = models.length;
    const configured = models.filter((m) => m.configured).length;
    const priced = models.filter((m) => m.hasPricing).length;
    const live = models.filter((m) => m.health?.ok).length;
    const failed = models.filter((m) => m.health && !m.health.ok).length;
    return { total, configured, priced, live, failed };
  }, [models]);

  const readinessItems = [
    {
      label: "Gateway",
      value: source === "live" ? "Live" : "Fallback",
      good: source === "live",
      href: "/playground",
    },
    {
      label: "Models",
      value: modelStats.configured ? `${modelStats.configured} ready` : "Check keys",
      good: modelStats.configured > 0,
      href: "/models",
    },
    {
      label: "Pricing",
      value: modelStats.priced ? `${modelStats.priced} covered` : "Incomplete",
      good: modelStats.priced > 0,
      href: "/models",
    },
    {
      label: "Errors",
      value: pct(data.kpis.errorRatePct),
      good: Number(data.kpis.errorRatePct || 0) < 2,
      href: "/usage",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Console</Badge>
            <Badge>Analytics</Badge>
            <span className="text-xs text-black/45">
              Source: <b className="text-black">{source.toUpperCase()}</b>
            </span>
            {err ? <span className="text-xs text-red-600">Live error: {err}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-black">Dashboard</h1>
          <p className="mt-1 text-sm text-black/55">
            API health, cost, keys, models, and production readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={loading}
            className="whitespace-nowrap"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setData(buildMock());
              setSource("mock");
              setErr("");
            }}
            className="whitespace-nowrap"
          >
            Use Mock
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {readinessItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg border border-black/10 bg-white p-4 transition hover:border-black/25 hover:bg-black/[0.02]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-black/50">{item.label}</div>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  item.good ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800",
                ].join(" ")}
              >
                {item.good ? "OK" : "Review"}
              </span>
            </div>
            <div className="mt-2 text-lg font-semibold text-black">{item.value}</div>
          </Link>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard label="Requests (24h)" value={fmtNum(data.kpis.requests24h)} />
        <KpiCard label="Tokens (24h)" value={fmtNum(data.kpis.tokens24h)} />
        <KpiCard label="Cost (24h)" value={fmtUSD(data.kpis.cost24hUSD)} />
        <KpiCard label="Active Keys" value={fmtNum(data.kpis.activeKeys)} />
        <KpiCard
          label="Quality"
          value={`${data.kpis.p95LatencyMs ?? "—"}ms`}
          sub={`Error rate: ${pct(data.kpis.errorRatePct)}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 24h usage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>24h Usage</CardTitle>
                <CardDescription>Requests + Cost trend</CardDescription>
              </div>
              <div className="text-xs text-black/45">
                {new Date(data.range.fromISO).toLocaleString()} →{" "}
                {new Date(data.range.toISO).toLocaleString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeseries24h}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#111111" strokeWidth={2} />
                <Line type="monotone" dataKey="costUSD" stroke="#555555" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-black/55">
              <span>— requests</span>
              <span>— costUSD</span>
            </div>
          </CardContent>
        </Card>

        {/* Env segmentation */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Segmentation</CardTitle>
            <CardDescription>prod vs dev</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.envSegmentation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="env" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#111111" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2 text-sm">
              {data.envSegmentation.map((e) => (
                <div key={e.env} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EnvPill env={e.env} />
                    <span className="text-black/70">{fmtNum(e.requests)} req</span>
                  </div>
                  <span className="text-black/45">{fmtUSD(e.costUSD)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Model Readiness</CardTitle>
            <CardDescription>Catalog, configured providers, pricing, health checks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Catalog models" value={fmtNum(modelStats.total)} />
              <KpiCard label="Configured" value={fmtNum(modelStats.configured)} />
              <KpiCard label="Priced" value={fmtNum(modelStats.priced)} />
              <KpiCard label="Live tested" value={fmtNum(modelStats.live)} sub={modelStats.failed ? `${modelStats.failed} failed` : "Health check on demand"} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/models" className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900">
                Open Models
              </Link>
              <Link href="/docs/reference/models" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]">
                Model Docs
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Commercial Readiness</CardTitle>
            <CardDescription>Next operator actions before heavier customer traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Test gateway", "Run Chat API in Playground with openai:gpt-5.2.", "/playground"],
                ["Create prod key", "Issue a separate production API key with budget limits.", "/keys"],
                ["Review usage", "Check errors, latency, cost by model, task, key, and provider.", "/usage"],
                ["Confirm billing", "Verify Stripe plan and paid access before customer launch.", "/billing"],
              ].map(([title, desc, href]) => (
                <Link key={title} href={href} className="rounded-lg border border-black/10 bg-black/[0.02] p-4 hover:border-black/25">
                  <div className="text-sm font-semibold text-black">{title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-black/55">{desc}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Model breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Breakdown</CardTitle>
            <CardDescription>Tokens / requests / cost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.modelBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="#111111" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/10">
              <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                <div className="col-span-5">Model</div>
                <div className="col-span-3 text-right">Tokens</div>
                <div className="col-span-2 text-right">Req</div>
                <div className="col-span-2 text-right">Cost</div>
              </div>
              {data.modelBreakdown.map((m) => (
                <div
                  key={m.model}
                  className="grid grid-cols-12 px-3 py-2 text-sm text-black/75"
                >
                  <div className="col-span-5 font-medium text-black">{m.model}</div>
                  <div className="col-span-3 text-right">{fmtNum(m.tokens)}</div>
                  <div className="col-span-2 text-right">{fmtNum(m.requests)}</div>
                  <div className="col-span-2 text-right">{fmtUSD(m.costUSD)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Forecast (7 days)</CardTitle>
            <CardDescription>Projected spend trend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.forecast7d}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="forecastCostUSD"
                    stroke="#111111"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-black/70">
              <div className="flex items-center justify-between">
                <span>Today (24h)</span>
                <span className="font-semibold text-black">
                  {fmtUSD(data.kpis.cost24hUSD)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Forecast (D7)</span>
                <span className="font-semibold text-black">
                  {fmtUSD(data.forecast7d[data.forecast7d.length - 1]?.forecastCostUSD ?? 0)}
                </span>
              </div>
              <div className="mt-3 text-xs text-black/45">
                Tip: you can cap cost per env / per key in Billing policies later.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key-level table */}
      <Card>
        <CardHeader>
          <div className="flex items-end justify-between gap-3">
            <div>
              <CardTitle>Key-level Usage</CardTitle>
              <CardDescription>Top keys by cost (24h)</CardDescription>
            </div>
            <Link href="/keys" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]">
              Manage Keys
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-black/10">
            <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
              <div className="col-span-4">Key</div>
              <div className="col-span-2">Env</div>
              <div className="col-span-2 text-right">Requests</div>
              <div className="col-span-2 text-right">Tokens</div>
              <div className="col-span-2 text-right">Cost</div>
            </div>

            {topKeys.map((k) => (
              <div key={k.key} className="grid grid-cols-12 px-3 py-2 text-sm">
                <div className="col-span-4">
                  <div className="font-medium text-black">{k.key}</div>
                  <div className="text-xs text-black/45">
                    {k.lastUsedISO ? `Last used: ${new Date(k.lastUsedISO).toLocaleString()}` : "Last used: —"}
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <EnvPill env={k.env} />
                </div>

                <div className="col-span-2 text-right text-black/75">{fmtNum(k.requests)}</div>
                <div className="col-span-2 text-right text-black/75">{fmtNum(k.tokens)}</div>
                <div className="col-span-2 text-right font-semibold text-black">
                  {fmtUSD(k.costUSD)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
