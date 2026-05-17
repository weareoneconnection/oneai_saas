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
import { SignInRequired, isConsoleAccessNotice } from "@/components/auth/SignInRequired";
import { useI18n } from "@/lib/i18n";

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
  const { isZh } = useI18n();
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

  const c = {
    console: isZh ? "控制台" : "Console",
    analytics: isZh ? "分析" : "Analytics",
    source: isZh ? "来源" : "Source",
    dashboard: "Dashboard",
    subtitle: isZh ? "API 健康、成本、keys、模型、tasks 和生产就绪度。" : "API health, cost, keys, models, tasks, and production readiness.",
    refresh: isZh ? "刷新" : "Refresh",
    refreshing: isZh ? "刷新中..." : "Refreshing...",
    useDemo: isZh ? "使用演示数据" : "Use Demo",
    empty: isZh ? "还没有线上用量数据。先创建 API key，在 Playground 运行一次请求，然后刷新 Dashboard。" : "No live usage data found yet. Create an API key, run a request in Playground, then refresh this dashboard.",
    gettingStarted: isZh ? "快速开始" : "Getting Started",
    gettingStartedDesc: isZh ? "从空账号到可计费 OneAI API 集成的最快路径。" : "The fastest path from empty account to a billable OneAI API integration.",
    productGuide: isZh ? "产品说明" : "Product guide",
    commercialPath: isZh ? "商业上线路径" : "Commercial Launch Path",
    commercialPathDesc: isZh ? "新客户在把 OneAI API 作为付费生产依赖前应完成的事项。" : "What a new customer should complete before OneAI API becomes a paid production dependency.",
    agentOsReady: isZh ? "Agent OS 就绪度" : "Agent OS Readiness",
    agentOsReadyDesc: isZh ? "面向计划、handoff 预览、上下文预览和清晰执行边界的旁路基础设施。" : "Sidecar infrastructure for plans, handoff previews, context previews, and clear execution boundaries.",
    openAgentOs: isZh ? "打开 Agent OS" : "Open Agent OS",
    operatorSummary: isZh ? "运营摘要" : "Operator Summary",
    operatorSummaryDesc: isZh ? "流量、成本、错误和 keys 的一屏商业健康检查。" : "One-screen commercial health check for traffic, cost, errors, and keys.",
    nextActions: isZh ? "建议下一步" : "Recommended Next Actions",
    nextActionsDesc: isZh ? "更大客户流量前需要检查的事项。" : "What to check before heavier customer traffic.",
    requests24h: isZh ? "请求数 (24h)" : "Requests (24h)",
    tokens24h: isZh ? "Tokens (24h)" : "Tokens (24h)",
    cost24h: isZh ? "成本 (24h)" : "Cost (24h)",
    activeKeys: isZh ? "活跃 Keys" : "Active Keys",
    quality: isZh ? "质量" : "Quality",
    errorRate: isZh ? "错误率" : "Error rate",
    usage24h: isZh ? "24h 用量" : "24h Usage",
    usageTrend: isZh ? "请求 + 成本趋势" : "Requests + Cost trend",
    envSegmentation: isZh ? "环境分组" : "Environment Segmentation",
    modelReadiness: isZh ? "模型就绪度" : "Model Readiness",
    modelReadinessDesc: isZh ? "目录、已配置 provider、价格和健康检测" : "Catalog, configured providers, pricing, health checks",
    taskReadiness: isZh ? "Task 就绪度" : "Task Readiness",
    taskReadinessDesc: isZh ? "注册表、稳定 workflow、schemas 和付费 tiers" : "Registry, stable workflows, schemas, paid tiers",
    commercialReady: isZh ? "商业就绪度" : "Commercial Readiness",
    commercialReadyDesc: isZh ? "更大客户流量前的运营动作" : "Next operator actions before heavier customer traffic",
    no24h: isZh ? "暂无 24h 用量数据。" : "No 24h usage data yet.",
    noEnv: isZh ? "暂无环境用量。" : "No environment usage yet.",
    openModels: isZh ? "打开 Models" : "Open Models",
    modelDocs: isZh ? "模型文档" : "Model Docs",
    openTasks: isZh ? "打开 Tasks" : "Open Tasks",
    testTask: isZh ? "测试 Task" : "Test Task",
    modelBreakdown: isZh ? "模型用量拆分" : "Model Usage Breakdown",
    forecast: isZh ? "成本预测 (7 天)" : "Cost Forecast (7 days)",
    keyUsage: isZh ? "Key 级用量" : "Key-level Usage",
    manageKeys: isZh ? "管理 Keys" : "Manage Keys",
    noRows: isZh ? "暂无数据行。" : "No rows.",
    noModelUsage: isZh ? "暂无模型用量。" : "No model usage yet.",
    noForecast: isZh ? "暂无预测数据。" : "No forecast available yet.",
    noKeyUsage: isZh ? "暂无 key 级用量。" : "No key-level usage yet.",
  };

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
      desc: isZh ? "能力目录已在现有 task registry 旁路可用。" : "Capability directory is available beside existing task registry.",
      href: "/agent-os",
      good: true,
    },
    {
      label: "Agent plans",
      value: "/v1/agent-plans",
      desc: isZh ? "可以生成计划合约，但不执行动作。" : "Plan contracts can be generated without executing actions.",
      href: "/playground",
      good: true,
    },
    {
      label: "Handoff preview",
      value: "/v1/handoff/preview",
      desc: isZh ? "计划可以打包给 OneClaw、bot、agent 或人工。" : "Plans can be packaged for OneClaw, bots, agents, or humans.",
      href: "/agent-os",
      good: true,
    },
    {
      label: "Context preview",
      value: "/v1/context/preview",
      desc: isZh ? "可以规范线程、客户、记忆、检索和策略上下文。" : "Thread, customer, memory, retrieval, and policy context can be normalized.",
      href: "/playground",
      good: true,
    },
    {
      label: "Execution boundary",
      value: isZh ? "默认禁用" : "Disabled by default",
      desc: isZh ? "OneAI 协调智能，执行保留在 OneAI 外部。" : "OneAI coordinates intelligence. Execution stays outside OneAI.",
      href: "/docs/reference/agent-os",
      good: true,
    },
    {
      label: "Execution ledger",
      value: "/executions",
      desc: isZh ? "Handoff 后 proof、approval 和 result callbacks 可见。" : "Proof, approval, and result callbacks are visible after handoff.",
      href: "/executions",
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
        title: requests ? (isZh ? "流量已记录" : "Traffic active") : (isZh ? "暂无 24h 流量" : "No 24h traffic"),
        desc: requests
          ? `${fmtNum(requests)} ${isZh ? "个请求在过去 24 小时内被记录。" : "request(s) recorded in the last 24 hours."}`
          : isZh ? "运行 Playground 或发送客户 API 请求验证生产流量。" : "Run Playground or send a customer API request to validate production traffic.",
        tone: requests ? "green" : "amber",
        href: "/playground",
      },
      {
        title: cost > 0 ? (isZh ? "成本已记录" : "Cost is tracked") : (isZh ? "暂无成本记录" : "No cost recorded"),
        desc: cost > 0
          ? `${fmtUSD(cost)} ${isZh ? "过去 24 小时预估模型成本。" : "estimated model cost in the last 24 hours."}`
          : isZh ? "有价格覆盖的模型调用后会出现成本。" : "Cost will appear after model calls with pricing coverage.",
        tone: cost > 10 ? "amber" : cost > 0 ? "green" : "amber",
        href: "/usage",
      },
      {
        title: errors >= 2 ? (isZh ? "错误率需要复核" : "Error rate needs review") : (isZh ? "错误率健康" : "Error rate healthy"),
        desc: `${isZh ? "当前错误率" : "Current error rate is"} ${pct(errors)}.`,
        tone: errors >= 5 ? "red" : errors >= 2 ? "amber" : "green",
        href: "/usage",
      },
      {
        title: activeKeys ? (isZh ? "Keys 可用" : "Keys available") : (isZh ? "创建第一个 API key" : "Create first API key"),
        desc: activeKeys
          ? `${fmtNum(activeKeys)} ${isZh ? "个 active key 可用于客户流量。" : "active key(s) available for customer traffic."}`
          : isZh ? "发送外部客户流量前先创建 key。" : "Create a key before sending external customer traffic.",
        tone: activeKeys ? "green" : "amber",
        href: "/keys",
      },
    ];

    const nextActions = [
      requests ? [isZh ? "查看 Usage" : "Inspect Usage", isZh ? "复核热门 tasks、高成本调用和最近失败。" : "Review top tasks, expensive calls, and recent failures.", "/usage"] : [isZh ? "运行一次请求" : "Run a request", isZh ? "打开 Playground 测试 business_strategy 或 content_engine。" : "Open Playground and test business_strategy or content_engine.", "/playground"],
      topModel ? [isZh ? "复核最高成本模型" : "Review top model", `${topModel.provider || "provider"}:${topModel.model} ${isZh ? "是当前成本主力。" : "is leading cost."}`, "/models"] : [isZh ? "检查模型" : "Check models", isZh ? "确认已配置 providers、价格覆盖和健康检测。" : "Confirm configured providers, pricing coverage, and health checks.", "/models"],
      taskStats.total ? [isZh ? "测试公开 tasks" : "Test public tasks", `${taskStats.total} ${isZh ? "个 task 在公开 registry 中可见。" : "task(s) are visible in the public registry."}`, "/tasks"] : [isZh ? "发布 tasks" : "Seed tasks", isZh ? "售卖 access 前发布商业 task registry。" : "Publish the commercial task registry before selling access.", "/tasks"],
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
        title: isZh ? "创建 API key" : "Create an API key",
        desc: isZh ? "从服务端 key 和小额月预算开始。" : "Start with a server-side key and a small monthly budget.",
        href: "/keys",
        status: hasKey ? (isZh ? "完成" : "Done") : (isZh ? "开始" : "Start"),
        done: hasKey,
      },
      {
        step: "2",
        title: isZh ? "运行免费测试" : "Run a free test",
        desc: isZh ? "付费流量前先用 business_strategy 或 content_engine。" : "Use business_strategy or content_engine before paid traffic.",
        href: "/playground",
        status: hasTraffic ? (isZh ? "完成" : "Done") : (isZh ? "测试" : "Test"),
        done: hasTraffic,
      },
      {
        step: "3",
        title: isZh ? "检查用量" : "Check usage",
        desc: isZh ? "确认请求、tokens、成本、延迟和失败。" : "Confirm requests, tokens, cost, latency, and failures.",
        href: "/usage",
        status: hasUsage ? (isZh ? "在线" : "Live") : (isZh ? "复核" : "Review"),
        done: hasUsage,
      },
      {
        step: "4",
        title: isZh ? "选择升级路径" : "Choose upgrade path",
        desc: isZh ? "客户需要更高限制和付费 tasks 时升级到 Pro 或 Team。" : "Move to Pro or Team when customers need higher limits and paid tasks.",
        href: "/billing",
        status: isZh ? "计划" : "Plan",
        done: false,
      },
    ];
  }, [data.kpis.activeKeys, data.kpis.cost24hUSD, data.kpis.requests24h, data.kpis.tokens24h]);

  const commercialLaunch = useMemo(() => {
    const hasKey = data.kpis.activeKeys > 0;
    const hasTraffic = data.kpis.requests24h > 0;
    const hasCost = data.kpis.cost24hUSD > 0;
    const lowError = Number(data.kpis.errorRatePct || 0) < 2;
    const readyCount = [hasKey, hasTraffic, hasCost, lowError].filter(Boolean).length;

    return {
      readyCount,
      status: readyCount >= 3 ? (isZh ? "商业就绪" : "Commercial-ready") : readyCount >= 2 ? (isZh ? "接近就绪" : "Almost ready") : (isZh ? "需要配置" : "Setup needed"),
      actions: [
        hasKey
          ? [isZh ? "Keys 就绪" : "Keys ready", isZh ? "至少已有一个 active API key。" : "At least one active API key exists.", "/keys"]
          : [isZh ? "创建 key" : "Create key", isZh ? "创建客户安全的服务端 API key。" : "Create a customer-safe server-side API key.", "/keys"],
        hasTraffic
          ? [isZh ? "流量在线" : "Traffic live", isZh ? "Dashboard 正在记录用量。" : "Usage is recording in the dashboard.", "/usage"]
          : [isZh ? "运行测试" : "Run test", isZh ? "在 Playground 运行 business_strategy 或 content_engine。" : "Run business_strategy or content_engine in Playground.", "/playground"],
        hasCost
          ? [isZh ? "成本可见" : "Cost visible", isZh ? "模型成本可用于毛利规划。" : "Model cost is available for margin planning.", "/usage"]
          : [isZh ? "检查价格" : "Check pricing", isZh ? "售卖前确认模型价格和成本估算。" : "Confirm model pricing and cost estimates before selling.", "/models"],
        lowError
          ? [isZh ? "质量健康" : "Quality healthy", isZh ? "当前错误率在上线容忍范围内。" : "Current error rate is within launch tolerance.", "/usage"]
          : [isZh ? "复核失败" : "Review failures", isZh ? "邀请客户前修复失败请求。" : "Fix failed requests before inviting customers.", "/usage"],
      ],
    };
  }, [data.kpis.activeKeys, data.kpis.cost24hUSD, data.kpis.errorRatePct, data.kpis.requests24h]);

  const sourceBadge =
    source === "live" ? "LIVE" : source === "demo" ? "DEMO" : "EMPTY";

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{c.console}</Badge>
            <Badge>{c.analytics}</Badge>
            <span className="text-xs text-black/45">
              {c.source}: <b className="text-black">{sourceBadge}</b>
            </span>
            {analyticsErr && !isConsoleAccessNotice(analyticsErr) ? (
              <span className="text-xs text-amber-700">Analytics: {analyticsErr}</span>
            ) : null}
            {registryErr && !isConsoleAccessNotice(registryErr) ? (
              <span className="text-xs text-red-600">Registry: {registryErr}</span>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-black">{c.dashboard}</h1>
          <p className="mt-1 text-sm text-black/55">{c.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={loading}
            className="whitespace-nowrap"
          >
            {loading ? c.refreshing : c.refresh}
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
              {c.useDemo}
            </Button>
          ) : null}
        </div>
      </div>

      {(analyticsErr && isConsoleAccessNotice(analyticsErr)) ||
      (registryErr && isConsoleAccessNotice(registryErr)) ? (
        <SignInRequired message={[analyticsErr, registryErr].filter(Boolean).join(" · ")} />
      ) : null}

      {source === "empty" &&
      !loading &&
      !isConsoleAccessNotice([analyticsErr, registryErr].filter(Boolean).join(" ")) ? (
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
          {c.empty}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{c.gettingStarted}</CardTitle>
              <CardDescription>
                {c.gettingStartedDesc}
              </CardDescription>
            </div>
            <Link
              href="/docs/product-guide"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
            >
              {c.productGuide}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{c.commercialPath}</CardTitle>
              <CardDescription>
                {c.commercialPathDesc}
              </CardDescription>
            </div>
            <span className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              {commercialLaunch.status} · {commercialLaunch.readyCount}/4
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {commercialLaunch.actions.map(([title, desc, href], index) => (
              <Link
                key={title}
                href={href}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 transition hover:border-black/25 hover:bg-black/[0.02]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-black">{title}</div>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-black/55">
                    {index + 1}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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
              <CardTitle>{c.agentOsReady}</CardTitle>
              <CardDescription>
                {c.agentOsReadyDesc}
              </CardDescription>
            </div>
            <Link
              href="/agent-os"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
            >
              {c.openAgentOs}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.55fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{c.operatorSummary}</CardTitle>
            <CardDescription>{c.operatorSummaryDesc}</CardDescription>
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
            <CardTitle>{c.nextActions}</CardTitle>
            <CardDescription>{c.nextActionsDesc}</CardDescription>
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={c.requests24h} value={fmtNum(data.kpis.requests24h)} />
        <KpiCard label={c.tokens24h} value={fmtNum(data.kpis.tokens24h)} />
        <KpiCard label={c.cost24h} value={fmtUSD(data.kpis.cost24hUSD)} />
        <KpiCard label={c.activeKeys} value={fmtNum(data.kpis.activeKeys)} />
        <KpiCard
          label={c.quality}
          value={data.kpis.p95LatencyMs === undefined ? "—" : `${data.kpis.p95LatencyMs}ms`}
          sub={`${c.errorRate}: ${pct(data.kpis.errorRatePct)}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{c.usage24h}</CardTitle>
                <CardDescription>{c.usageTrend}</CardDescription>
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
                {c.no24h}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{c.envSegmentation}</CardTitle>
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
                {c.noEnv}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{c.modelReadiness}</CardTitle>
            <CardDescription>{c.modelReadinessDesc}</CardDescription>
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
                {c.openModels}
              </Link>
              <Link
                href="/docs/reference/models"
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
              >
                {c.modelDocs}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{c.taskReadiness}</CardTitle>
            <CardDescription>{c.taskReadinessDesc}</CardDescription>
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
                {c.openTasks}
              </Link>
              <Link
                href="/playground"
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
              >
                {c.testTask}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{c.commercialReady}</CardTitle>
            <CardDescription>{c.commercialReadyDesc}</CardDescription>
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
            <CardTitle>{c.modelBreakdown}</CardTitle>
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
                  {c.noModelUsage}
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
                  <div className="px-3 py-6 text-sm text-black/45">{c.noRows}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{c.forecast}</CardTitle>
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
                  {c.noForecast}
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
              <CardTitle>{c.keyUsage}</CardTitle>
              <CardDescription>Top keys by cost (24h)</CardDescription>
            </div>
            <Link
              href="/keys"
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03]"
            >
              {c.manageKeys}
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
                  {c.noKeyUsage}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
