"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

const roles = [
  {
    role: "Owner",
    desc: "Owns the organization, billing relationship, plan policy, and final approval for production access.",
    permissions: ["Billing control", "API key policy", "Member role changes", "Agent OS proof review"],
  },
  {
    role: "Admin",
    desc: "Operates customer-facing infrastructure with high-trust access to keys, usage, and support workflows.",
    permissions: ["Create keys", "Review usage", "Manage model policy", "View audit events"],
  },
  {
    role: "Member",
    desc: "Builds and tests against approved tasks, models, and API keys without changing organization policy.",
    permissions: ["Use approved keys", "Run playground tests", "View own usage", "Read docs"],
  },
  {
    role: "Viewer",
    desc: "Reads dashboards, invoices, execution records, and audit trails without changing production state.",
    permissions: ["Read-only usage", "Read-only billing", "Read-only executions", "Read-only docs"],
  },
];

const matrix = [
  ["Create API keys", "Owner / Admin"],
  ["Set budgets, RPM, IP allowlists", "Owner / Admin"],
  ["Change billing plan", "Owner"],
  ["View invoices", "Owner / Admin / Viewer"],
  ["View usage and costs", "Owner / Admin / Member / Viewer"],
  ["Run commercial tasks", "Owner / Admin / Member"],
  ["Review Agent OS proof", "Owner / Admin"],
  ["Change member roles", "Owner"],
];

const rollout = [
  "Organization, membership, and role data already exist in the backend.",
  "Current console access is protected by Google/console login and operator checks.",
  "Next enterprise step is self-serve invite, remove, and role-change workflows.",
  "Role changes, key changes, billing changes, and failed requests should remain audit logged.",
];

type TeamPayload = {
  success?: boolean;
  error?: string;
  warning?: string;
  hint?: string;
  data?: {
    org: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
    };
    currentUser: {
      email: string;
      role: string;
    };
    billing: {
      plan: string;
      status: string;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean;
    };
    members: Array<{
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      createdAt: string;
      updatedAt: string;
    }>;
    keyCounts: {
      total: number;
      active: number;
      revoked: number;
      development: number;
      staging: number;
      production: number;
    };
    usage: {
      requests: number;
      tokens: number;
      costUsd: number;
      lastRequestAt?: string | null;
    };
    recentAudit: Array<{
      id: string;
      action: string;
      target?: string | null;
      createdAt: string;
    }>;
    permissions: Record<string, boolean>;
  };
};

function fmtNum(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function fmtUsd(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(Number(value || 0));
}

function fmtTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function TeamPage() {
  const { isZh } = useI18n();
  const [payload, setPayload] = useState<TeamPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTeam() {
    setLoading(true);
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as TeamPayload;
      setPayload(json);
      if (json?.warning) setNotice(json.warning);
      if (!json?.success && json?.error) setNotice(json.error);
    } finally {
      setLoading(false);
    }
  }

  async function saveMember(input: { id?: string; email?: string; role: string; remove?: boolean }) {
    setBusy(input.remove ? `remove:${input.id}` : input.id ? `role:${input.id}` : "invite");
    setNotice("");
    try {
      const res = input.remove
        ? await fetch(`/api/team?id=${encodeURIComponent(input.id || "")}`, { method: "DELETE" })
        : input.id
          ? await fetch("/api/team", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: input.id, role: input.role }),
            })
          : await fetch("/api/team", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ memberEmail: input.email, role: input.role }),
            });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setMemberEmail("");
      setMemberRole("MEMBER");
      setNotice(input.remove ? "Member removed." : input.id ? "Role updated." : "Member added.");
      await loadTeam();
    } catch (error: any) {
      setNotice(error?.message || "Team update failed.");
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  const data = payload?.data;
  const c = {
    title: isZh ? "团队与组织权限" : "Team and Organization Access",
    subtitle: isZh
      ? "OneAI 已具备组织、成员和角色基础。这个页面把它变成客户可见的企业权限模型，同时不改变现有 API。"
      : "OneAI already has organization membership and role foundations. This page turns that structure into a customer-facing enterprise access model without changing existing APIs.",
    operatorCustomers: isZh ? "运营方客户" : "Operator customers",
    unavailable: isZh ? "团队数据不可用" : "Team data unavailable",
    unable: isZh ? "无法加载团队数据。" : "Unable to load team data.",
    organization: isZh ? "组织" : "Organization",
    currentOrg: isZh ? "当前客户组织" : "Current customer org",
    yourRole: isZh ? "你的角色" : "Your role",
    signIn: isZh ? "登录后加载" : "Sign in to load",
    plan: isZh ? "套餐" : "Plan",
    activeKeys: isZh ? "活跃 keys" : "Active keys",
    totalKeys: isZh ? "总 keys" : "total keys",
    liveMembers: isZh ? "实时成员" : "Live Members",
    liveMembersDesc: isZh ? "从当前组织 membership 表加载的成员。" : "Members loaded from the current organization membership table.",
    invite: isZh ? "邀请或更新成员" : "Invite or update member",
    inviteDesc: isZh ? "仅 Owner 操作。成员会加入此组织，所有变更都会写入审计日志。" : "Owner-only action. The member is attached to this organization and all changes are audit logged.",
    saving: isZh ? "保存中..." : "Saving...",
    addMember: isZh ? "添加成员" : "Add member",
    member: isZh ? "成员" : "Member",
    role: isZh ? "角色" : "Role",
    joined: isZh ? "加入时间" : "Joined",
    actions: isZh ? "操作" : "Actions",
    removing: isZh ? "移除中..." : "Removing...",
    remove: isZh ? "移除" : "Remove",
    loadingMembers: isZh ? "成员加载中..." : "Loading members...",
    noMembers: isZh ? "暂无成员。" : "No members loaded.",
    liveAccess: isZh ? "实时权限状态" : "Live Access State",
    liveAccessDesc: isZh ? "当前组织权限和用量 footprint。" : "Current organization permissions and usage footprint.",
    requests: isZh ? "请求" : "Requests",
    modelCost: isZh ? "模型成本" : "Model cost",
    prodKeys: isZh ? "生产 keys" : "Production keys",
    tokens: "Tokens",
    allowed: isZh ? "允许" : "Allowed",
    locked: isZh ? "锁定" : "Locked",
    permissionMatrix: isZh ? "权限矩阵" : "Permission Matrix",
    permissionDesc: isZh ? "客户组织的默认企业权限。" : "Default enterprise permissions for customer organizations.",
    capability: isZh ? "能力" : "Capability",
    allowedRoles: isZh ? "允许角色" : "Allowed roles",
    rollout: isZh ? "企业上线状态" : "Enterprise Rollout State",
    rolloutDesc: isZh ? "当前已经具备的基础，以及需要保持显式的内容。" : "What is already true, and what should remain explicit.",
    boundary: isZh ? "商业边界" : "Commercial Boundary",
    boundaryDesc: isZh ? "团队权限管理 OneAI 智能基础设施访问。执行仍在 OneAI 外部。" : "Team permissions govern access to OneAI intelligence infrastructure. Execution stays outside OneAI.",
    keys: "Keys",
    audit: isZh ? "审计" : "Audit",
    legalDocs: isZh ? "法务文档" : "Legal docs",
  };
  const boolLabel = (value?: boolean) => (value ? c.allowed : c.locked);
  const permissionRows = useMemo(() => {
    const permissions = data?.permissions || {};
    return [
      [isZh ? "创建 keys" : "Create keys", boolLabel(permissions.canCreateKeys)],
      [isZh ? "管理支付" : "Manage billing", boolLabel(permissions.canManageBilling)],
      [isZh ? "复核 proof" : "Review proof", boolLabel(permissions.canReviewProof)],
      [isZh ? "管理成员" : "Manage members", boolLabel(permissions.canManageMembers)],
    ];
  }, [data?.permissions, isZh]);
  const localizedRoles = isZh
    ? [
        { role: "Owner", desc: "拥有组织、支付关系、套餐策略和生产访问最终审批。", permissions: ["支付控制", "API key 策略", "成员角色变更", "Agent OS proof 复核"] },
        { role: "Admin", desc: "运营客户侧基础设施，拥有 keys、用量和支持工作流的高信任访问。", permissions: ["创建 keys", "复核用量", "管理模型策略", "查看审计事件"] },
        { role: "Member", desc: "基于已批准 tasks、models 和 API keys 构建与测试，但不能改变组织策略。", permissions: ["使用已批准 keys", "运行 Playground 测试", "查看自身用量", "阅读文档"] },
        { role: "Viewer", desc: "只读 dashboard、发票、执行记录和审计轨迹，不改变生产状态。", permissions: ["只读用量", "只读支付", "只读执行记录", "只读文档"] },
      ]
    : roles;
  const localizedMatrix = isZh
    ? [
        ["创建 API keys", "Owner / Admin"],
        ["设置预算、RPM、IP allowlists", "Owner / Admin"],
        ["修改支付套餐", "Owner"],
        ["查看发票", "Owner / Admin / Viewer"],
        ["查看用量和成本", "Owner / Admin / Member / Viewer"],
        ["运行商业 tasks", "Owner / Admin / Member"],
        ["复核 Agent OS proof", "Owner / Admin"],
        ["修改成员角色", "Owner"],
      ]
    : matrix;
  const localizedRollout = isZh
    ? [
        "后端已经存在 Organization、Membership 和 Role 数据。",
        "当前控制台访问由 Google/console login 和 operator checks 保护。",
        "下一步企业能力是自助邀请、移除和角色变更流程。",
        "角色、key、支付、失败请求等变化应继续写入审计日志。",
      ]
    : rollout;

  return (
    <div className="max-w-full overflow-hidden space-y-6">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>Team</Badge>
            <Badge>RBAC</Badge>
          </div>
          <h1 className="mt-4 text-wrap text-3xl font-bold tracking-tight">{c.title}</h1>
          <p className="mt-2 max-w-3xl text-wrap text-sm leading-relaxed text-black/60">
            {c.subtitle}
          </p>
        </div>
        <Link
          href="/customers"
          className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black/[0.03]"
        >
          {c.operatorCustomers}
        </Link>
      </div>

      {payload && !payload.success ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">{c.unavailable}</CardTitle>
            <CardDescription className="text-red-800">
              {payload.error || c.unable}
              {payload.hint ? ` ${payload.hint}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-900">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{c.organization}</CardDescription>
            <CardTitle>{data?.org?.name || (loading ? "Loading..." : "-")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-black/45">{data?.org?.slug || c.currentOrg}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{c.yourRole}</CardDescription>
            <CardTitle>{data?.currentUser?.role || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="truncate text-xs text-black/45">{data?.currentUser?.email || c.signIn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{c.plan}</CardDescription>
            <CardTitle>{data?.billing?.plan || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-black/45">{data?.billing?.status || "inactive"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{c.activeKeys}</CardDescription>
            <CardTitle>{fmtNum(data?.keyCounts?.active)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-black/45">{fmtNum(data?.keyCounts?.total)} {c.totalKeys}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{c.liveMembers}</CardTitle>
            <CardDescription>{c.liveMembersDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold text-black">{c.invite}</div>
              <p className="mt-1 text-xs text-black/50">
                {c.inviteDesc}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_auto]">
                <input
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="member@company.com"
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
                />
                <select
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value)}
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="OWNER">Owner</option>
                </select>
                <button
                  type="button"
                  disabled={!memberEmail || busy === "invite"}
                  onClick={() => saveMember({ email: memberEmail, role: memberRole })}
                  className="h-10 rounded-lg bg-black px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-black/30"
                >
                  {busy === "invite" ? c.saving : c.addMember}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="min-w-[780px] w-full text-left text-sm">
                <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                  <tr>
                    <th className="px-4 py-3">{c.member}</th>
                    <th className="px-4 py-3">{c.role}</th>
                    <th className="px-4 py-3">{c.joined}</th>
                    <th className="px-4 py-3">{c.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {data?.members?.length ? (
                    data.members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-black">{member.name || member.email || "-"}</div>
                          <div className="text-xs text-black/45">{member.email || "-"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={member.role}
                            onChange={(event) => saveMember({ id: member.id, role: event.target.value })}
                            disabled={busy === `role:${member.id}`}
                            className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold"
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-black/60">{fmtTime(member.createdAt)}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => saveMember({ id: member.id, role: member.role, remove: true })}
                            disabled={busy === `remove:${member.id}` || member.email === data?.currentUser?.email}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {busy === `remove:${member.id}` ? c.removing : c.remove}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-8 text-center text-black/45" colSpan={4}>
                        {loading ? c.loadingMembers : c.noMembers}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{c.liveAccess}</CardTitle>
            <CardDescription>{c.liveAccessDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">{c.requests}</div>
                <div className="mt-1 text-xl font-bold">{fmtNum(data?.usage?.requests)}</div>
              </div>
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">{c.modelCost}</div>
                <div className="mt-1 text-xl font-bold">{fmtUsd(data?.usage?.costUsd)}</div>
              </div>
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">{c.prodKeys}</div>
                <div className="mt-1 text-xl font-bold">{fmtNum(data?.keyCounts?.production)}</div>
              </div>
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">{c.tokens}</div>
                <div className="mt-1 text-xl font-bold">{fmtNum(data?.usage?.tokens)}</div>
              </div>
            </div>
            <div className="rounded-lg border border-black/10">
              {permissionRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-black/10 px-3 py-2 last:border-b-0">
                  <span className="text-sm text-black/60">{label}</span>
                  <span className="text-sm font-semibold text-black">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {localizedRoles.map((item) => (
          <Card key={item.role}>
            <CardHeader>
              <CardTitle>{item.role}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {item.permissions.map((permission) => (
                  <div key={permission} className="rounded-md bg-black/[0.03] px-3 py-2 text-xs font-semibold text-black/70">
                    {permission}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{c.permissionMatrix}</CardTitle>
            <CardDescription>{c.permissionDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                  <tr>
                    <th className="px-4 py-3">{c.capability}</th>
                    <th className="px-4 py-3">{c.allowedRoles}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {localizedMatrix.map(([capability, allowed]) => (
                    <tr key={capability}>
                      <td className="px-4 py-4 font-semibold text-black">{capability}</td>
                      <td className="px-4 py-4 text-black/60">{allowed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{c.rollout}</CardTitle>
            <CardDescription>{c.rolloutDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localizedRollout.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-lg border border-black/10 bg-black/[0.02] p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-black/65">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{c.boundary}</CardTitle>
          <CardDescription>
            {c.boundaryDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">{c.keys}</div>
              <p className="mt-2 text-sm text-black/60">{isZh ? "每个 key 的策略可控制预算、RPM、IP、task allowlists 和 model allowlists。" : "Per-key policy can control budgets, RPM, IPs, task allowlists, and model allowlists."}</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">{c.audit}</div>
              <p className="mt-2 text-sm text-black/60">{isZh ? "登录、key、支付、请求、失败和 Agent OS 事件都设计为可追踪。" : "Login, key, billing, request, failure, and Agent OS events are designed to be traceable."}</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">{c.legalDocs}</div>
              <p className="mt-2 text-sm text-black/60">
                {isZh ? "SLA、DPA、发票、条款和隐私文档可从 Docs、Security 和 Billing 进入。" : "SLA, DPA, invoices, terms, and privacy documents are linked from Docs, Security, and Billing."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
