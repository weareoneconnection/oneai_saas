"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

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

function boolLabel(value?: boolean) {
  return value ? "Allowed" : "Locked";
}

export default function TeamPage() {
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
  const permissionRows = useMemo(() => {
    const permissions = data?.permissions || {};
    return [
      ["Create keys", boolLabel(permissions.canCreateKeys)],
      ["Manage billing", boolLabel(permissions.canManageBilling)],
      ["Review proof", boolLabel(permissions.canReviewProof)],
      ["Manage members", boolLabel(permissions.canManageMembers)],
    ];
  }, [data?.permissions]);

  return (
    <div className="max-w-full overflow-hidden space-y-6">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>Team</Badge>
            <Badge>RBAC</Badge>
          </div>
          <h1 className="mt-4 text-wrap text-3xl font-bold tracking-tight">Team and Organization Access</h1>
          <p className="mt-2 max-w-3xl text-wrap text-sm leading-relaxed text-black/60">
            OneAI already has organization membership and role foundations. This page turns that
            structure into a customer-facing enterprise access model without changing existing APIs.
          </p>
        </div>
        <Link
          href="/customers"
          className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black/[0.03]"
        >
          Operator customers
        </Link>
      </div>

      {payload && !payload.success ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Team data unavailable</CardTitle>
            <CardDescription className="text-red-800">
              {payload.error || "Unable to load team data."}
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
            <CardDescription>Organization</CardDescription>
            <CardTitle>{data?.org?.name || (loading ? "Loading..." : "-")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-black/45">{data?.org?.slug || "Current customer org"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Your role</CardDescription>
            <CardTitle>{data?.currentUser?.role || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="truncate text-xs text-black/45">{data?.currentUser?.email || "Sign in to load"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Plan</CardDescription>
            <CardTitle>{data?.billing?.plan || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-black/45">{data?.billing?.status || "inactive"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active keys</CardDescription>
            <CardTitle>{fmtNum(data?.keyCounts?.active)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-black/45">{fmtNum(data?.keyCounts?.total)} total keys</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Live Members</CardTitle>
            <CardDescription>Members loaded from the current organization membership table.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold text-black">Invite or update member</div>
              <p className="mt-1 text-xs text-black/50">
                Owner-only action. The member is attached to this organization and all changes are audit logged.
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
                  {busy === "invite" ? "Saving..." : "Add member"}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="min-w-[780px] w-full text-left text-sm">
                <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
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
                            {busy === `remove:${member.id}` ? "Removing..." : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-8 text-center text-black/45" colSpan={4}>
                        {loading ? "Loading members..." : "No members loaded."}
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
            <CardTitle>Live Access State</CardTitle>
            <CardDescription>Current organization permissions and usage footprint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">Requests</div>
                <div className="mt-1 text-xl font-bold">{fmtNum(data?.usage?.requests)}</div>
              </div>
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">Model cost</div>
                <div className="mt-1 text-xl font-bold">{fmtUsd(data?.usage?.costUsd)}</div>
              </div>
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">Production keys</div>
                <div className="mt-1 text-xl font-bold">{fmtNum(data?.keyCounts?.production)}</div>
              </div>
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <div className="text-xs text-black/45">Tokens</div>
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
        {roles.map((item) => (
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
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>Default enterprise permissions for customer organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                  <tr>
                    <th className="px-4 py-3">Capability</th>
                    <th className="px-4 py-3">Allowed roles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {matrix.map(([capability, allowed]) => (
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
            <CardTitle>Enterprise Rollout State</CardTitle>
            <CardDescription>What is already true, and what should remain explicit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rollout.map((item, index) => (
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
          <CardTitle>Commercial Boundary</CardTitle>
          <CardDescription>
            Team permissions govern access to OneAI intelligence infrastructure. Execution stays outside OneAI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">Keys</div>
              <p className="mt-2 text-sm text-black/60">Per-key policy can control budgets, RPM, IPs, task allowlists, and model allowlists.</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">Audit</div>
              <p className="mt-2 text-sm text-black/60">Login, key, billing, request, failure, and Agent OS events are designed to be traceable.</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">Legal docs</div>
              <p className="mt-2 text-sm text-black/60">
                SLA, DPA, invoices, terms, and privacy documents are linked from Docs, Security, and Billing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
