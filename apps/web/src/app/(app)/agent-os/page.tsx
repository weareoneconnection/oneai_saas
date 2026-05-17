"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

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
  const { isZh } = useI18n();
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
  const c = {
    infrastructure: isZh ? "基础设施" : "Infrastructure",
    previewBadge: isZh ? "Agent OS 预览" : "Agent OS Preview",
    title: "Agent OS",
    subtitle: isZh
      ? "OneAI 是统一智能协调大脑：列出能力、生成计划、打包 handoff 预览并规范上下文。执行仍交给 OneClaw、bot、外部 agent 或人工操作员。"
      : "OneAI is the coordination brain: it lists capabilities, creates plans, packages handoff previews, and normalizes context. Execution stays with OneClaw, bots, external agents, or human operators.",
    refresh: isZh ? "刷新" : "Refresh",
    refreshing: isZh ? "刷新中..." : "Refreshing...",
    ledger: isZh ? "执行账本" : "Execution Ledger",
    docs: isZh ? "文档" : "Docs",
    capabilities: isZh ? "能力数" : "Capabilities",
    taskAgentOs: isZh ? "Task + Agent OS" : "Task + Agent OS",
    previews: isZh ? "Agent OS 预览" : "Agent OS previews",
    noExecution: isZh ? "不执行外部动作" : "No external execution",
    boundary: isZh ? "Handoff 边界" : "Handoff boundary",
    plansOnly: isZh ? "OneAI 只规划" : "OneAI plans only",
    types: isZh ? "能力类型" : "Capability types",
    typeSub: isZh ? "智能、规划、上下文" : "Intelligence, planning, context",
    previewActions: isZh ? "预览动作" : "Preview Actions",
    previewActionsDesc: isZh ? "生成 Agent OS 对象，不执行外部动作。" : "Generate Agent OS objects without executing external actions.",
    agentPlan: isZh ? "Agent Plan 合约" : "Agent Plan Contract",
    agentPlanDesc: isZh ? "创建可审查、可 handoff 的计划对象。" : "Create a plan object ready for review and handoff.",
    handoffPreview: isZh ? "Handoff 预览" : "Handoff Preview",
    handoffPreviewDesc: isZh ? "为 OneClaw、bot、外部 agent 或人工打包计划。" : "Package a plan for OneClaw, bots, external agents, or humans.",
    handoffContract: isZh ? "Handoff 合约" : "Handoff Contract",
    handoffContractDesc: isZh ? "创建带审批、证明和结果回调的入库合约。" : "Create a stored contract with approval, proof, and result callbacks.",
    contextPreview: isZh ? "上下文预览" : "Context Preview",
    contextPreviewDesc: isZh ? "规范客户、线程、记忆、检索和策略上下文。" : "Normalize customer, thread, memory, retrieval, and policy context.",
    running: isZh ? "运行中..." : "Running...",
    capabilityTitle: isZh ? "Agent OS 能力" : "Agent OS Capabilities",
    capabilityDesc: isZh ? "在现有商业 task 旁路叠加的预览能力。" : "Preview capabilities layered beside existing commercial tasks.",
    responseTitle: isZh ? "预览响应" : "Preview Response",
    responseDesc: isZh ? "每个响应都是合约或预览。OneAI 不执行。" : "Every response is a contract or preview. OneAI does not execute.",
    runHint: isZh ? "运行一个预览动作查看 Agent OS 输出。" : "Run a preview action to see Agent OS output.",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{c.infrastructure}</Badge>
            <Badge>{c.previewBadge}</Badge>
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-black">{c.title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-black/55">
            {c.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? c.refreshing : c.refresh}
          </Button>
          <Link href="/executions" className="inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-bold text-black hover:bg-black/[0.03]">
            {c.ledger}
          </Link>
          <Link href="/docs/reference/agent-os" className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-bold text-white hover:bg-neutral-900">
            {c.docs}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label={c.capabilities} value={`${capabilities.length}`} sub={c.taskAgentOs} />
        <Stat label={c.previews} value={`${stats.previewCount}`} sub={c.noExecution} />
        <Stat label={c.boundary} value={`${stats.handoffCount}`} sub={c.plansOnly} />
        <Stat label={c.types} value={`${stats.typeCount}`} sub={c.typeSub} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{c.previewActions}</CardTitle>
          <CardDescription>{c.previewActionsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-4">
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
              <div className="text-sm font-black text-black">{c.agentPlan}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">{c.agentPlanDesc}</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/agent-plans" ? c.running : "/v1/agent-plans"}</div>
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
              <div className="text-sm font-black text-black">{c.handoffPreview}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">{c.handoffPreviewDesc}</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/handoff/preview" ? c.running : "/v1/handoff/preview"}</div>
            </button>
            <button
              type="button"
              onClick={() =>
                runPreview("/v1/handoff/contracts", {
                  objective: "Create an OpenClaw execution ledger contract",
                  targetExecutor: "openclaw",
                  executorProtocol: "openclaw.v1",
                  riskLevel: "low",
                  approvalMode: "auto",
                  proofRequired: ["execution log", "result summary"],
                })
              }
              className="rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-sm font-black text-black">{c.handoffContract}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">{c.handoffContractDesc}</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/handoff/contracts" ? c.running : "/v1/handoff/contracts"}</div>
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
              <div className="text-sm font-black text-black">{c.contextPreview}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">{c.contextPreviewDesc}</p>
              <div className="mt-3 text-xs font-semibold text-black/45">{busy === "/v1/context/preview" ? c.running : "/v1/context/preview"}</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{c.capabilityTitle}</CardTitle>
            <CardDescription>{c.capabilityDesc}</CardDescription>
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
            <CardTitle>{c.responseTitle}</CardTitle>
            <CardDescription>{c.responseDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <PrettyJson value={preview || c.runHint} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
