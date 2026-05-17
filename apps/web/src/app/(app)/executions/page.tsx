"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

type ExecutionRow = {
  id: string;
  orgId?: string | null;
  handoffId: string;
  agentPlanId?: string | null;
  executorType: string;
  executorRunId?: string | null;
  objective: string;
  status: string;
  approvalMode: string;
  approvalRequired: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  proofJson?: any;
  resultJson?: any;
  timeline?: TimelineItem[];
  proofVerification?: ProofVerification;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  apiKey?: {
    prefix?: string | null;
    name?: string | null;
    userEmail?: string | null;
  } | null;
};

type TimelineItem = {
  key: string;
  label: string;
  status: "done" | "pending" | "failed" | string;
  at?: string | null;
};

type ProofVerification = {
  status: "verified" | "needs_review" | "unverified" | "missing" | string;
  label: string;
  notes?: string[];
};

type Payload = {
  success: boolean;
  error?: string;
  warning?: string;
  data?: {
    summary?: ExecutionSummary;
    executions?: ExecutionRow[];
  };
};

type ExecutionSummary = {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  pending: number;
  withProof: number;
  withResult: number;
  verifiedProof?: number;
  needsReview?: number;
};

function fmtTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusPill({ status }: { status: string }) {
  const normalized = status || "UNKNOWN";
  const tone =
    normalized === "SUCCEEDED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "FAILED" || normalized === "CANCELED" || normalized === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700"
        : normalized === "RUNNING"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>
      {normalized}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
      <div className="text-xs text-black/50">{label}</div>
      <div className="mt-2 text-2xl font-black text-black">{value}</div>
      {sub ? <div className="mt-1 text-xs text-black/45">{sub}</div> : null}
    </div>
  );
}

function PrettyJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[360px] overflow-auto rounded-lg border border-black/10 bg-[#0f1115] p-4 text-xs leading-relaxed text-white/80">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

function verificationTone(status?: string) {
  if (status === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "needs_review") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "missing") return "border-black/10 bg-black/5 text-black/55";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function Timeline({ items }: { items?: TimelineItem[] }) {
  const list = items || [];
  if (!list.length) return null;
  return (
    <div className="rounded-lg border border-black/10 bg-white/70 p-4">
      <div className="text-sm font-black text-black">Timeline</div>
      <div className="mt-3 space-y-3">
        {list.map((item) => (
          <div key={item.key} className="flex gap-3">
            <div
              className={[
                "mt-1 h-3 w-3 shrink-0 rounded-full border",
                item.status === "done"
                  ? "border-emerald-500 bg-emerald-500"
                  : item.status === "failed"
                    ? "border-red-500 bg-red-500"
                    : "border-black/20 bg-white",
              ].join(" ")}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-black">{item.label}</div>
              <div className="text-xs text-black/45">{item.status} · {fmtTime(item.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExecutionsPage() {
  const [rows, setRows] = useState<ExecutionRow[]>([]);
  const [summary, setSummary] = useState<ExecutionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ExecutionRow | null>(null);
  const [scope, setScope] = useState<"customer" | "operator">("customer");
  const [statusFilter, setStatusFilter] = useState("");
  const [executorFilter, setExecutorFilter] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", scope });
      if (statusFilter) params.set("status", statusFilter);
      if (executorFilter) params.set("executorType", executorFilter);
      const res = await fetch(`/api/executions?${params.toString()}`, { cache: "no-store", credentials: "include" });
      const json = (await res.json()) as Payload;
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      const nextRows = json.data?.executions || [];
      setRows(nextRows);
      setSummary(json.data?.summary || null);
      setError(json.warning || "");
      setSelected((current) => current || nextRows[0] || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load execution ledger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, statusFilter, executorFilter]);

  async function reviewProof(reviewStatus: "verified" | "rejected" | "needs_review") {
    if (!selected) return;
    setReviewing(reviewStatus);
    setError("");
    try {
      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handoffId: selected.handoffId,
          reviewStatus,
          reviewNote,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setReviewNote("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to review proof");
    } finally {
      setReviewing("");
    }
  }

  const derived = useMemo(() => {
    if (summary) return summary;
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "SUCCEEDED") acc.succeeded += 1;
        if (row.status === "FAILED") acc.failed += 1;
        if (row.status === "RUNNING") acc.running += 1;
        if (row.status === "PENDING_APPROVAL" || row.status === "APPROVED") acc.pending += 1;
        if (row.proofJson) acc.withProof += 1;
        if (row.resultJson) acc.withResult += 1;
        if (row.proofVerification?.status === "verified") acc.verifiedProof += 1;
        if (row.proofVerification?.status === "needs_review") acc.needsReview += 1;
        return acc;
      },
      {
        total: 0,
        succeeded: 0,
        failed: 0,
        running: 0,
        pending: 0,
        withProof: 0,
        withResult: 0,
        verifiedProof: 0,
        needsReview: 0,
      }
    );
  }, [rows, summary]);

  const completionRate = derived.total ? Math.round((derived.succeeded / derived.total) * 100) : 0;

  return (
    <div className="max-w-full overflow-hidden space-y-6">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Agent OS</Badge>
            <Badge>Execution Ledger</Badge>
            {error ? <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">{error}</span> : null}
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-black">Execution Ledger</h1>
          <p className="mt-2 max-w-3xl text-wrap text-sm leading-relaxed text-black/55">
            Track handoff contracts, approvals, executor proof, and final results. OneAI records and verifies the loop; OneClaw, OpenClaw, bots, or humans execute.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Link href="/agent-os" className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-bold text-white hover:bg-neutral-900">
            Agent OS
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Contracts" value={derived.total} sub="Stored handoffs" />
        <Stat label="Succeeded" value={derived.succeeded} sub={`${completionRate}% completion`} />
        <Stat label="Proof received" value={derived.withProof} sub="Executor evidence" />
        <Stat label="Verified proof" value={derived.verifiedProof || 0} sub={`${derived.needsReview || 0} need review`} />
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="flex min-w-0 flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-center">
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as "customer" | "operator")}
            className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold"
          >
            <option value="customer">My organization</option>
            <option value="operator">Operator global</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELED">Canceled</option>
          </select>
          <select
            value={executorFilter}
            onChange={(event) => setExecutorFilter(event.target.value)}
            className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
          >
            <option value="">All executors</option>
            <option value="oneclaw">OneClaw</option>
            <option value="openclaw">OpenClaw</option>
            <option value="bot">Bot</option>
            <option value="external">External</option>
            <option value="human">Human</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Handoff lifecycle by executor, approval, proof, and result status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/55">
                  <div className="col-span-4">Objective</div>
                  <div className="col-span-2">Executor</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Proof / Result</div>
                  <div className="col-span-2">Updated</div>
                </div>
                {rows.length ? (
                  rows.map((row) => (
                    <button
                      type="button"
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={[
                        "grid w-full grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-left text-sm transition hover:bg-black/[0.02]",
                        selected?.id === row.id ? "bg-black/[0.03]" : "bg-white",
                      ].join(" ")}
                    >
                      <div className="col-span-4 min-w-0">
                        <div className="truncate font-semibold text-black">{row.objective}</div>
                        <div className="mt-1 truncate font-mono text-xs text-black/40">{row.handoffId}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-semibold text-black">{row.executorType}</div>
                        <div className="truncate font-mono text-xs text-black/40">{row.executorRunId || "-"}</div>
                      </div>
                      <div className="col-span-2">
                        <StatusPill status={row.status} />
                        <div className="mt-1 text-xs text-black/45">{row.approvalMode} approval</div>
                      </div>
                      <div className="col-span-2 text-xs text-black/55">
                        <div>Proof: {row.proofJson ? "yes" : "no"}</div>
                        <div>Result: {row.resultJson ? "yes" : "no"}</div>
                        <div>Verify: {row.proofVerification?.label || "-"}</div>
                      </div>
                      <div className="col-span-2 text-xs text-black/45">
                        {fmtTime(row.updatedAt)}
                        <Link href={`/executions/${encodeURIComponent(row.handoffId)}`} className="mt-1 block font-semibold text-black underline underline-offset-4">
                          Details
                        </Link>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-sm text-black/55">No Agent OS executions yet. Create a handoff contract from the API to populate this ledger.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Execution Detail</CardTitle>
            <CardDescription>Contract, proof, and final result for the selected handoff.</CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-black">{selected.objective}</div>
                      <div className="mt-1 font-mono text-xs text-black/45">{selected.handoffId}</div>
                    </div>
                    <StatusPill status={selected.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${verificationTone(selected.proofVerification?.status)}`}>
                      Proof: {selected.proofVerification?.label || "Unknown"}
                    </span>
                    <Link href={`/executions/${encodeURIComponent(selected.handoffId)}`} className="rounded-full border border-black/10 px-2.5 py-1 text-xs font-bold text-black hover:bg-black/[0.03]">
                      Open detail
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                    <div>
                      <div className="text-black/45">Executor</div>
                      <div className="font-semibold text-black">{selected.executorType}</div>
                    </div>
                    <div>
                      <div className="text-black/45">Approval</div>
                      <div className="font-semibold text-black">{selected.approvalMode} · {selected.approvalRequired ? "required" : "not required"}</div>
                    </div>
                    <div>
                      <div className="text-black/45">API key</div>
                      <div className="font-mono text-black">{selected.apiKey?.prefix || "-"}</div>
                    </div>
                    <div>
                      <div className="text-black/45">Updated</div>
                      <div className="text-black">{fmtTime(selected.updatedAt)}</div>
                    </div>
                  </div>
                </div>
                <Timeline items={selected.timeline} />
                <div className="rounded-lg border border-black/10 bg-white/70 p-4">
                  <div className="text-sm font-black text-black">Operator Proof Review</div>
                  <p className="mt-1 text-xs text-black/45">
                    Mark proof as verified, rejected, or needing another review. Operator-only action.
                  </p>
                  <textarea
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Review note"
                    className="mt-3 min-h-20 w-full rounded-lg border border-black/10 bg-white p-3 text-sm outline-none focus:border-black/30"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => reviewProof("verified")} disabled={!!reviewing}>
                      {reviewing === "verified" ? "Saving..." : "Mark verified"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => reviewProof("needs_review")} disabled={!!reviewing}>
                      Needs review
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => reviewProof("rejected")} disabled={!!reviewing}>
                      Reject proof
                    </Button>
                  </div>
                </div>
                <PrettyJson
                  value={{
                    timeline: selected.timeline || null,
                    proofVerification: selected.proofVerification || null,
                    proof: selected.proofJson || null,
                    result: selected.resultJson || null,
                    error: selected.error || null,
                  }}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-black/10 bg-white/70 p-4 text-sm text-black/55">
                Select an execution to inspect proof and result details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
