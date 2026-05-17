"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

type Customer = {
  email: string;
  orgId?: string | null;
  keyCount: number;
  activeKeyCount: number;
  latestKeyCreatedAt?: string | null;
  latestKeyUsedAt?: string | null;
  latestLoginAt?: string | null;
  requestCount: number;
  failedRequestCount?: number;
  totalTokens: number;
  costUsd: number;
  lastRequestAt?: string | null;
  billing?: { plan?: string; status?: string } | null;
  executions?: { total: number; succeeded: number; failed: number; running: number; pending: number };
};

type Payload = {
  success?: boolean;
  error?: string;
  hint?: string;
  data?: { customers: Customer[] };
};

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

type LeadNote = {
  status: LeadStatus;
  note: string;
  nextFollowUp: string;
};

const LEAD_NOTES_KEY = "oneai.sales.leadNotes.v1";

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function fmtNum(n?: number | null) {
  return new Intl.NumberFormat("en-US").format(Number(n || 0));
}

function fmtUsd(n?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(Number(n || 0));
}

function fmtTime(v?: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleString();
}

function toTime(v?: string | null) {
  if (!v) return 0;
  const time = new Date(v).getTime();
  return Number.isFinite(time) ? time : 0;
}

function scoreLead(row: Customer) {
  let score = 0;
  if (row.latestLoginAt) score += 10;
  if ((row.activeKeyCount || 0) > 0) score += 20;
  if ((row.requestCount || 0) > 0) score += 25;
  if ((row.requestCount || 0) >= 5) score += 15;
  if ((row.costUsd || 0) > 0) score += 20;
  if ((row.executions?.total || 0) > 0) score += 10;
  if ((row.failedRequestCount || 0) > 0) score += 5;
  if (row.billing?.status === "active" || row.billing?.status === "trialing") score -= 30;
  return Math.max(0, Math.min(100, score));
}

function leadStage(row: Customer) {
  if (row.billing?.status === "active" || row.billing?.status === "trialing") return "Customer";
  if ((row.costUsd || 0) > 0) return "Cost active";
  if ((row.requestCount || 0) > 0 || (row.executions?.total || 0) > 0) return "Activated";
  if ((row.activeKeyCount || 0) > 0) return "Key created";
  if (row.latestLoginAt) return "Signed in";
  return "Lead";
}

function nextAction(row: Customer) {
  if (row.billing?.status === "active" || row.billing?.status === "trialing") return "Keep success touchpoint and monitor usage.";
  if ((row.costUsd || 0) > 0) return "Offer Pro/Team plan and cost-control review.";
  if ((row.requestCount || 0) > 0) return "Ask about production use case and paid task needs.";
  if ((row.activeKeyCount || 0) > 0) return "Guide them to run business_strategy or content_engine.";
  if (row.latestLoginAt) return "Invite them to create a key and run a free test.";
  return "No action until sign-in or key activity.";
}

function localizeStage(stage: string, isZh: boolean) {
  if (!isZh) return stage;
  const map: Record<string, string> = {
    Customer: "客户",
    "Cost active": "已产生成本",
    Activated: "已激活",
    "Key created": "已创建 key",
    "Signed in": "已登录",
    Lead: "线索",
  };
  return map[stage] || stage;
}

function localizeAction(row: Customer, isZh: boolean) {
  if (!isZh) return nextAction(row);
  if (row.billing?.status === "active" || row.billing?.status === "trialing") return "保持客户成功触达并监控用量。";
  if ((row.costUsd || 0) > 0) return "推荐 Pro/Team 套餐，并提供成本控制复核。";
  if ((row.requestCount || 0) > 0) return "询问生产使用场景和付费 task 需求。";
  if ((row.activeKeyCount || 0) > 0) return "引导运行 business_strategy 或 content_engine。";
  if (row.latestLoginAt) return "引导创建 key 并完成一次免费测试。";
  return "等待登录或 key 活动后再跟进。";
}

export default function SalesLeadsPage() {
  const { isZh } = useI18n();
  const [rows, setRows] = useState<Customer[]>([]);
  const [notes, setNotes] = useState<Record<string, LeadNote>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function updateNote(email: string, patch: Partial<LeadNote>) {
    setNotes((prev) => {
      const next = {
        ...prev,
        [email]: {
          status: prev[email]?.status || "new",
          note: prev[email]?.note || "",
          nextFollowUp: prev[email]?.nextFollowUp || "",
          ...patch,
        },
      };
      window.localStorage.setItem(LEAD_NOTES_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const json = (await res.json()) as Payload;
      if (!res.ok || json.success === false) throw new Error(json.hint || json.error || "Failed to load sales leads");
      setRows(json.data?.customers || []);
    } catch (error: any) {
      setErr(error?.message || "Failed to load sales leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LEAD_NOTES_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {
      setNotes({});
    }
    load();
  }, []);

  const leads = useMemo(() => {
    return rows
      .map((row) => ({
        ...row,
        score: scoreLead(row),
        stage: leadStage(row),
        action: localizeAction(row, isZh),
        leadNote: notes[row.email] || { status: "new", note: "", nextFollowUp: "" },
      }))
      .sort((a, b) => b.score - a.score || (b.costUsd || 0) - (a.costUsd || 0));
  }, [isZh, notes, rows]);

  const summary = useMemo(() => {
    const hot = leads.filter((row) => row.score >= 60 && row.stage !== "Customer").length;
    const activated = leads.filter((row) => ["Activated", "Cost active"].includes(row.stage)).length;
    const paid = leads.filter((row) => row.stage === "Customer").length;
    const contacted = leads.filter((row) => ["contacted", "qualified", "converted"].includes(row.leadNote.status)).length;
    const followUpsDue = leads.filter((row) => {
      if (!row.leadNote.nextFollowUp) return false;
      const due = new Date(row.leadNote.nextFollowUp).getTime();
      return Number.isFinite(due) && due <= Date.now();
    }).length;
    const totalPotentialCost = leads.reduce((sum, row) => sum + Number(row.costUsd || 0), 0);
    return { hot, activated, paid, contacted, followUpsDue, totalPotentialCost };
  }, [leads]);
  const localizedStatusOptions = isZh
    ? [
        { value: "new" as const, label: "新线索" },
        { value: "contacted" as const, label: "已联系" },
        { value: "qualified" as const, label: "已合格" },
        { value: "converted" as const, label: "已转化" },
        { value: "lost" as const, label: "流失" },
      ]
    : statusOptions;
  const c = {
    eyebrow: isZh ? "OPERATOR REVENUE · 销售线索" : "Operator revenue · Sales leads",
    title: isZh ? "销售线索" : "Sales Leads",
    desc: isZh
      ? "优先跟进已登录、创建 key、运行请求、产生模型成本、遇到失败或触达 Agent OS 的用户。"
      : "Prioritize users who signed in, created keys, ran requests, generated cost, hit failures, or touched Agent OS.",
    customers: isZh ? "客户" : "Customers",
    refresh: isZh ? "刷新" : "Refresh",
    refreshing: isZh ? "刷新中..." : "Refreshing...",
    hotLeads: isZh ? "高意向线索" : "Hot leads",
    activatedLeads: isZh ? "已激活线索" : "Activated leads",
    paidTrial: isZh ? "付费 / 试用" : "Paid / trial",
    observedCost: isZh ? "已观测模型成本" : "Observed model cost",
    contacted: isZh ? "已联系 / 已合格" : "Contacted / qualified",
    followups: isZh ? "到期跟进" : "Follow-ups due",
    prioritization: isZh ? "线索优先级" : "Lead Prioritization",
    prioritizationDesc: isZh
      ? "评分基于登录、key 创建、用量、模型成本、失败请求和 Agent OS 活动。"
      : "Score is based on login, key creation, usage, model cost, failures, and Agent OS activity.",
    lead: isZh ? "线索" : "Lead",
    score: isZh ? "评分" : "Score",
    stage: isZh ? "阶段" : "Stage",
    keys: "Keys",
    requests: isZh ? "请求" : "Requests",
    cost: isZh ? "成本" : "Cost",
    salesStatus: isZh ? "销售状态" : "Sales status",
    noteFollow: isZh ? "备注 / 跟进" : "Note / Follow-up",
    signal: isZh ? "信号" : "Signal",
    ownerNote: isZh ? "负责人备注" : "Owner note",
    noLeads: isZh ? "暂无线索。" : "No leads yet.",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-black/40">{c.eyebrow}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{c.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/55">
            {c.desc}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/customers" className="inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-semibold hover:bg-black/[0.03]">
            {c.customers}
          </Link>
          <Button onClick={load} disabled={loading}>{loading ? c.refreshing : c.refresh}</Button>
        </div>
      </div>

      {err ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="text-xs text-black/45">{c.hotLeads}</div>
          <div className="mt-2 text-2xl font-bold">{fmtNum(summary.hot)}</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="text-xs text-black/45">{c.activatedLeads}</div>
          <div className="mt-2 text-2xl font-bold">{fmtNum(summary.activated)}</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="text-xs text-black/45">{c.paidTrial}</div>
          <div className="mt-2 text-2xl font-bold">{fmtNum(summary.paid)}</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="text-xs text-black/45">{c.observedCost}</div>
          <div className="mt-2 text-2xl font-bold">{fmtUsd(summary.totalPotentialCost)}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="text-xs text-black/45">{c.contacted}</div>
          <div className="mt-2 text-2xl font-bold">{fmtNum(summary.contacted)}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs text-amber-800/70">{c.followups}</div>
          <div className="mt-2 text-2xl font-bold text-amber-950">{fmtNum(summary.followUpsDue)}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{c.prioritization}</CardTitle>
          <CardDescription>{c.prioritizationDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/55">
                <div className="col-span-2">{c.lead}</div>
                <div className="col-span-1 text-right">{c.score}</div>
                <div className="col-span-1">{c.stage}</div>
                <div className="col-span-1 text-right">{c.keys}</div>
                <div className="col-span-1 text-right">{c.requests}</div>
                <div className="col-span-1 text-right">{c.cost}</div>
                <div className="col-span-2">{c.salesStatus}</div>
                <div className="col-span-2">{c.noteFollow}</div>
                <div className="col-span-1">{c.signal}</div>
              </div>
              {leads.length ? (
                leads.map((row) => (
                  <div key={row.email} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm">
                    <div className="col-span-2 min-w-0">
                      <div className="truncate font-semibold text-black">{row.email}</div>
                      <div className="truncate text-xs text-black/40">org: {row.orgId || "-"}</div>
                    </div>
                    <div className="col-span-1 text-right font-bold text-black">{row.score}</div>
                    <div className="col-span-1 text-black/70">{localizeStage(row.stage, isZh)}</div>
                    <div className="col-span-1 text-right text-black/70">{fmtNum(row.activeKeyCount)} / {fmtNum(row.keyCount)}</div>
                    <div className="col-span-1 text-right text-black/70">{fmtNum(row.requestCount)}</div>
                    <div className="col-span-1 text-right font-semibold text-black">{fmtUsd(row.costUsd)}</div>
                    <div className="col-span-2">
                      <select
                        value={row.leadNote.status}
                        onChange={(e) => updateNote(row.email, { status: e.target.value as LeadStatus })}
                        className="h-9 w-full rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black"
                      >
                        {localizedStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 text-xs text-black/50">{row.action}</div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <input
                        value={row.leadNote.note}
                        onChange={(e) => updateNote(row.email, { note: e.target.value })}
                        placeholder={c.ownerNote}
                        className="h-9 w-full rounded-lg border border-black/10 bg-white px-2 text-xs text-black outline-none focus:border-black/30"
                      />
                      <input
                        type="date"
                        value={row.leadNote.nextFollowUp}
                        onChange={(e) => updateNote(row.email, { nextFollowUp: e.target.value })}
                        className="h-9 w-full rounded-lg border border-black/10 bg-white px-2 text-xs text-black outline-none focus:border-black/30"
                      />
                    </div>
                    <div className="col-span-1 text-xs text-black/45">
                      {fmtTime(row.lastRequestAt || row.latestKeyUsedAt || row.latestKeyCreatedAt || row.latestLoginAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-black/55">{c.noLeads}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
