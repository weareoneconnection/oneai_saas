"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

type TimelineItem = {
  key: string;
  label: string;
  status: string;
  at?: string | null;
};

type ExecutionRow = {
  id: string;
  handoffId: string;
  agentPlanId?: string | null;
  protocolVersion?: string | null;
  executorType: string;
  executorRunId?: string | null;
  objective: string;
  status: string;
  approvalMode: string;
  approvalRequired: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  handoffJson?: unknown;
  proofJson?: unknown;
  resultJson?: unknown;
  error?: string | null;
  timeline?: TimelineItem[];
  proofVerification?: {
    status: string;
    label: string;
    notes?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

type Payload = {
  success: boolean;
  error?: string;
  data?: {
    executions?: ExecutionRow[];
  };
};

function fmtTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "SUCCEEDED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "FAILED" || status === "CANCELED" || status === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "RUNNING"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-amber-200 bg-amber-50 text-amber-800";

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{status}</span>;
}

function PrettyJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-xl border border-black/10 bg-[#0f1115] p-4 text-xs leading-relaxed text-white/80">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

export default function ExecutionDetailPage() {
  const params = useParams<{ handoffId: string }>();
  const handoffId = decodeURIComponent(String(params.handoffId || ""));
  const [row, setRow] = useState<ExecutionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const customerQuery = new URLSearchParams({ handoffId, limit: "1" });
      const res = await fetch(`/api/executions?${customerQuery.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = (await res.json()) as Payload;
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      const customerRow = json.data?.executions?.[0] || null;
      if (customerRow) {
        setRow(customerRow);
        return;
      }

      const operatorQuery = new URLSearchParams({ handoffId, limit: "1", scope: "operator" });
      const operatorRes = await fetch(`/api/executions?${operatorQuery.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const operatorJson = (await operatorRes.json()) as Payload;
      if (operatorRes.ok && operatorJson.success) {
        setRow(operatorJson.data?.executions?.[0] || null);
        return;
      }

      setRow(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load execution detail");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (handoffId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffId]);

  const proofNotes = useMemo(() => row?.proofVerification?.notes || [], [row?.proofVerification?.notes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Agent OS</Badge>
            <Badge>Execution Detail</Badge>
            {row ? <StatusPill status={row.status} /> : null}
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
          </div>
          <h1 className="mt-3 break-all text-3xl font-black tracking-tight text-black">{handoffId}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/55">
            Full handoff contract, approval state, proof verification, result callback, and audit timeline for this execution.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/executions" className="inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-bold text-black hover:bg-black/[0.03]">
            Back to ledger
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {!row ? (
        <Card>
          <CardContent className="p-6 text-sm text-black/55">
            {loading ? "Loading execution detail..." : "No execution found for this handoff."}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-black/45">Executor</div>
                <div className="mt-2 font-black text-black">{row.executorType}</div>
                <div className="mt-1 truncate font-mono text-xs text-black/45">{row.executorRunId || "-"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-black/45">Approval</div>
                <div className="mt-2 font-black text-black">{row.approvalMode}</div>
                <div className="mt-1 text-xs text-black/45">{row.approvalRequired ? "required" : "not required"} · {row.approvedBy || "policy"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-black/45">Proof</div>
                <div className="mt-2 font-black text-black">{row.proofVerification?.label || "Unknown"}</div>
                <div className="mt-1 text-xs text-black/45">{proofNotes[0] || "No proof note."}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-black/45">Updated</div>
                <div className="mt-2 font-black text-black">{fmtTime(row.updatedAt)}</div>
                <div className="mt-1 text-xs text-black/45">created {fmtTime(row.createdAt)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Contract, approval, proof, result, and completion state.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(row.timeline || []).map((item) => (
                    <div key={item.key} className="flex gap-3 rounded-lg border border-black/10 bg-white/60 p-3">
                      <div
                        className={[
                          "mt-1 h-3 w-3 shrink-0 rounded-full",
                          item.status === "done" ? "bg-emerald-500" : item.status === "failed" ? "bg-red-500" : "bg-black/20",
                        ].join(" ")}
                      />
                      <div>
                        <div className="text-sm font-black text-black">{item.label}</div>
                        <div className="text-xs text-black/45">{item.status} · {fmtTime(item.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract and Evidence</CardTitle>
                <CardDescription>Raw record for customer support, audits, and executor debugging.</CardDescription>
              </CardHeader>
              <CardContent>
                <PrettyJson
                  value={{
                    objective: row.objective,
                    protocolVersion: row.protocolVersion,
                    handoff: row.handoffJson,
                    proofVerification: row.proofVerification,
                    proof: row.proofJson,
                    result: row.resultJson,
                    error: row.error,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
