"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type TaskRow = {
  type: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  tier?: string;
  route?: string;
  maturity?: string;
  executionBoundary?: string;
  schemaVersion?: number;
  templateVersions?: number[];
  defaultTemplateVersion?: number;
  inputSchema?: string | null;
  outputSchema?: string | null;
  hasInputSchema?: boolean;
  hasOutputSchema?: boolean;
  supportsDebug?: boolean;
  supportsLLMOptions?: boolean;
};

type TasksResponse = {
  success: boolean;
  error?: string;
  warning?: string;
  data?: TaskRow[];
};

function titleFor(task: TaskRow) {
  return task.title || task.name || task.type;
}

function sampleInput(type: string) {
  if (type === "waoc_chat") {
    return {
      message: "What is OneAI and how can it help WAOC builders?",
      context: "community",
      lang: "en",
      communityName: "WAOC",
    };
  }

  if (type === "mission_os") {
    return {
      goal: "Launch a WAOC builder campaign for OneAI SaaS",
      audience: "builders, creators, founders",
      brand: "WAOC OneAI",
    };
  }

  return {
    goal: "Create a 30-day AI API launch strategy for a SaaS team",
    audience: "SaaS builders and product teams",
    lang: "zh",
  };
}

function curlFor(type: string) {
  return `curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '${JSON.stringify({
    type,
    input: sampleInput(type),
    options: { llm: { mode: "cheap", maxCostUsd: 0.03 } },
  })}' | jq`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="text-xs text-black/50">{label}</div>
      <div className="mt-2 text-xl font-semibold text-black">{value}</div>
    </div>
  );
}

export default function TasksPage() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [warning, setWarning] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tier, setTier] = useState("all");
  const [selected, setSelected] = useState<TaskRow | null>(null);

  async function load() {
    setLoading(true);
    setErr("");
    setWarning("");
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      const json = (await res.json()) as TasksResponse;
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const data = json.data || [];
      setRows(data);
      setSelected((prev) => prev || data.find((task) => task.type === "agent_plan") || data[0] || null);
      setWarning(json.warning || "");
    } catch (e: any) {
      setRows([]);
      setErr(e?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => Array.from(new Set(rows.map((task) => task.category || "utility"))).sort(), [rows]);
  const tiers = useMemo(() => Array.from(new Set(rows.map((task) => task.tier || "free"))).sort(), [rows]);
  const stableCount = rows.filter((task) => task.maturity === "stable").length;
  const schemaCount = rows.filter((task) => task.inputSchema || task.outputSchema || task.hasInputSchema || task.hasOutputSchema).length;
  const proCount = rows.filter((task) => task.tier && task.tier !== "free").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((task) => {
      if (category !== "all" && (task.category || "utility") !== category) return false;
      if (tier !== "all" && (task.tier || "free") !== tier) return false;
      if (q && !`${task.type} ${titleFor(task)} ${task.description || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, query, rows, tier]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Infrastructure 基础设施</Badge>
            <Badge>Tasks 商用任务</Badge>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
            {warning ? <span className="text-xs text-amber-700">{warning}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">
            Task Registry · 商用任务注册表
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Productized OneAI intelligence capabilities exposed through /v1/generate.
            OneAI coordinates intelligence; execution remains outside OneAI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/playground" className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900">
            Open Playground
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Total tasks 商用任务" value={rows.length} />
        <Stat label="Stable tasks 稳定任务" value={stableCount} />
        <Stat label="Schema covered" value={schemaCount} />
        <Stat label="Paid tiers 付费权限" value={proCount} />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search task, description, type... / 搜索 task、描述、类型" className="border-black/10 bg-white text-black placeholder:text-black/35" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="all">All tiers</option>
            {tiers.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          {filtered.length ? (
            filtered.map((task) => {
              const active = selected?.type === task.type;
              return (
                <button
                  key={task.type}
                  type="button"
                  onClick={() => setSelected(task)}
                  className={[
                    "rounded-lg border p-5 text-left transition",
                    active ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/25",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className={active ? "text-sm font-bold text-white" : "text-sm font-bold text-black"}>{titleFor(task)}</div>
                      <code className={["mt-2 inline-block rounded-md px-2 py-1 text-xs", active ? "bg-white/10 text-white/80" : "bg-black/[0.04] text-black/75"].join(" ")}>
                        {task.type}
                      </code>
                    </div>
                    <div className={active ? "text-xs text-white/60" : "text-xs text-black/45"}>
                      {task.category || "utility"} · {task.tier || "free"} · v{task.defaultTemplateVersion || task.schemaVersion || 1}
                    </div>
                  </div>
                  <p className={["mt-3 max-w-3xl text-sm leading-relaxed", active ? "text-white/70" : "text-black/60"].join(" ")}>
                    {task.description || "Structured generation task."}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-lg border border-black/10 p-5 text-sm text-black/60">
              No task data loaded.
            </div>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-black/10 bg-white p-5">
          {selected ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">{selected.tier || "free"}</span>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-black/60">{selected.category || "utility"}</span>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-black/60">{selected.maturity || "experimental"}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-black">{titleFor(selected)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{selected.description}</p>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-t border-black/10 pt-3">
                  <span className="text-black/50">Route</span>
                  <code className="text-xs text-black">{selected.route || "/v1/generate"}</code>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/10 pt-3">
                  <span className="text-black/50">Boundary</span>
                  <span className="text-black">{selected.executionBoundary || "intelligence_only"}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/10 pt-3">
                  <span className="text-black/50">Input schema</span>
                  <span className="text-black">{selected.inputSchema || selected.hasInputSchema ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/10 pt-3">
                  <span className="text-black/50">Output schema</span>
                  <span className="text-black">{selected.outputSchema || selected.hasOutputSchema ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/10 pt-3">
                  <span className="text-black/50">LLM options</span>
                  <span className="text-black">{selected.supportsLLMOptions ? "Supported" : "Default only"}</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-semibold text-black/50">Example request</div>
                <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-[#0f1115] p-3 text-xs leading-relaxed text-white/80">
                  <code>{curlFor(selected.type)}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-sm text-black/60">Select a task to inspect details.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
