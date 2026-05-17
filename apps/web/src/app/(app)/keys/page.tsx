"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

type ApiKeyRow = {
  id: string;
  name: string | null;
  prefix: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  status?: string;
  rateLimitRpm?: number | null;
  monthlyBudgetUsd?: number | null;
  scopes?: string[];
  allowedIps?: string[];
};

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur">
      <div className="text-xs text-black/55">{label}</div>
      <div className="mt-2 text-xl font-semibold text-black">{value}</div>
      {sub ? <div className="mt-1 text-xs text-black/45">{sub}</div> : null}
    </div>
  );
}

function envOf(name?: string | null) {
  const s = String(name || "").toLowerCase();
  if (s.includes("prod") || s.includes("live")) return "prod";
  if (s.includes("dev") || s.includes("test") || s.includes("local")) return "dev";
  return "unlabeled";
}

function fmtUSD(n?: number | null) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function KeysPage() {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState("default");
  const [newEnv, setNewEnv] = useState("prod");
  const [newRateLimit, setNewRateLimit] = useState("120");
  const [newBudget, setNewBudget] = useState("100");
  const [newScopes, setNewScopes] = useState("generate,chat,models");
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [envFilter, setEnvFilter] = useState("all");

  const activeRows = useMemo(() => rows.filter((r) => !r.revokedAt), [rows]);
  const revokedRows = useMemo(() => rows.filter((r) => !!r.revokedAt), [rows]);
  const prodRows = useMemo(() => rows.filter((r) => envOf(r.name) === "prod" && !r.revokedAt), [rows]);
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter === "active" && row.revokedAt) return false;
      if (statusFilter === "revoked" && !row.revokedAt) return false;
      if (envFilter !== "all" && envOf(row.name) !== envFilter) return false;
      if (q && !`${row.name || ""} ${row.prefix} ${row.id}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [envFilter, query, rows, statusFilter]);

  async function load() {
    setLoading(true);
    setToast("");
    try {
      const r = await fetch("/api/keys", { method: "GET", cache: "no-store" });
      const text = await r.text();
      const j = text ? JSON.parse(text) : null;

      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      if (j?.success) setRows(j.data || []);
      else throw new Error(j?.error || "Failed to load keys");
    } catch (e: any) {
      setToast(e?.message || "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!newName.trim()) {
      setToast("Key name is required.");
      return;
    }
    setCreating(true);
    setNewKeyPlain(null);
    setToast("");
    try {
      const r = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${newEnv}_${newName.trim()}`.replace(/_{2,}/g, "_"),
          rateLimitRpm: newRateLimit ? Number(newRateLimit) : undefined,
          monthlyBudgetUsd: newBudget ? Number(newBudget) : undefined,
          scopes: newScopes.split(",").map((x) => x.trim()).filter(Boolean),
        }),
      });

      const text = await r.text();
      const j = text ? JSON.parse(text) : null;

      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      if (!j?.success) throw new Error(j?.error || "Failed to create key");

      setNewKeyPlain(j?.data?.plainKey || null);
      setToast("Key created. Copy it now — it will be shown only once.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    const ok = window.confirm("Revoke this key? This cannot be undone.");
    if (!ok) return;

    setToast("");
    try {
      const r = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const text = await r.text();
      const j = text ? JSON.parse(text) : null;

      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      if (!j?.success) throw new Error(j?.error || "Failed to revoke key");

      setToast("Key revoked.");
      await load();
    } catch (e: any) {
      setToast(e?.message || "Failed to revoke key");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Console</Badge>
            <Badge>Keys</Badge>
            <span className="text-xs text-black/45">Use via headers: <b className="text-black">x-api-key</b> or <b className="text-black">Authorization: Bearer</b></span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-black">API Keys</h1>
          <p className="mt-1 text-sm text-black/55">
            Create, rotate, revoke keys. Plaintext key is shown only once.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading} className="whitespace-nowrap">
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Active keys" value={`${activeRows.length}`} sub="Not revoked" />
        <Stat label="Production keys" value={`${prodRows.length}`} sub="Named prod/live" />
        <Stat label="Revoked keys" value={`${revokedRows.length}`} sub="Disabled permanently" />
        <Stat label="Total keys" value={`${rows.length}`} sub="Across environments" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Safe free testing path</CardTitle>
          <CardDescription>
            Start with low-risk keys, free task intelligence, and usage checks before customer traffic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">Keep keys server-side</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">
                Do not place OneAI keys in browser code, mobile apps, screenshots, or public repos.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">Test free tasks first</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">
                Validate business_strategy and content_engine before moving to paid Pro or Team tasks.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">Watch spend from day one</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">
                Set a monthly budget, then confirm requests, tokens, and model cost in Usage.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/playground" className="inline-flex h-9 items-center rounded-lg bg-black px-3 text-sm font-semibold text-white hover:bg-neutral-900">
              Run free test
            </Link>
            <Link href="/usage" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              Check usage
            </Link>
            <Link href="/docs/guides/production-checklist" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              Security checklist
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle>Create key</CardTitle>
          <CardDescription>Name it by environment / service (e.g. prod_web, dev_cli, batch_worker).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {toast ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 p-3 text-sm text-black/70">
              {toast}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <div className="mb-1 text-xs text-black/50">Environment</div>
              <Select value={newEnv} onChange={(e) => setNewEnv(e.target.value)}>
                <option value="prod">prod</option>
                <option value="dev">dev</option>
                <option value="test">test</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">Key name</div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="web / api / cli ..."
                className="border-black/10 bg-white text-black placeholder:text-black/35"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">Rate limit RPM</div>
              <Input value={newRateLimit} onChange={(e) => setNewRateLimit(e.target.value)} placeholder="120" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">Monthly budget USD</div>
              <Input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="100" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div>
              <div className="mb-1 text-xs text-black/50">Scopes</div>
              <Input value={newScopes} onChange={(e) => setNewScopes(e.target.value)} placeholder="generate,chat,models" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
            <div className="flex items-end">
              <Button onClick={createKey} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create key"}
              </Button>
            </div>
          </div>

          {newKeyPlain ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-black">New key (copy now)</div>
                  <div className="text-xs text-black/45">This value will not be shown again.</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(newKeyPlain);
                    setToast("Copied to clipboard.");
                  }}
                >
                  Copy
                </Button>
              </div>

              <div className="mt-3 rounded-xl border border-black/10 bg-white p-3">
                <code className="break-all text-sm text-black/80">{newKeyPlain}</code>
              </div>
              <div className="mt-3 rounded-xl border border-black/10 bg-[#0f1115] p-3">
                <pre className="overflow-auto text-xs leading-relaxed text-white/75">
                  <code>{`curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${newKeyPlain}" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Validate OneAI API for my product",
      "audience": "SaaS builders",
      "constraints": ["Keep it practical", "Keep it short"]
    },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.03 } }
  }' | jq`}</code>
                </pre>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Keys</CardTitle>
          <CardDescription>Manage access and track last usage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_160px]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search key name, prefix, id..." className="border-black/10 bg-white text-black placeholder:text-black/35" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </Select>
            <Select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)}>
              <option value="all">All env</option>
              <option value="prod">prod/live</option>
              <option value="dev">dev/test</option>
              <option value="unlabeled">unlabeled</option>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/60">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                <div className="col-span-3">Name</div>
                <div className="col-span-1">Env</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Prefix</div>
                <div className="col-span-2 text-right">Policy</div>
                <div className="col-span-2">Last used</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {filteredRows.length === 0 ? (
                <div className="p-4 text-sm text-black/55">No keys yet. Create one above.</div>
              ) : (
                filteredRows.map((r) => {
                const revoked = !!r.revokedAt;
                const env = envOf(r.name);
                return (
                  <div
                    key={r.id}
                    className={[
                      "grid grid-cols-12 gap-2 px-3 py-3 text-sm",
                      "border-t border-black/10",
                      revoked ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <div className="col-span-3">
                      <div className="font-medium text-black">{r.name || "(no name)"}</div>
                      <div className="text-xs text-black/45">id: {r.id}</div>
                      {r.scopes?.length ? <div className="mt-1 text-xs text-black/45">scopes: {r.scopes.join(", ")}</div> : null}
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span className={["rounded-full px-2 py-0.5 text-xs font-semibold", env === "prod" ? "bg-black text-white" : "bg-black/10 text-black/60"].join(" ")}>
                        {env}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center">
                      {revoked ? (
                        <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-black">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center">
                      <code className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black/75">
                        {r.prefix}
                      </code>
                    </div>

                    <div className="col-span-2 text-right text-xs text-black/60">
                      <div>{r.rateLimitRpm ? `${r.rateLimitRpm} RPM` : "Default RPM"}</div>
                      <div>{r.monthlyBudgetUsd ? `${fmtUSD(r.monthlyBudgetUsd)} budget` : "Plan budget"}</div>
                    </div>
                    <div className="col-span-2 flex items-center text-black/70">
                      <span className="text-black/70">{fmtTime(r.lastUsedAt)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      {!revoked ? (
                        <Button variant="secondary" size="sm" onClick={() => revoke(r.id)}>
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-black/45">
            Tip: keep keys server-side. Use <Link href="/docs/quickstart" className="font-semibold text-black hover:underline">Quickstart</Link> and <Link href="/usage" className="font-semibold text-black hover:underline">Usage</Link> to validate production traffic.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
