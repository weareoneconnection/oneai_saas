// apps/web/src/app/(app)/models/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ModelRow = {
  provider: string;
  model: string;
  modes?: string[];
  contextTokens?: number | null;
  supportsJson?: boolean;
  supportsTools?: boolean;
  hasPricing?: boolean;
};

type ModelsResponse = {
  success: boolean;
  error?: string;
  data?: {
    config?: {
      defaultProvider?: string;
      defaultModel?: string;
      autoMode?: boolean;
      autoFallbacks?: boolean;
      configuredKeys?: Record<string, boolean>;
    };
    models?: ModelRow[];
  };
};

function yesNo(v?: boolean) {
  return v ? "Yes" : "No";
}

export default function ModelsPage() {
  const [data, setData] = useState<ModelsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      const json = (await res.json()) as ModelsResponse;
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setData(json.data || null);
    } catch (e: any) {
      setData(null);
      setErr(e?.message || "Failed to load models");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const configured = useMemo(() => {
    return Object.entries(data?.config?.configuredKeys || {}).filter(([, ok]) => ok);
  }, [data?.config?.configuredKeys]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Infrastructure</Badge>
            <Badge>Models</Badge>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">
            Model Registry
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Providers and models available to OneAI routing.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Default provider</div>
          <div className="mt-2 text-lg font-semibold">
            {data?.config?.defaultProvider || "-"}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Default model</div>
          <div className="mt-2 text-lg font-semibold">
            {data?.config?.defaultModel || "-"}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Configured providers</div>
          <div className="mt-2 text-lg font-semibold">
            {configured.length ? configured.map(([k]) => k).join(", ") : "-"}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10">
        <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
          <div className="col-span-2">Provider</div>
          <div className="col-span-4">Model</div>
          <div className="col-span-3">Modes</div>
          <div className="col-span-1 text-right">JSON</div>
          <div className="col-span-1 text-right">Tools</div>
          <div className="col-span-1 text-right">Price</div>
        </div>
        {data?.models?.length ? (
          data.models.map((row) => (
            <div
              key={`${row.provider}:${row.model}`}
              className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm"
            >
              <div className="col-span-2 text-black/70">{row.provider}</div>
              <div className="col-span-4 min-w-0">
                <code className="break-all text-xs text-black/80">
                  {row.model}
                </code>
              </div>
              <div className="col-span-3 text-black/60">
                {(row.modes || []).join(", ") || "-"}
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
