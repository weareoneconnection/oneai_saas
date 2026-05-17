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

type EnvKey = "prod" | "dev" | "staging";
type DashboardSource = "live" | "demo" | "empty";

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
  timeseries24h: Array<{
    hour: string;
    requests: number;
    tokens: number;
    costUSD: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    provider?: string;
    tokens: number;
    requests: number;
    costUSD: number;
  }>;
  envSegmentation: Array<{
    env: EnvKey;
    requests: number;
    tokens: number;
    costUSD: number;
  }>;
  keyUsage: Array<{
    key: string;
    env: EnvKey;
    requests: number;
    tokens: number;
    costUSD: number;
    lastUsedISO?: string;
  }>;
  forecast7d: Array<{
    day: string;
    forecastCostUSD: number;
  }>;
};

type ModelHealthStatus = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";

type ModelRow = {
  provider: string;
  model: string;
  configured?: boolean;
  available?: boolean;
  hasPricing?: boolean;
  health?: {
    ok?: boolean;
    status?: ModelHealthStatus;
    testedAt?: string | null;
    latencyMs?: number | null;
    error?: string | null;
  } | null;
};

type TaskRow = {
  id?: string;
  task?: string;
  type?: string;
  displayName?: string;
  description?: string;
  category?: string;
  tier?: string;
  maturity?: string;
  enabled?: boolean;
  inputSchema?: unknown;
  outputSchema?: unknown;
  hasInputSchema?: boolean;
  hasOutputSchema?: boolean;
};

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(Number.isFinite(n) ? n : 0));
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(n) ? n : 0);
}

function pct(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function buildEmptyData(): DashboardPayload {
  const now = new Date();
  const toISO = now.toISOString();
  const fromISO = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  return {
    range: { fromISO, toISO },
    kpis: {
      requests24h: 0,
      tokens24h: 0,
      cost24hUSD: 0,
      activeKeys: 0,
      p95LatencyMs: undefined,
      errorRatePct: undefined,
    },
    timeseries24h: [],
    modelBreakdown: [],
    envSegmentation: [],
    keyUsage: [],
    forecast7d: [],
  };
}

function buildDemoData(): DashboardPayload {
  const now = new Date();
  const toISO = now.toISOString();
  const fromISO = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  const timeseries24h = Array.from({ length: 24 }).map((_, i) => {
    const h = i.toString().padStart(2, "0");
    const requests = Math.floor(250 + Math.random() * 700);
    const tokens = Math.floor(requests * (400 + Math.random() * 900));
    const costUSD = Number(((tokens / 1_000_000) * (2.2 + Math.random() * 1.2)).toFixed(2));
    return { hour: `${h}:00`, requests, tokens, costUSD };
  });

  const sumReq = timeseries24h.reduce((a, b) => a + b.requests, 0);
  const sumTok = timeseries24h.reduce((a, b) => a + b.tokens, 0);
  const sumCost = Number(timeseries24h.reduce((a, b) => a + b.costUSD, 0).toFixed(2));

  const modelBreakdown = [
    {
      model: "gpt-4.1",
      provider: "openai",
      tokens: Math.floor(sumTok * 0.38),
      requests: Math.floor(sumReq * 0.34),
      costUSD: Number((sumCost * 0.42).toFixed(2)),
    },
    {
      model: "gpt-4.1-mini",
      provider: "openai",
      tokens: Math.floor(sumTok * 0.32),
      requests: Math.floor(sumReq * 0.4),
      costUSD: Number((sumCost * 0.25).toFixed(2)),
    },
    {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      tokens: Math.floor(sumTok * 0.18),
      requests: Math.floor(sumReq * 0.16),
      costUSD: Number((sumCost * 0.22).toFixed(2)),
    },
    {
      model: "deepseek-chat",
      provider: "deepseek",
      tokens: Math.floor(sumTok * 0.12),
      requests: Math.floor(sumReq * 0.1),
      costUSD: Number((sumCost * 0.11).toFixed(2)),
    },
  ];

  const envSegmentation = [
    {
      env: "prod" as const,
      requests: Math.floor(sumReq * 0.78),
      tokens: Math.floor(sumTok * 0.82),
      costUSD: Number((sumCost * 0.86).toFixed(2)),
    },
    {
      env: "dev" as const,
      requests: Math.floor(sumReq * 0.22),
      tokens: Math.floor(sumTok * 0.18),
      costUSD: Number((sumCost * 0.14).toFixed(2)),
    },
  ];

  const keyUsage = [
    {
      key: "prod_live_1",
      env: "prod" as const,
      requests: Math.floor(sumReq * 0.32),
      tokens: Math.floor(sumTok * 0.34),
      costUSD: Number((sumCost * 0.32).toFixed(2)),
      lastUsedISO: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    },
    {
      key: "prod_live_2",
      env: "prod" as const,
      requests: Math.floor(sumReq * 0.24),
      tokens: Math.floor(sumTok * 0.27),
      costUSD: Number((sumCost * 0.26).toFixed(2)),
      lastUsedISO: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      key: "prod_batch",
      env: "prod" as const,
      requests: Math.floor(sumReq * 0.22),
      tokens: Math.floor(sumTok * 0.21),
      costUSD: Number((sumCost * 0.19).toFixed(2)),
      lastUsedISO: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      key: "dev_key_1",
      env: "dev" as const,
      requests: Math.floor(sumReq * 0.14),
      tokens: Math.floor(sumTok * 0.1),
      costUSD: Number((sumCost * 0.1).toFixed(2)),
      lastUsedISO: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      key: "dev_key_2",
      env: "dev" as const,
      requests: Math.floor(sumReq * 0.08),
      tokens: Math.floor(sumTok * 0.08),
      costUSD: Number((sumCost * 0.13).toFixed(2)),
      lastUsedISO: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
    },
  ];

  const forecast7d = Array.from({ length: 7 }).map((_, i) => ({
    day: `D${i + 1}`,
    forecastCostUSD: Number(((sumCost / 24) * 24 * (0.95 + i * 0.06)).toFixed(2)),
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

function normalizeDashboardPayload(value: unknown): DashboardPayload | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as any;
  const payload = raw.data && typeof raw.data === "object" ? raw.data : raw;

  if (!payload.kpis || !payload.range) return null;

  return {
    range: {
      fromISO: String(payload.range.fromISO || new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
      toISO: String(payload.range.toISO || new Date().toISOString()),
    },
    kpis: {
      requests24h: Number(payload.kpis.requests24h || 0),
      tokens24h: Number(payload.kpis.tokens24h || 0),
      cost24hUSD: Number(payload.kpis.cost24hUSD || 0),
      activeKeys: Number(payload.kpis.activeKeys || 0),
      p95LatencyMs:
        payload.kpis.p95LatencyMs === undefined || payload.kpis.p95LatencyMs === null
          ? undefined
          : Number(payload.kpis.p95LatencyMs),
      errorRatePct:
        payload.kpis.errorRatePct === undefined || payload.kpis.errorRatePct === null
          ? undefined
          : Number(payload.kpis.errorRatePct),
    },
    timeseries24h: Array.isArray(payload.timeseries24h) ? payload.timeseries24h : [],
    modelBreakdown: Array.isArray(payload.modelBreakdown) ? payload.modelBreakdown : [],
    envSegmentation: Array.isArray(payload.envSegmentation) ? payload.envSegmentation : [],
    keyUsage: Array.isArray(payload.keyUsage) ? payload.keyUsage : [],
    forecast7d: Array.isArray(payload.forecast7d) ? payload.forecast7d : [],
  };
}

function extractRows<T>(json: any, nestedKey: string): T[] {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.[nestedKey])) return json.data[nestedKey];
  if (Array.isArray(json?.[nestedKey])) return json[nestedKey];
  return [];
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
  const [data, setData] = useState<DashboardPayload>(() => buildEmptyData());
  const [source, setSource] = useState<DashboardSource>("empty");
  const [models, setModels] = useState<ModelRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyticsErr, setAnalyticsErr] = useState<string>("");
  const [registryErr, setRegistryErr] = useState<string>("");

  const showDemoButton = process.env.NODE_ENV !== "production";

  async function refreshAnalytics() {
    const res = await fetch("/api/analytics/dashboard", {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`analytics HTTP ${res.status}`);
    }

    const json = await res.json();
    const payload = normalizeDashboardPayload(json);

    if (!payload) {
      throw new Error("analytics payload is invalid");
    }

    setData(payload);
    setSource("live");
    setAnalyticsErr("");
  }

  async function refreshRegistries() {
    const [modelResult, taskResult] = await Promise.allSettled([
      fetch("/api/models", { cache: "no-store", credentials: "include" }),
      fetch("/api/tasks", { cache: "no-store", credentials: "include" }),
    ]);

    if (modelResult.status === "fulfilled") {
      if (!modelResult.value.ok) {
        throw new Error(`models HTTP ${modelResult.value.status}`);
      }

      const modelJson = await modelResult.value.json().catch(() => null);
      setModels(extractRows<ModelRow>(modelJson, "models"));
    } else {
      throw new Error(modelResult.reason?.message || "models request failed");
    }

    if (taskResult.status === "fulfilled") {
      if (!taskResult.value.ok) {
        throw new Error(`tasks HTTP ${taskResult.value.status}`);
      }

      const taskJson = await taskResult.value.json().catch(() => null);
      setTasks(extractRows<TaskRow>(taskJson, "tasks"));
    } else {
      throw new Error(taskResult.reason?.message || "tasks request failed");
    }

    setRegistryErr("");
  }

  async function refresh() {
    setLoading(true);

    const [analyticsResult, registryResult] = await Promise.allSettled([
      refreshAnalytics(),
      refreshRegistries(),
    ]);

    if (analyticsResult.status === "rejected") {
      setAnalyticsErr(analyticsResult.reason?.message || "Failed to load live analytics");

      setData((prev) => {
        const hasAnyLiveData =
          prev.kpis.requests24h > 0 ||
          prev.kpis.tokens24h > 0 ||
          prev.kpis.cost24hUSD > 0 ||
          prev.timeseries24h.length > 0 ||
          prev.modelBreakdown.length > 0 ||
          prev.keyUsage.length > 0;

        return hasAnyLiveData ? prev : buildEmptyData();
      });

      setSource((prev) => (prev === "demo" ? "demo" : "empty"));
    }

    if (registryResult.status === "rejected") {
      setRegistryErr(registryResult.reason?.message || "Failed to load model/task registries");
    }

    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topKeys = useMemo(() => {
    return [...data.keyUsage].sort((a, b) => b.costUSD - a.costUSD).slice(0, 8);
  }, [data.keyUsage]);

  const modelStats = useMemo(() => {
    const total = models.length;

    const configured = models.filter((m) => {
      return m.configured === true || m.available === true;
    }).length;

    const priced = models.filter((m) => {
      return m.hasPricing === true;
    }).length;

    const live = models.filter((m) => {
      return m.health?.ok === true || m.health?.status === "HEALTHY";
    }).length;

    const failed = models.filter((m) => {
      return m.health?.ok === false || m.health?.status === "DOWN";
    }).length;

    return { total, configured, priced, live, failed };
  }, [models]);

  const taskStats = useMemo(() => {
    const total = tasks.length;

    const stable = tasks.filter((t) => {
      return String(t.maturity || "").toUpperCase() === "STABLE";
    }).length;

    const schemaCovered = tasks.filter((t) => {
      return Boolean(t.inputSchema || t.outputSchema || t.hasInputSchema || t.hasOutputSchema);
    }).length;

    const paid = tasks.filter((t) => {
      const tier = String(t.tier || "").toLowerCase();
      return Boolean(tier && tier !== "free");
    }).length;

    return { total, stable, schemaCovered, paid };
  }, [tasks]);

  const readinessItems = [
    {
      label: "Gateway",
      value: source === "live" ? "Live analytics" : source === "demo" ? "Demo data" : "No traffic yet",
      good: source === "live",
      href: "/playground",
    },
    {
      label: "Models",
      value: modelStats.total ? `${modelStats.configured}/${modelStats.total} ready` : "No models",
      good: modelStats.total > 0 && modelStats.configured > 0,
      href: "/models",
    },
    {
      label: "Tasks",
      value: taskStats.total ? `${taskStats.total} registered` : "No tasks",
      good: taskStats.total > 0,
      href: "/tasks",
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
    {
      label: "Billing",
      value: data.kpis.cost24hUSD > 0 ? "Usage tracked" : "Review plan",
      good: data.kpis.cost24hUSD > 0,
      href: "/billing",
    },
  ];

  const agentOsReadiness = [
    {
      label: "Capabilities",
      value: "/v1/capabilities",
      desc: "Capability directory is available beside existing task registry.",
      href: "/agent-os",
      good: true,
    },
    {
      label: "Agent plans",
      value: "/v1/agent-plans",
      desc: "Plan contracts can be generated without executing actions.",
      href: "/playground",
      good: true,
    },
    {
      label: "Handoff preview",
      value: "/v1/handoff/preview",
      desc: "Plans can be packaged for OneClaw, bots, agents, or humans.",
      href: "/agent-os",
      good: true,
    },
    {
      label: "Context preview",
      value: "/v1/context/preview",
      desc: "Thread, customer, memory, retrieval, and policy context can be normalized.",
      href: "/playground",
      good: true,
    },
    {
      label: "Execution boundary",
      value: "Disabled by default",
      desc: "OneAI coordinates intelligence. Execution stays outside OneAI.",
      href: "/docs/reference/agent-os",
      good: true,
    },
  ];

  const operatorSignals = useMemo(() => {
    const requests = data.kpis.requests24h || 0;
    const cost = data.kpis.cost24hUSD || 0;
    const errors = data.kpis.errorRatePct || 0;
    const activeKeys = data.kpis.activeKeys || 0;
    const topModel = data.modelBreakdown.length
      ? [...data.modelBreakdown].sort((a, b) => b.costUSD - a.costUSD)[0]
      : null;

    const signals = [
      {
        title: requests ? "Traffic active" : "No 24h traffic",
        desc: requests
          ? `${fmtNum(requests)} request(s) recorded in the last 24 hours.`
          : "Run Playground or send a customer API request to validate production traffic.",
        tone: requests ? "green" : "amber",
        href: "/playground",
      },
      {
        title: cost > 0 ? "Cost is tracked" : "No cost recorded",
        desc: cost > 0
          ? `${fmtUSD(cost)} estimated model cost in the last 24 hours.`
          : "Cost will appear after model calls with pricing coverage.",
        tone: cost > 10 ? "amber" : cost > 0 ? "green" : "amber",
        href: "/usage",
      },
      {
        title: errors >= 2 ? "Error rate needs review" : "Error rate healthy",
        desc: `Current error rate is ${pct(errors)}.`,
        tone: errors >= 5 ? "red" : errors >= 2 ? "amber" : "green",
        href: "/usage",
      },
      {
        title: activeKeys ? "Keys available" : "Create first API key",
        desc: activeKeys
          ? `${fmtNum(activeKeys)} active key(s) available for customer traffic.`
          : "Create a key before sending external customer traffic.",
        tone: activeKeys ? "green" : "amber",
        href: "/keys",
      },
    ];

    const nextActions = [
      requests ? ["Inspect Usage", "Review top tasks, expensive calls, and recent failures.", "/usage"] : ["Run a request", "Open Playground and test business_strategy or content_engine.", "/playground"],
      topModel ? ["Review top model", `${topModel.provider || "provider"}:${topModel.model} is leading cost.`, "/models"] : ["Check models", "Confirm configured providers, pricing coverage, and health checks.", "/models"],
      taskStats.total ? ["Test public tasks", `${taskStats.total} task(s) are visible in the public registry.`, "/tasks"] : ["Seed tasks", "Publish the commercial task registry before selling access.", "/tasks"],
    ];

    return { signals, nextActions };
  }, [data, taskStats.total]);

  const gettingStarted = useMemo(() => {
    const hasKey = data.kpis.activeKeys > 0;
    const hasTraffic = data.kpis.requests24h > 0;
    const hasUsage = hasTraffic || data.kpis.cost24hUSD > 0 || data.kpis.tokens24h > 0;

    return [
      {
        step: "1",
        title: "Create an API key",
        desc: "Start with a server-side key and a small monthly budget.",
        href: "/keys",
        status: hasKey ? "Done" : "Start",
        done: hasKey,
      },
      {
        step: "2",
        title: "Run a free test",
        desc: "Use business_strategy or content_engine before paid traffic.",
        href: "/playground",
        status: hasTraffic ? "Done" : "Test",
        done: hasTraffic,
      },
      {
        step: "3",
        title: "Check usage",
        desc: "Confirm requests, tokens, cost, latency, and failures.",
        href: "/usage",
        status: hasUsage ? "Live" : "Review",
        done: hasUsage,
      },
      {
        step: "4",
        title: "Choose upgrade path",
        desc: "Move to Pro or Team when customers need higher limits and paid tasks.",
        href: "/billing",
        status: "Plan",
        done: false,
      },
    ];
  }, [data.kpis.activeKeys, data.kpis.cost24hUSD, data.kpis.requests24h, data.kpis.tokens24h]);

  const sourceBadge =
    source === "live" ? "LIVE" : source === "demo" ? "DEMO" : "EMPTY";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Console</Badge>
            <Badge>Analytics</Badge>
            <span className="text-xs text-black/45">
              Source: <b className="text-black">{sourceBadge}</b>
            </span>
            {analyticsErr ? (
              <span className="text-xs text-amber-700">Analytics: {analyticsErr}</span>
            ) : null}
            {registryErr ? (
              <span className="text-xs text-red-600">Registry: {registryErr}</span>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-black">Dashboard</h1>
          <p className="mt-1 text-sm text-black/55">
            API health, cost, keys, models, tasks, and production readiness.
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

          {showDemoButton ? (
            <Button
              variant="ghost"
              onClick={() => {
                setData(buildDemoData());
                setSource("demo");
                setAnalyticsErr("");
              }}
              className="whitespace-nowrap"
            >
              Use Demo
            </Button>
          ) : null}
        </div>
      </div>

      {source === "empty" && !loading ? (
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
          No live usage data found yet. Create an API key, run a request in Playground, then refresh this dashboard.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                The fastest path from empty account to a billable OneAI API integration.
              </CardDescription>
            </div>
            <Link
              href="/docs/product-guide"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
            >
              Product guide
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {gettingStarted.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 transition hover:border-black/25 hover:bg-black/[0.02]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      item.done ? "bg-green-100 text-green-700" : "bg-black/5 text-black/60",
                    ].join(" ")}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 text-sm font-bold text-black">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{item.desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Agent OS Readiness</CardTitle>
              <CardDescription>
                Sidecar infrastructure for plans, handoff previews, context previews, and clear execution boundaries.
              </CardDescription>
            </div>
            <Link
              href="/agent-os"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
            >
              Open Agent OS
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {agentOsReadiness.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 transition hover:border-black/25 hover:bg-black/[0.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-black text-black">{item.label}</div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Ready
                  </span>
                </div>
                <code className="mt-3 block break-all text-xs font-semibold text-black/55">{item.value}</code>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{item.desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.74fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operator Summary</CardTitle>
            <CardDescription>One-screen commercial health check for traffic, cost, errors, and keys.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {operatorSignals.signals.map((signal) => (
                <Link
                  key={signal.title}
                  href={signal.href}
                  className={[
                    "rounded-2xl border p-4 transition hover:-translate-y-0.5",
                    signal.tone === "red"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : signal.tone === "amber"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-green-200 bg-green-50 text-green-800",
                  ].join(" ")}
                >
                  <div className="text-sm font-bold">{signal.title}</div>
                  <p className="mt-2 text-sm leading-relaxed opacity-80">{signal.desc}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Actions</CardTitle>
            <CardDescription>What to check before heavier customer traffic.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {operatorSignals.nextActions.map(([title, desc, href]) => (
                <Link
                  key={title}
                  href={href}
                  className="rounded-2xl border border-black/10 bg-white/60 p-4 transition hover:border-black/25 hover:bg-black/[0.02]"
                >
                  <div className="text-sm font-semibold text-black">{title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-black/55">{desc}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard label="Requests (24h)" value={fmtNum(data.kpis.requests24h)} />
        <KpiCard label="Tokens (24h)" value={fmtNum(data.kpis.tokens24h)} />
        <KpiCard label="Cost (24h)" value={fmtUSD(data.kpis.cost24hUSD)} />
        <KpiCard label="Active Keys" value={fmtNum(data.kpis.activeKeys)} />
        <KpiCard
          label="Quality"
          value={data.kpis.p95LatencyMs === undefined ? "—" : `${data.kpis.p95LatencyMs}ms`}
          sub={`Error rate: ${pct(data.kpis.errorRatePct)}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
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
            {data.timeseries24h.length ? (
              <>
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
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-black/45">
                No 24h usage data yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Segmentation</CardTitle>
            <CardDescription>prod / staging / dev</CardDescription>
          </CardHeader>

          <CardContent className="h-72">
            {data.envSegmentation.length ? (
              <>
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
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-black/45">
                No environment usage yet.
              </div>
            )}
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
              <KpiCard
                label="Live tested"
                value={fmtNum(modelStats.live)}
                sub={modelStats.failed ? `${modelStats.failed} failed` : "Health check on demand"}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/models"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
              >
                Open Models
              </Link>
              <Link
                href="/docs/reference/models"
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
              >
                Model Docs
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Readiness</CardTitle>
            <CardDescription>Registry, stable workflows, schemas, paid tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Registered tasks" value={fmtNum(taskStats.total)} />
              <KpiCard label="Stable" value={fmtNum(taskStats.stable)} />
              <KpiCard label="Schema covered" value={fmtNum(taskStats.schemaCovered)} />
              <KpiCard label="Paid tiers" value={fmtNum(taskStats.paid)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/tasks"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
              >
                Open Tasks
              </Link>
              <Link
                href="/playground"
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
              >
                Test Task
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commercial Readiness</CardTitle>
            <CardDescription>Next operator actions before heavier customer traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                ["Test gateway", "Run Chat API in Playground with a configured model.", "/playground"],
                ["Create prod key", "Issue a production API key with budget limits.", "/keys"],
                ["Review usage", "Check errors, latency, cost by model, task, key, and provider.", "/usage"],
                ["Confirm billing", "Verify Stripe plan and paid access before customer launch.", "/billing"],
              ].map(([title, desc, href]) => (
                <Link
                  key={title}
                  href={href}
                  className="rounded-lg border border-black/10 bg-black/[0.02] p-4 hover:border-black/25"
                >
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
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Breakdown</CardTitle>
            <CardDescription>Tokens / requests / cost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              {data.modelBreakdown.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.modelBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tokens" fill="#111111" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-black/45">
                  No model usage yet.
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                  <div className="col-span-5">Model</div>
                  <div className="col-span-3 text-right">Tokens</div>
                  <div className="col-span-2 text-right">Req</div>
                  <div className="col-span-2 text-right">Cost</div>
                </div>

                {data.modelBreakdown.length ? (
                  data.modelBreakdown.map((m) => (
                    <div key={`${m.provider || "unknown"}:${m.model}`} className="grid grid-cols-12 px-3 py-2 text-sm text-black/75">
                      <div className="col-span-5 font-medium text-black">{m.model}</div>
                      <div className="col-span-3 text-right">{fmtNum(m.tokens)}</div>
                      <div className="col-span-2 text-right">{fmtNum(m.requests)}</div>
                      <div className="col-span-2 text-right">{fmtUSD(m.costUSD)}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-6 text-sm text-black/45">No rows.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Forecast (7 days)</CardTitle>
            <CardDescription>Projected spend trend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              {data.forecast7d.length ? (
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
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-black/45">
                  No forecast available yet.
                </div>
              )}
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
                Tip: cap cost per environment or per API key in Billing policies.
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
            <Link
              href="/keys"
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
            >
              Manage Keys
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-black/10">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                <div className="col-span-4">Key</div>
                <div className="col-span-2">Env</div>
                <div className="col-span-2 text-right">Requests</div>
                <div className="col-span-2 text-right">Tokens</div>
                <div className="col-span-2 text-right">Cost</div>
              </div>

              {topKeys.length ? (
                topKeys.map((k) => (
                  <div key={k.key} className="grid grid-cols-12 px-3 py-2 text-sm">
                  <div className="col-span-4">
                    <div className="font-medium text-black">{k.key}</div>
                    <div className="text-xs text-black/45">
                      {k.lastUsedISO
                        ? `Last used: ${new Date(k.lastUsedISO).toLocaleString()}`
                        : "Last used: —"}
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
                ))
              ) : (
                <div className="px-3 py-6 text-sm text-black/45">
                  No key-level usage yet.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
