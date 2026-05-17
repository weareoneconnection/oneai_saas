"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/lib/i18n";

type ApiKeyRow = {
  id: string;
  name: string | null;
  prefix: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  status?: string;
  environment?: string | null;
  rateLimitRpm?: number | null;
  monthlyBudgetUsd?: number | null;
  scopes?: string[];
  allowedIps?: string[];
  allowedTasks?: string[];
  allowedModels?: string[];
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

function envLabel(row: ApiKeyRow) {
  const raw = String(row.environment || "").toLowerCase();
  if (raw === "production") return "prod";
  if (raw === "staging") return "test";
  if (raw === "development") return "dev";
  return envOf(row.name);
}

function fmtUSD(n?: number | null) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function KeysPage() {
  const { isZh } = useI18n();
  const c = (en: string, zh: string) => (isZh ? zh : en);
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState("default");
  const [newEnv, setNewEnv] = useState("prod");
  const [newRateLimit, setNewRateLimit] = useState("120");
  const [newBudget, setNewBudget] = useState("100");
  const [newScopes, setNewScopes] = useState("generate,chat,models");
  const [newAllowedTasks, setNewAllowedTasks] = useState("business_strategy,content_engine");
  const [newAllowedModels, setNewAllowedModels] = useState("");
  const [newAllowedIps, setNewAllowedIps] = useState("");
  const [savingPolicyId, setSavingPolicyId] = useState("");
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [envFilter, setEnvFilter] = useState("all");

  const activeRows = useMemo(() => rows.filter((r) => !r.revokedAt), [rows]);
  const revokedRows = useMemo(() => rows.filter((r) => !!r.revokedAt), [rows]);
  const prodRows = useMemo(() => rows.filter((r) => envLabel(r) === "prod" && !r.revokedAt), [rows]);
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter === "active" && row.revokedAt) return false;
      if (statusFilter === "revoked" && !row.revokedAt) return false;
      if (envFilter !== "all" && envLabel(row) !== envFilter) return false;
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
          environment: newEnv === "prod" ? "PRODUCTION" : newEnv === "test" ? "STAGING" : "DEVELOPMENT",
          rateLimitRpm: newRateLimit ? Number(newRateLimit) : undefined,
          monthlyBudgetUsd: newBudget ? Number(newBudget) : undefined,
          scopes: newScopes.split(",").map((x) => x.trim()).filter(Boolean),
          allowedTasks: newAllowedTasks.split(",").map((x) => x.trim()).filter(Boolean),
          allowedModels: newAllowedModels.split(",").map((x) => x.trim()).filter(Boolean),
          allowedIps: newAllowedIps.split(",").map((x) => x.trim()).filter(Boolean),
        }),
      });

      const text = await r.text();
      const j = text ? JSON.parse(text) : null;

      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      if (!j?.success) throw new Error(j?.error || "Failed to create key");

      setNewKeyPlain(j?.data?.plainKey || null);
      setToast(c("Key created. Copy it now — it will be shown only once.", "Key 已创建，请立即复制，只会显示一次。"));
      await load();
    } catch (e: any) {
      setToast(e?.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function savePolicy(row: ApiKeyRow) {
    setSavingPolicyId(row.id);
    setToast("");
    try {
      const r = await fetch("/api/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          environment: row.environment || envOf(row.name).toUpperCase(),
          rateLimitRpm: row.rateLimitRpm || null,
          monthlyBudgetUsd: row.monthlyBudgetUsd || null,
          scopes: row.scopes || [],
          allowedIps: row.allowedIps || [],
          allowedTasks: row.allowedTasks || [],
          allowedModels: row.allowedModels || [],
        }),
      });

      const text = await r.text();
      const j = text ? JSON.parse(text) : null;
      if (!r.ok || !j?.success) throw new Error(j?.error || `HTTP ${r.status}`);
      setToast(c("Key policy updated.", "Key 策略已更新。"));
      await load();
    } catch (e: any) {
      setToast(e?.message || "Failed to update key policy");
    } finally {
      setSavingPolicyId("");
    }
  }

  function updateRow(id: string, patch: Partial<ApiKeyRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function revoke(id: string) {
    const ok = window.confirm(c("Revoke this key? This cannot be undone.", "确认禁用这个 key？此操作不可撤销。"));
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

      setToast(c("Key revoked.", "Key 已禁用。"));
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
            <span className="text-xs text-black/45">{c("Use via headers:", "通过请求头使用：")} <b className="text-black">x-api-key</b> {c("or", "或")} <b className="text-black">Authorization: Bearer</b></span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-black">{c("API Keys", "API 密钥")}</h1>
          <p className="mt-1 text-sm text-black/55">
            {c("Create, rotate, revoke keys. Plaintext key is shown only once.", "创建、轮换和禁用密钥。明文 key 只会显示一次。")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading} className="whitespace-nowrap">
            {loading ? c("Refreshing...", "刷新中...") : c("Refresh", "刷新")}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label={c("Active keys", "活跃密钥")} value={`${activeRows.length}`} sub={c("Not revoked", "未禁用")} />
        <Stat label={c("Production keys", "生产密钥")} value={`${prodRows.length}`} sub={c("Named prod/live", "prod/live 命名")} />
        <Stat label={c("Revoked keys", "已禁用密钥")} value={`${revokedRows.length}`} sub={c("Disabled permanently", "永久禁用")} />
        <Stat label={c("Total keys", "密钥总数")} value={`${rows.length}`} sub={c("Across environments", "全部环境")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{c("API Key Security Policy", "API Key 安全策略")}</CardTitle>
          <CardDescription>
            {c(
              "Limit keys by environment, spend, RPM, task, model, and IP. These settings create a safer path from free test to production traffic.",
              "按环境、预算、RPM、task、model 和 IP 限制 key，让免费测试到生产流量更安全。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("Environment", "环境")}</div>
              <p className="mt-2 text-sm text-black/55">{c("Separate prod, dev, and test keys to reduce blast radius.", "区分 prod、dev 和 test key，降低事故影响范围。")}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("Task allowlist", "Task 白名单")}</div>
              <p className="mt-2 text-sm text-black/55">{c("Restrict a key to public commercial tasks or internal workflows.", "限制 key 只能调用公开商用 task 或内部 workflow。")}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("Model allowlist", "模型白名单")}</div>
              <p className="mt-2 text-sm text-black/55">{c("Prevent accidental premium model spend from one leaked key.", "防止单个泄露 key 意外调用高价模型。")}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("IP and budget", "IP 和预算")}</div>
              <p className="mt-2 text-sm text-black/55">{c("Use RPM, IP, and monthly budgets for enterprise-grade control.", "使用 RPM、IP 和月度预算实现企业级控制。")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c("Safe free testing path", "安全免费测试路径")}</CardTitle>
          <CardDescription>
            {c("Start with low-risk keys, free task intelligence, and usage checks before customer traffic.", "先用低风险 key、免费 task intelligence 和用量检查，再接入客户流量。")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("Keep keys server-side", "密钥只放服务端")}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">
                {c("Do not place OneAI keys in browser code, mobile apps, screenshots, or public repos.", "不要把 OneAI key 放在浏览器代码、移动端、截图或公开仓库中。")}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("Test free tasks first", "先测试免费 task")}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">
                {c("Validate business_strategy and content_engine before moving to paid Pro or Team tasks.", "先验证 business_strategy 和 content_engine，再升级到 Pro 或 Team task。")}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-bold text-black">{c("Watch spend from day one", "从第一天监控成本")}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/55">
                {c("Set a monthly budget, then confirm requests, tokens, and model cost in Usage.", "设置月度预算，并在 Usage 中确认请求、tokens 和模型成本。")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/playground" className="inline-flex h-9 items-center rounded-lg bg-black px-3 text-sm font-semibold text-white hover:bg-neutral-900">
              {c("Run free test", "运行免费测试")}
            </Link>
            <Link href="/usage" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              {c("Check usage", "查看用量")}
            </Link>
            <Link href="/docs/guides/production-checklist" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              {c("Security checklist", "安全检查清单")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Create key", "创建密钥")}</CardTitle>
          <CardDescription>{c("Name it by environment / service (e.g. prod_web, dev_cli, batch_worker).", "按环境 / 服务命名，例如 prod_web、dev_cli、batch_worker。")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {toast ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 p-3 text-sm text-black/70">
              {toast}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Environment", "环境")}</div>
              <Select value={newEnv} onChange={(e) => setNewEnv(e.target.value)}>
                <option value="prod">prod</option>
                <option value="dev">dev</option>
                <option value="test">test</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Key name", "密钥名称")}</div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="web / api / cli ..."
                className="border-black/10 bg-white text-black placeholder:text-black/35"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Rate limit RPM", "RPM 限流")}</div>
              <Input value={newRateLimit} onChange={(e) => setNewRateLimit(e.target.value)} placeholder="120" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Monthly budget USD", "月度预算 USD")}</div>
              <Input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="100" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Scopes", "权限范围")}</div>
              <Input value={newScopes} onChange={(e) => setNewScopes(e.target.value)} placeholder="generate,chat,models" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
            <div className="flex items-end">
              <Button onClick={createKey} disabled={creating} className="w-full">
                {creating ? c("Creating...", "创建中...") : c("Create key", "创建密钥")}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Allowed tasks", "允许的 tasks")}</div>
              <Input value={newAllowedTasks} onChange={(e) => setNewAllowedTasks(e.target.value)} placeholder="business_strategy,content_engine" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Allowed models", "允许的模型")}</div>
              <Input value={newAllowedModels} onChange={(e) => setNewAllowedModels(e.target.value)} placeholder="openai:gpt-5.2,deepseek:deepseek-chat" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
            <div>
              <div className="mb-1 text-xs text-black/50">{c("Allowed IPs", "允许的 IP")}</div>
              <Input value={newAllowedIps} onChange={(e) => setNewAllowedIps(e.target.value)} placeholder="203.0.113.10,198.51.100.2" className="border-black/10 bg-white text-black placeholder:text-black/35" />
            </div>
          </div>

          {newKeyPlain ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-black">{c("New key (copy now)", "新密钥（立即复制）")}</div>
                  <div className="text-xs text-black/45">{c("This value will not be shown again.", "这个值不会再次显示。")}</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(newKeyPlain);
                    setToast(c("Copied to clipboard.", "已复制到剪贴板。"));
                  }}
                >
                  {c("Copy", "复制")}
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
          <CardTitle>{c("Keys", "密钥")}</CardTitle>
          <CardDescription>{c("Manage access and track last usage.", "管理访问权限并追踪最近使用。")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_160px]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c("Search key name, prefix, id...", "搜索密钥名称、prefix、id...")} className="border-black/10 bg-white text-black placeholder:text-black/35" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{c("All status", "全部状态")}</option>
              <option value="active">{c("Active", "活跃")}</option>
              <option value="revoked">{c("Revoked", "已禁用")}</option>
            </Select>
            <Select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)}>
              <option value="all">{c("All env", "全部环境")}</option>
              <option value="prod">prod/live</option>
              <option value="dev">dev/test</option>
              <option value="unlabeled">unlabeled</option>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/60">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-12 gap-2 bg-black/5 px-3 py-2 text-xs font-semibold text-black/60">
                <div className="col-span-3">{c("Name", "名称")}</div>
                <div className="col-span-1">Env</div>
                <div className="col-span-1">{c("Status", "状态")}</div>
                <div className="col-span-2">Prefix</div>
                <div className="col-span-2 text-right">{c("Policy", "策略")}</div>
                <div className="col-span-2">{c("Last used", "最近使用")}</div>
                <div className="col-span-1 text-right">{c("Action", "操作")}</div>
              </div>

              {filteredRows.length === 0 ? (
                <div className="p-4 text-sm text-black/55">{c("No keys yet. Create one above.", "暂无密钥，请先创建。")}</div>
              ) : (
                filteredRows.map((r) => {
                const revoked = !!r.revokedAt;
                const env = envLabel(r);
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
                      <div className="mt-2 space-y-1">
                        <Input
                          value={(r.allowedTasks || []).join(",")}
                          onChange={(e) => updateRow(r.id, { allowedTasks: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                          placeholder="allowed tasks"
                          disabled={revoked}
                          className="h-8 text-xs"
                        />
                        <Input
                          value={(r.allowedModels || []).join(",")}
                          onChange={(e) => updateRow(r.id, { allowedModels: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                          placeholder="allowed models"
                          disabled={revoked}
                          className="h-8 text-xs"
                        />
                        <Input
                          value={(r.allowedIps || []).join(",")}
                          onChange={(e) => updateRow(r.id, { allowedIps: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                          placeholder="allowed IPs"
                          disabled={revoked}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <Select
                        value={env}
                        onChange={(e) =>
                          updateRow(r.id, {
                            environment:
                              e.target.value === "prod"
                                ? "PRODUCTION"
                                : e.target.value === "test"
                                  ? "STAGING"
                                  : "DEVELOPMENT",
                          })
                        }
                        className="h-8 text-xs"
                        disabled={revoked}
                      >
                        <option value="prod">prod</option>
                        <option value="dev">dev</option>
                        <option value="test">test</option>
                      </Select>
                    </div>

                    <div className="col-span-1 flex items-center">
                      {revoked ? (
                        <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-black">
                          {c("Revoked", "已禁用")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                          {c("Active", "活跃")}
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center">
                      <code className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black/75">
                        {r.prefix}
                      </code>
                    </div>

                    <div className="col-span-2 space-y-1 text-right text-xs text-black/60">
                      <Input
                        value={r.rateLimitRpm ?? ""}
                        onChange={(e) => updateRow(r.id, { rateLimitRpm: e.target.value ? Number(e.target.value) : null })}
                        placeholder="RPM"
                        disabled={revoked}
                        className="h-8 text-right text-xs"
                      />
                      <Input
                        value={r.monthlyBudgetUsd ?? ""}
                        onChange={(e) => updateRow(r.id, { monthlyBudgetUsd: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Budget USD"
                        disabled={revoked}
                        className="h-8 text-right text-xs"
                      />
                    </div>
                    <div className="col-span-2 flex items-center text-black/70">
                      <span className="text-black/70">{fmtTime(r.lastUsedAt)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      {!revoked ? (
                        <div className="flex flex-col gap-1">
                          <Button variant="secondary" size="sm" onClick={() => savePolicy(r)} disabled={savingPolicyId === r.id}>
                            {savingPolicyId === r.id ? c("Saving", "保存中") : c("Save", "保存")}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => revoke(r.id)}>
                            {c("Revoke", "禁用")}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-black/45">
            {c("Tip: keep keys server-side. Use", "提示：密钥只放服务端。使用")} <Link href="/docs/quickstart" className="font-semibold text-black hover:underline">Quickstart</Link> {c("and", "和")} <Link href="/usage" className="font-semibold text-black hover:underline">Usage</Link> {c("to validate production traffic.", "验证生产流量。")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
