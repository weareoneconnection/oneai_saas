"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n";

type ModelRow = {
  id?: string;
  provider: string;
  model: string;
  modes?: string[];
  contextTokens?: number | null;
  supportsJson?: boolean;
  supportsTools?: boolean;
  configured?: boolean;
  available?: boolean;
  hasPricing?: boolean;
  pricing?: {
    inputCostPer1MTokens: number;
    outputCostPer1MTokens: number;
    source: string;
  } | null;
  health?: {
    ok: boolean;
    testedAt: string;
    latencyMs?: number;
    error?: string;
    responseModel?: string;
  } | null;
};

type ModelsResponse = {
  success?: boolean;
  object?: string;
  error?: string;
  oneai?: {
    catalogSync?: {
      syncedAt?: string | null;
      count?: number;
    };
  };
  data?:
    | {
        config?: {
          defaultProvider?: string;
          defaultModel?: string;
          autoMode?: boolean;
          autoFallbacks?: boolean;
          configuredKeys?: Record<string, boolean>;
        };
        models?: ModelRow[];
      }
    | ModelRow[];
};

function pillClass(ok?: boolean) {
  return ok
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-black/10 bg-black/[0.03] text-black/50";
}

function fmtNum(n?: number | null) {
  if (!n) return "-";
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtPrice(n?: number | null) {
  if (n == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(n);
}

function extractPayload(json: ModelsResponse) {
  if (Array.isArray(json.data)) {
    return {
      config: null,
      models: json.data,
      catalogSync: json.oneai?.catalogSync || null,
    };
  }

  return {
    config: json.data?.config || null,
    models: json.data?.models || [],
    catalogSync: json.oneai?.catalogSync || null,
  };
}

export default function ModelsPage() {
  const { isZh } = useI18n();
  const [config, setConfig] = useState<ReturnType<typeof extractPayload>["config"]>(null);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [catalogSync, setCatalogSync] = useState<ReturnType<typeof extractPayload>["catalogSync"]>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testingId, setTestingId] = useState("");
  const [err, setErr] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [estimateModelId, setEstimateModelId] = useState("");
  const [promptTokens, setPromptTokens] = useState("1000");
  const [completionTokens, setCompletionTokens] = useState("500");
  const [estimate, setEstimate] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      const json = (await res.json()) as ModelsResponse;
      if (!res.ok || json.success === false) throw new Error(json.error || `HTTP ${res.status}`);
      const payload = extractPayload(json);
      setConfig(payload.config);
      setModels(payload.models);
      setCatalogSync(payload.catalogSync);
    } catch (e: any) {
      setModels([]);
      setErr(e?.message || "Failed to load models");
    } finally {
      setLoading(false);
    }
  }

  async function syncCatalog() {
    setSyncing(true);
    setErr("");
    try {
      const res = await fetch("/api/models", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to sync catalog");
    } finally {
      setSyncing(false);
    }
  }

  async function testModel(row: ModelRow) {
    const id = `${row.provider}:${row.model}`;
    setTestingId(id);
    setErr("");
    try {
      const res = await fetch("/api/models", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: row.provider, model: row.model }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setModels((current) =>
        current.map((item) =>
          `${item.provider}:${item.model}` === id ? { ...item, health: json.data } : item
        )
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to test model");
    } finally {
      setTestingId("");
    }
  }

  async function estimateCost() {
    const selected = models.find((row) => `${row.provider}:${row.model}` === estimateModelId) || models.find((row) => row.hasPricing);
    if (!selected) {
      setErr("No priced model available for estimation");
      return;
    }

    setEstimating(true);
    setErr("");
    try {
      const res = await fetch("/api/models", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: selected.provider,
          model: selected.model,
          promptTokens: Number(promptTokens || 0),
          completionTokens: Number(completionTokens || 0),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setEstimate(json.data);
    } catch (e: any) {
      setErr(e?.message || "Failed to estimate model cost");
    } finally {
      setEstimating(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const configured = useMemo(() => {
    const map = config?.configuredKeys || {};
    return Object.entries(map).filter(([, ok]) => ok);
  }, [config?.configuredKeys]);

  const providers = useMemo(() => {
    return Array.from(new Set(models.map((m) => m.provider))).sort();
  }, [models]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((row) => {
      if (providerFilter !== "all" && row.provider !== providerFilter) return false;
      if (statusFilter === "configured" && !row.configured) return false;
      if (statusFilter === "pricing" && !row.hasPricing) return false;
      if (statusFilter === "tools" && !row.supportsTools) return false;
      if (q && !`${row.provider}:${row.model}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [models, providerFilter, query, statusFilter]);

  const configuredModelCount = models.filter((m) => m.configured).length;
  const pricedModelCount = models.filter((m) => m.hasPricing).length;
  const testedOkCount = models.filter((m) => m.health?.ok).length;
  const estimateOptions = models.filter((row) => row.hasPricing).slice(0, 120);
  const c = {
    infrastructure: isZh ? "基础设施" : "Infrastructure",
    models: isZh ? "模型" : "Models",
    title: isZh ? "模型注册表" : "Model Registry",
    subtitle: isZh
      ? "Provider 目录、配置状态、价格覆盖和路由模式。"
      : "Provider catalog, configuration status, pricing coverage, and routing modes.",
    sync: isZh ? "同步模型目录" : "Sync catalog",
    syncing: isZh ? "同步中..." : "Syncing...",
    refresh: isZh ? "刷新" : "Refresh",
    loading: isZh ? "加载中..." : "Loading...",
    defaultRoute: isZh ? "默认路由" : "Default route",
    configuredProviders: isZh ? "已配置 Provider" : "Configured providers",
    callableModels: isZh ? "可调用模型" : "Callable models",
    pricedTested: isZh ? "有价格 / 已检测" : "Priced / tested",
    estimator: isZh ? "成本估算器" : "Cost estimator",
    estimatorDesc: isZh ? "在生产流量发送前预估模型成本。" : "Estimate model cost before sending production traffic.",
    estimated: isZh ? "预估：" : "Estimated: ",
    selectPricedModel: isZh ? "选择有价格的模型" : "Select priced model",
    promptTokens: isZh ? "输入 tokens" : "Prompt tokens",
    completionTokens: isZh ? "输出 tokens" : "Completion tokens",
    estimate: isZh ? "估算" : "Estimate",
    estimating: isZh ? "估算中..." : "Estimating...",
    search: isZh ? "搜索 provider 或模型..." : "Search provider or model...",
    allProviders: isZh ? "全部 Provider" : "All providers",
    allStatus: isZh ? "全部状态" : "All status",
    configuredOnly: isZh ? "仅已配置" : "Configured only",
    pricingCovered: isZh ? "有价格覆盖" : "Pricing covered",
    toolSupport: isZh ? "支持工具" : "Tool support",
    catalogSync: isZh ? "目录同步" : "Catalog sync",
    notSynced: isZh ? "未同步" : "not synced",
    syncedModels: isZh ? "同步模型数" : "Synced models",
    showing: isZh ? "当前显示" : "Showing",
    provider: isZh ? "Provider" : "Provider",
    model: isZh ? "模型" : "Model",
    modes: isZh ? "模式" : "Modes",
    ready: isZh ? "就绪" : "Ready",
    json: "JSON",
    tools: isZh ? "工具" : "Tools",
    price: isZh ? "价格" : "Price",
    test: isZh ? "检测..." : "Test...",
    live: isZh ? "在线" : "Live",
    noKey: isZh ? "无 key" : "No key",
    yes: isZh ? "是" : "Yes",
    no: isZh ? "否" : "No",
    empty: isZh ? "暂无模型数据。" : "No model data loaded.",
  };
  const yn = (v?: boolean) => (v ? c.yes : c.no);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{c.infrastructure}</Badge>
            <Badge>{c.models}</Badge>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">{c.title}</h1>
          <p className="mt-1 text-sm text-black/55">{c.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={syncCatalog} disabled={syncing}>{syncing ? c.syncing : c.sync}</Button>
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? c.loading : c.refresh}</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c.defaultRoute}</div>
          <div className="mt-2 text-lg font-semibold">{config?.defaultProvider || "-"}:{config?.defaultModel || "-"}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c.configuredProviders}</div>
          <div className="mt-2 text-lg font-semibold">{configured.length || 0}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c.callableModels}</div>
          <div className="mt-2 text-lg font-semibold">{configuredModelCount}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c.pricedTested}</div>
          <div className="mt-2 text-lg font-semibold">{pricedModelCount} / {testedOkCount}</div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-black">{c.estimator}</div>
            <p className="mt-1 text-sm text-black/55">{c.estimatorDesc}</p>
          </div>
          {estimate ? (
            <div className="rounded-lg border border-black/10 bg-black/[0.03] px-4 py-2 text-sm">
              <span className="text-black/50">{c.estimated}</span>
              <b>{fmtPrice(estimate.estimatedCostUsd)}</b>
              <span className="ml-2 text-xs text-black/40">{Number(estimate.totalTokens || 0).toLocaleString()} tokens</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px_170px_140px]">
          <Select value={estimateModelId} onChange={(e) => setEstimateModelId(e.target.value)}>
            <option value="">{c.selectPricedModel}</option>
            {estimateOptions.map((row) => (
              <option key={`${row.provider}:${row.model}`} value={`${row.provider}:${row.model}`}>
                {row.provider}:{row.model}
              </option>
            ))}
          </Select>
          <Input value={promptTokens} onChange={(e) => setPromptTokens(e.target.value)} placeholder={c.promptTokens} className="border-black/10 bg-white text-black placeholder:text-black/35" />
          <Input value={completionTokens} onChange={(e) => setCompletionTokens(e.target.value)} placeholder={c.completionTokens} className="border-black/10 bg-white text-black placeholder:text-black/35" />
          <Button variant="secondary" onClick={estimateCost} disabled={estimating || !models.length}>
            {estimating ? c.estimating : c.estimate}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search} className="border-black/10 bg-white text-black placeholder:text-black/35" />
          <Select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="all">{c.allProviders}</option>
            {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{c.allStatus}</option>
            <option value="configured">{c.configuredOnly}</option>
            <option value="pricing">{c.pricingCovered}</option>
            <option value="tools">{c.toolSupport}</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-black/50">
          <span>{c.catalogSync}: {catalogSync?.syncedAt ? new Date(catalogSync.syncedAt).toLocaleString() : c.notSynced}</span>
          <span>{c.syncedModels}: {catalogSync?.count ?? 0}</span>
          <span>{c.showing}: {filtered.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
            <div className="col-span-2">{c.provider}</div>
            <div className="col-span-4">{c.model}</div>
            <div className="col-span-2">{c.modes}</div>
            <div className="col-span-1 text-right">{c.ready}</div>
            <div className="col-span-1 text-right">{c.json}</div>
            <div className="col-span-1 text-right">{c.tools}</div>
            <div className="col-span-1 text-right">{c.price}</div>
          </div>
          {filtered.length ? (
            filtered.map((row) => (
              <div key={`${row.provider}:${row.model}`} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm">
              <div className="col-span-2 text-black/70">{row.provider}</div>
              <div className="col-span-4 min-w-0"><code className="break-all text-xs text-black/80">{row.model}</code>{row.contextTokens ? <div className="mt-1 text-xs text-black/40">ctx {fmtNum(row.contextTokens)}</div> : null}</div>
              <div className="col-span-2 text-black/60">{(row.modes || []).join(", ") || "-"}</div>
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => testModel(row)}
                  disabled={!row.configured || testingId === `${row.provider}:${row.model}`}
                  title={row.health?.error || (row.health?.testedAt ? `Last tested ${new Date(row.health.testedAt).toLocaleString()}` : "Run a lightweight health check")}
                  className={`rounded-full border px-2 py-0.5 text-xs disabled:cursor-not-allowed ${pillClass(row.configured && row.health?.ok !== false)}`}
                >
                  {testingId === `${row.provider}:${row.model}` ? c.test : row.health?.ok ? c.live : row.configured ? c.ready : c.noKey}
                </button>
                {row.health?.latencyMs ? <div className="mt-1 text-xs text-black/35">{row.health.latencyMs}ms</div> : null}
              </div>
              <div className="col-span-1 text-right">{yn(row.supportsJson)}</div>
              <div className="col-span-1 text-right">{yn(row.supportsTools)}</div>
              <div className="col-span-1 text-right">
                {row.pricing ? (
                  <div title={`source: ${row.pricing.source}`} className="text-xs text-black/70">
                    <div>{fmtPrice(row.pricing.inputCostPer1MTokens)}</div>
                    <div className="text-black/35">/ {fmtPrice(row.pricing.outputCostPer1MTokens)}</div>
                  </div>
                ) : (
                  yn(row.hasPricing)
                )}
              </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-black/60">{c.empty}</div>
          )}
        </div>
      </div>
    </div>
  );
}
