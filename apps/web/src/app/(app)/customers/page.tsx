"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Customer = {
  email: string;
  orgId?: string | null;
  keyCount: number;
  activeKeyCount: number;
  revokedKeyCount: number;
  latestKeyCreatedAt?: string | null;
  latestKeyUsedAt?: string | null;
  latestLoginAt?: string | null;
  requestCount: number;
  failedRequestCount?: number;
  totalTokens: number;
  costUsd: number;
  lastRequestAt?: string | null;
  lastFailedRequestAt?: string | null;
  billing?: {
    plan?: string;
    status?: string;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
  members?: Array<{
    email?: string | null;
    role: string;
    createdAt: string;
  }>;
  keys: Array<{
    id: string;
    name: string;
    prefix: string;
    status: string;
    createdAt: string;
    lastUsedAt?: string | null;
    revokedAt?: string | null;
    usage?: {
      requests: number;
      tokens: number;
      costUsd: number;
      lastRequestAt?: string | null;
    };
  }>;
};

type EventRow = {
  id: string;
  action: string;
  target?: string | null;
  userEmail?: string | null;
  createdAt: string;
};

type FailedRequestRow = {
  id: string;
  orgId?: string | null;
  endpoint?: string | null;
  task: string;
  provider: string;
  model: string;
  errorCode?: string | null;
  statusCode?: number | null;
  error?: string | null;
  createdAt: string;
  apiKey?: {
    prefix?: string | null;
    name?: string | null;
    userEmail?: string | null;
  } | null;
};

type Payload = {
  success?: boolean;
  error?: string;
  hint?: string;
  data?: {
    customers: Customer[];
    recentEvents: EventRow[];
    recentFailedRequests?: FailedRequestRow[];
  };
};

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

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toTime(v?: string | null) {
  if (!v) return 0;
  const time = new Date(v).getTime();
  return Number.isFinite(time) ? time : 0;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white/60 p-4">
      <div className="text-xs text-black/45">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-black">{value}</div>
    </div>
  );
}

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [failedRequests, setFailedRequests] = useState<FailedRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const json = (await res.json()) as Payload;
      if (!res.ok || json.success === false) {
        throw new Error(json.error || json.hint || "Failed to load customers");
      }
      setRows(json.data?.customers || []);
      setEvents(json.data?.recentEvents || []);
      setFailedRequests(json.data?.recentFailedRequests || []);
    } catch (error: any) {
      setErr(error?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.email.toLowerCase().includes(q));
  }, [query, rows]);

  const totals = useMemo(() => {
    const weekAgo = daysAgo(7).getTime();
    const monthAgo = daysAgo(30).getTime();
    return rows.reduce(
      (acc, row) => {
        const latestActivity = Math.max(
          toTime(row.lastRequestAt),
          toTime(row.latestKeyUsedAt),
          toTime(row.latestKeyCreatedAt),
          toTime(row.latestLoginAt)
        );

        acc.customers += 1;
        acc.keys += row.keyCount || 0;
        acc.activeKeys += row.activeKeyCount || 0;
        acc.requests += row.requestCount || 0;
        acc.failedRequests += row.failedRequestCount || 0;
        acc.cost += row.costUsd || 0;
        if (latestActivity >= monthAgo) acc.activeCustomers += 1;
        if (toTime(row.latestLoginAt) >= weekAgo || toTime(row.latestKeyCreatedAt) >= weekAgo) {
          acc.newThisWeek += 1;
        }
        if ((row.requestCount || 0) > 0 && !(row.activeKeyCount || 0)) acc.usageWithoutActiveKey += 1;
        return acc;
      },
      {
        customers: 0,
        keys: 0,
        activeKeys: 0,
        requests: 0,
        cost: 0,
        activeCustomers: 0,
        newThisWeek: 0,
        usageWithoutActiveKey: 0,
        failedRequests: 0,
      }
    );
  }, [rows]);

  const topCustomers = useMemo(() => {
    return [...rows]
      .sort((a, b) => (b.costUsd || 0) - (a.costUsd || 0) || (b.requestCount || 0) - (a.requestCount || 0))
      .slice(0, 5);
  }, [rows]);

  const keyHealth = useMemo(() => {
    const unusedKeys = rows.reduce((sum, row) => {
      return sum + row.keys.filter((key) => !key.lastUsedAt && !key.revokedAt).length;
    }, 0);

    const recentEvents = events.slice(0, 20);
    const signIns = recentEvents.filter((event) => event.action === "console.sign_in").length;
    const keysCreated = recentEvents.filter((event) => event.action === "api_key.created").length;
    const billingEvents = recentEvents.filter((event) => event.action.startsWith("billing.")).length;

    return { unusedKeys, signIns, keysCreated, billingEvents };
  }, [events, rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-black/40">
            Operator view · 运营视角
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Customers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/55">
            See who signed in, created API keys, generated traffic, and spent model cost.
            查看谁登录、谁创建 API Key、谁产生调用和成本。
          </p>
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <Stat label="Customers" value={fmtNum(totals.customers)} />
        <Stat label="Active 30d" value={fmtNum(totals.activeCustomers)} />
        <Stat label="New 7d" value={fmtNum(totals.newThisWeek)} />
        <Stat label="Total keys" value={fmtNum(totals.keys)} />
        <Stat label="Active keys" value={fmtNum(totals.activeKeys)} />
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Stat label="Requests" value={fmtNum(totals.requests)} />
        <Stat label="Failed requests" value={fmtNum(totals.failedRequests)} />
        <Stat label="Model cost" value={fmtUsd(totals.cost)} />
        <Stat label="Unused keys" value={fmtNum(keyHealth.unusedKeys)} />
        <Stat label="Recent sign-ins" value={fmtNum(keyHealth.signIns)} />
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Stat label="Recent key creates" value={fmtNum(keyHealth.keysCreated)} />
        <Stat label="Billing events" value={fmtNum(keyHealth.billingEvents)} />
        <Stat label="Tracked failures" value={fmtNum(failedRequests.length)} />
        <Stat label="Operator events" value={fmtNum(events.length)} />
        <Stat label="Org roles" value="Owner / Admin / Member / Viewer" />
      </div>

      {totals.usageWithoutActiveKey ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {fmtNum(totals.usageWithoutActiveKey)} customer account(s) have historical usage but no active key. Review revoked keys or migration state.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Highest cost and request volume across visible customer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {topCustomers.length ? (
              topCustomers.map((row) => (
                <div key={row.email} className="rounded-lg border border-black/10 bg-white/60 p-4">
                  <div className="truncate text-sm font-semibold text-black">{row.email}</div>
                  <div className="mt-3 text-xl font-bold text-black">{fmtUsd(row.costUsd)}</div>
                  <div className="mt-1 text-xs text-black/45">
                    {fmtNum(row.requestCount)} requests · {fmtNum(row.activeKeyCount)} active keys
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-black/55">No customer usage yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Customer Accounts</CardTitle>
              <CardDescription>Login, key, usage, and spend summary</CardDescription>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email"
              className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 md:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[1120px]">
              <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/55">
                <div className="col-span-3">Email / Org</div>
                <div className="col-span-1 text-right">Keys</div>
                <div className="col-span-1 text-right">Errors</div>
                <div className="col-span-1 text-right">Requests</div>
                <div className="col-span-1 text-right">Cost</div>
                <div className="col-span-1">Plan</div>
                <div className="col-span-2">Latest login</div>
                <div className="col-span-2">Latest activity</div>
              </div>
              {filtered.length ? (
                filtered.map((row) => (
                  <div key={row.email} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-sm">
                    <div className="col-span-3 min-w-0">
                      <div className="truncate font-semibold text-black">{row.email}</div>
                      <div className="mt-1 text-xs text-black/40">org: {row.orgId || "-"}</div>
                    </div>
                    <div className="col-span-1 text-right text-black/70">
                      {fmtNum(row.activeKeyCount)} / {fmtNum(row.keyCount)}
                    </div>
                    <div className="col-span-1 text-right text-red-700">{fmtNum(row.failedRequestCount || 0)}</div>
                    <div className="col-span-1 text-right text-black/70">{fmtNum(row.requestCount)}</div>
                    <div className="col-span-1 text-right font-semibold text-black">{fmtUsd(row.costUsd)}</div>
                    <div className="col-span-1">
                      <div className="text-xs font-semibold capitalize text-black">{row.billing?.plan || "free"}</div>
                      <div className="text-xs text-black/40">{row.billing?.status || "inactive"}</div>
                    </div>
                    <div className="col-span-2 text-black/60">{fmtTime(row.latestLoginAt)}</div>
                    <div className="col-span-2 text-black/60">
                      {fmtTime(row.lastRequestAt || row.latestKeyUsedAt || row.latestKeyCreatedAt)}
                      {row.lastFailedRequestAt ? (
                        <div className="mt-1 text-xs text-red-700">Last failure {fmtTime(row.lastFailedRequestAt)}</div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-black/55">No customers yet.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Roles</CardTitle>
          <CardDescription>Membership and plan state for visible customer organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            {filtered.slice(0, 9).map((row) => (
              <div key={row.email} className="rounded-lg border border-black/10 bg-white/60 p-4">
                <div className="truncate text-sm font-semibold text-black">{row.email}</div>
                <div className="mt-2 text-xs text-black/45">Plan {row.billing?.plan || "free"} · {row.billing?.status || "inactive"}</div>
                <div className="mt-3 space-y-2">
                  {(row.members || []).length ? (
                    (row.members || []).slice(0, 4).map((member) => (
                      <div key={`${row.orgId}-${member.email}-${member.role}`} className="flex items-center justify-between gap-3 rounded-md bg-black/[0.03] px-3 py-2 text-xs">
                        <span className="truncate text-black/65">{member.email || "-"}</span>
                        <span className="font-semibold text-black">{member.role}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-black/45">No members loaded.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Requests</CardTitle>
          <CardDescription>Authenticated API failures with request ID, key prefix, endpoint, and error context</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-12 bg-black/5 px-3 py-2 text-xs font-semibold text-black/55">
                <div className="col-span-2">Request</div>
                <div className="col-span-2">Customer / Key</div>
                <div className="col-span-2">Endpoint</div>
                <div className="col-span-2">Model</div>
                <div className="col-span-2">Error</div>
                <div className="col-span-2">Time</div>
              </div>
              {failedRequests.length ? (
                failedRequests.slice(0, 30).map((row) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 border-t border-black/10 px-3 py-3 text-xs">
                    <div className="col-span-2 font-mono text-black">{row.id}</div>
                    <div className="col-span-2 min-w-0">
                      <div className="truncate text-black/70">{row.apiKey?.userEmail || "-"}</div>
                      <div className="font-mono text-black/40">{row.apiKey?.prefix || "-"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-mono text-black/60">{row.endpoint || "-"}</div>
                      <div className="text-black/40">{row.task}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-black/60">{row.provider}</div>
                      <div className="truncate font-mono text-black/40">{row.model}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-semibold text-red-700">{row.errorCode || row.statusCode || "failed"}</div>
                      <div className="truncate text-black/40">{row.error || "-"}</div>
                    </div>
                    <div className="col-span-2 text-black/45">{fmtTime(row.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-black/55">No failed requests recorded.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
          <CardDescription>Latest login, API key, billing, and security-sensitive events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.slice(0, 30).map((event) => (
              <div key={event.id} className="flex flex-col gap-1 rounded-lg border border-black/10 bg-white/60 p-3 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="font-semibold text-black">{event.action}</span>
                  <span className="ml-2 text-black/50">{event.userEmail || event.target || "-"}</span>
                </div>
                <div className="text-xs text-black/45">{fmtTime(event.createdAt)}</div>
              </div>
            ))}
            {!events.length ? <div className="text-sm text-black/55">No events yet.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
