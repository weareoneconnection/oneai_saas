// apps/web/src/app/(app)/tasks/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type TaskRow = {
  type: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  tier?: string;
  schemaVersion?: number;
  templateVersions?: number[];
  defaultTemplateVersion?: number;
  inputSchema?: unknown;
  outputSchema?: unknown;
};

type TasksResponse = {
  success: boolean;
  error?: string;
  warning?: string;
  data?: TaskRow[];
};

export default function TasksPage() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [warning, setWarning] = useState("");

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
      setRows(json.data || []);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Infrastructure</Badge>
            <Badge>Tasks</Badge>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
            {warning ? <span className="text-xs text-amber-700">{warning}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">
            Task Registry
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Productized OneAI capabilities exposed through /v1/generate.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-3">
        {rows.length ? (
          rows.map((task) => (
            <div key={task.type} className="rounded-lg border border-black/10 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-bold">{task.title || task.name || task.type}</div>
                  <code className="mt-2 inline-block rounded-md bg-black/[0.04] px-2 py-1 text-xs">
                    {task.type}
                  </code>
                </div>
                <div className="text-xs text-black/45">
                  {task.category || task.tier || "task"} · v{task.defaultTemplateVersion || task.schemaVersion || 1}
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-black/60">
                {task.description || "Structured generation task."}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-black/10 p-5 text-sm text-black/60">
            No task data loaded.
          </div>
        )}
      </div>
    </div>
  );
}
