"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

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

function yesNo(v?: boolean) {
  return v ? "Yes" : "No";
}

function pillClass(ok?: boolean) {
  return ok
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-black/10 bg-black/[0.03] text-black/50";
}

function fmtNum(n?: number | null) {
  if (!n) return "-";
  return new Intl.NumberFormat("en-US").format(n);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Infrastructure</Badge>
            <Badge>Models</Badge>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">Model Registry</h1>
          <p className="mt-1 text-sm text-black/55">Provider catalog, configuration status, pricing coverage, and routing modes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={syncCatalog} disabled={syncing}>{syncing ? "Syncing..." : "Sync catalog"}</Button>
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Default route</div>
          <div className="mt-2 text-lg font-semibold">{config?.defaultProvider || "-"}:{config?.defaultModel || "-"}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Configured providers</div>
          <div className="mt-2 text-lg font-semibold">{configured.length || 0}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Callable models</div>
          <div className="mt-2 text-lg font-semibold">{configuredModelCount}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Priced / tested</div>
          <div className="mt-2 text-lg font-semibold">{pricedModelCount} / {testedOkCount}</div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search provider or model..." className="border-black/10 bg-white text-black placeholder:text-black/35" />
          <Select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="all">All providers</option>
            {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="configured">Configured only</option>
            <option value="pricing">Pricing covered</option>
            <option value="tools">Tool support</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-black/50">
          <span>Catalog sync: {catalogSync?.syncedAt ? new Date(catalogSync.syncedAt).toLocaleString() : "not synced"}</span>
          <span>Synced models: {catalogSync?.count ?? 0}</span>
          <span>Showing: {filtered.length}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10">
        <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
          <div className="col-span-2">Provider</div>
          <div className="col-span-4">Model</div>
          <div className="col-span-2">Modes</div>
          <div className="col-span-1 text-right">Ready</div>
          <div className="col-span-1 text-right">JSON</div>
          <div className="col-span-1 text-right">Tools</div>
          <div className="col-span-1 text-right">Price</div>
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
                  {testingId === `${row.provider}:${row.model}` ? "Test..." : row.health?.ok ? "Live" : row.configured ? "Ready" : "No key"}
                </button>
                {row.health?.latencyMs ? <div className="mt-1 text-xs text-black/35">{row.health.latencyMs}ms</div> : null}
              </div>
              <div className="col-span-1 text-right">{yesNo(row.supportsJson)}</div>
              <div className="col-span-1 text-right">{yesNo(row.supportsTools)}</div>
              <div className="col-span-1 text-right">{yesNo(row.hasPricing)}</div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-black/60">No model data loaded.</div>
        )}
      </div>
    </div>
  );
}
