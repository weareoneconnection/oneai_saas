"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

type Capability = {
  id: string;
  name: string;
  type: string;
  route?: string;
  tier?: string;
  maturity?: string;
  executionBoundary?: string;
  targetExecutor?: string;
  description?: string;
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
      <div className="text-xs text-black/50">{label}</div>
      <div className="mt-2 text-xl font-black text-black">{value}</div>
      {sub ? <div className="mt-1 text-xs text-black/45">{sub}</div> : null}
    </div>
  );
}

function PrettyJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-lg border border-black/10 bg-[#0f1115] p-4 text-xs leading-relaxed text-white/80">
      <code>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

export default function AgentOSPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agent-os", { cache: "no-store", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setCapabilities(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load Agent OS capabilities");
    } finally {
      setLoading(false);
    }
  }

  async function runPreview(endpoint: string, payload: Record<string, any>) {
    setBusy(endpoint);
    setError("");
    try {
      const res = await fetch("/api/agent-os", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint, payload }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setPreview(json);
    } catch (err: any) {
      setError(err?.message || "Preview failed");
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const previewCount = capabilities.filter((item) => String(item.maturity || "").includes("preview")).length;
    const handoffCount = capabilities.filter((item) => String(item.executionBoundary || "").includes("handoff")).length;
    const taskCount = capabilities.filter((item) => item.id?.startsWith("task:")).length;
    const typeCount = new Set(capabilities.map((item) => item.type).filter(Boolean)).size;
    return { previewCount, handoffCount, taskCount, typeCount };
  }, [capabilities]);

  const featured = capabilities.filter((item) => item.id?.startsWith("agent-os:"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Infrastructure</Badge>
            <Badge>Agent OS Preview</Badge>
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-black">Agent OS</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-black/55">
            OneAI is the coordination brain: it lists capabilities, creates plans,
            packages handoff previews, and normalizes context. Execution stays
            with OneClaw, bots, external agents, or human operators.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Link href="/docs/reference/agent-os" className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-bold text-white hover:bg-neutral-900">
            Docs
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Capabilities" value={`${capabilities.length}`} sub="Task + Agent OS" />
        <Stat label="Agent OS previews" value={`${stats.previewCount}`} sub="No external execution" />
        <Stat label="Handoff boundary" value={`${stats.handoffCount}`} sub="OneAI plans only" />
        <Stat label="Capability types" value={`${stats.typeCount}`} sub="Intelligence, planning, context" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview Actions</CardTitle>
          <CardDescription>Generate Agent OS objects without executing external actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                runPreview("/v1/agent-plans", {
                  objective: "Prepare a production launch checklist for OneAI",
                  constraints: ["Do not execute actions", "Every action must be verifiable"],
                  targetExecutor: "oneclaw",
                  riskLevel: "medium",
                })
              }
              className="rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-sm font-black text-black">Agent Plan Contract</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">Create a plan object ready for review and handoff.</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/agent-plans" ? "Running..." : "/v1/agent-plans"}</div>
            </button>
            <button
              type="button"
              onClick={() =>
                runPreview("/v1/handoff/preview", {
                  objective: "Hand off a launch checklist to OneClaw",
                  targetExecutor: "oneclaw",
                  approvalRequired: true,
                  proofRequired: ["deployment log", "health check result"],
                })
              }
              className="rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-sm font-black text-black">Handoff Preview</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">Package a plan for OneClaw, bots, external agents, or humans.</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/handoff/preview" ? "Running..." : "/v1/handoff/preview"}</div>
            </button>
            <button
              type="button"
              onClick={() =>
                runPreview("/v1/context/preview", {
                  threadId: "launch-thread-001",
                  customerId: "customer_123",
                  memoryHints: ["Customer prefers short practical plans"],
                  retrievalContext: [{ title: "Launch notes", text: "Ship API docs first." }],
                  policyHints: ["Do not execute external actions"],
                })
              }
              className="rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-sm font-black text-black">Context Preview</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">Normalize customer, thread, memory, retrieval, and policy context.</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/context/preview" ? "Running..." : "/v1/context/preview"}</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Agent OS Capabilities</CardTitle>
            <CardDescription>Preview capabilities layered beside existing commercial tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(featured.length ? featured : capabilities.slice(0, 5)).map((item) => (
                <div key={item.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-black text-black">{item.name}</div>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-black/55">{item.type}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-black/55">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-black/45">
                    <span>{item.route}</span>
                    <span>{item.executionBoundary}</span>
                    <span>{item.targetExecutor}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview Response</CardTitle>
            <CardDescription>Every response is a contract or preview. OneAI does not execute.</CardDescription>
          </CardHeader>
          <CardContent>
            <PrettyJson value={preview || "Run a preview action to see Agent OS output."} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
