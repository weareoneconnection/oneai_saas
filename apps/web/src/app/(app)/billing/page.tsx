// apps/web/src/app/(app)/billing/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/lib/i18n";

type BillingData = {
  plan: "free" | "pro" | "team" | "business" | string;
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "inactive"
    | string;
  currentPeriodEnd?: string | null;
  effectivePlan?: string;
  policy?: {
    monthlyRequestLimit: number;
    monthlyCostLimitUsd: number;
    rateLimitRpm: number;
    maxCostPerRequestUsd: number;
    allowedTiers: string[];
    allowedModes: string[];
    allowDebug: boolean;
    allowExplicitModelSelection: boolean;
    allowModelRegistry: boolean;
  };
  monthUsage?: {
    fromISO: string;
    requestCount: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    activeKeys: number;
  };
  remaining?: {
    requests: number;
    costUsd: number;
  };
  stripeConfig?: {
    secretKey: boolean;
    webhookSecret: boolean;
    pricePro: boolean;
    priceTeam: boolean;
  };
  checkout?: {
    enabled: boolean;
    portalAvailable: boolean;
  };
  auditLogs?: Array<{
    id: string;
    action: string;
    target?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
  }>;
};

type Notice = { type: "success" | "warn" | "error"; text: string };

const ENABLE_STRIPE_CHECKOUT = process.env.NEXT_PUBLIC_ENABLE_STRIPE_CHECKOUT === "1";
const CONTACT_SALES_EMAIL = "info@weareoneconnection.com";
const CONTACT_SALES_HREF =
  `mailto:${CONTACT_SALES_EMAIL}?subject=OneAI%20SaaS%20plan`;
const CONTACT_TELEGRAM_HREF = "https://t.me/waocfounder";
const CONTACT_X_HREF = "https://x.com/waoconnectone?s=21";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    desc: "Validate the API, generate test outputs, and inspect usage.",
    cta: "Current free access",
    features: ["Developer API key", "Basic task access", "Usage dashboard"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$29/mo",
    desc: "For builders shipping production workflows on top of OneAI.",
    cta: "Upgrade to Pro",
    env: "NEXT_PUBLIC_STRIPE_PRICE_PRO",
    features: [
      "Higher request limits",
      "Cost-aware model routing",
      "Request IDs and idempotency",
      "Customer usage analytics",
    ],
  },
  {
    key: "team",
    name: "Team",
    price: "$99/mo",
    desc: "For teams that need shared usage, stronger limits, and billing ops.",
    cta: "Upgrade to Team",
    env: "NEXT_PUBLIC_STRIPE_PRICE_TEAM",
    features: [
      "Shared organization billing",
      "API key governance",
      "Provider/model policy",
      "Agent OS preview and handoff contracts",
      "Priority commercial support",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    desc: "For production customers that need custom policy, provider controls, and support.",
    cta: "Contact sales",
    features: [
      "Custom request and cost limits",
      "Custom provider/model policy",
      "Private model configuration",
      "Private Agent OS handoff protocol",
      "Launch support and operational review",
    ],
  },
] as const;

const planMatrix = [
  ["Monthly requests", "1,000", "50,000", "250,000", "Custom"],
  ["Monthly model-cost guard", "$10", "$500", "$2,500", "Custom"],
  ["Rate limit", "30 RPM", "120 RPM", "600 RPM", "Custom"],
  ["Max cost/request", "$0.05", "$1", "$5", "Custom"],
  ["Routing modes", "cheap, balanced", "cheap, balanced, fast, auto", "all modes", "all modes"],
  ["Debug trace", "locked", "locked", "enabled", "enabled"],
  ["Explicit model selection", "locked", "locked", "enabled", "enabled"],
  ["Model registry", "locked", "locked", "enabled", "enabled"],
  ["Agent OS preview", "locked", "locked", "enabled", "enabled"],
  ["Handoff contracts", "locked", "locked", "preview", "custom"],
  ["Context preview", "locked", "locked", "enabled", "custom"],
  ["Private executor policy", "locked", "locked", "locked", "enabled"],
];

type PlanCardData = {
  key: "free" | "pro" | "team" | "enterprise";
  name: string;
  price: string;
  desc: string;
  cta: string;
  env?: string;
  features: readonly string[];
};

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  if (s === "trialing") return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  if (s === "past_due") return "border-red-500/20 bg-red-500/10 text-red-700";
  return "border-black/10 bg-black/[0.03] text-black/60";
}

function formatDate(d?: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString();
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(n || 0)));
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(Number(n || 0));
}

function fmtTime(d?: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString();
}

function pct(used: number, limit?: number) {
  if (!limit) return 0;
  return Math.max(0, Math.min(100, (Number(used || 0) / limit) * 100));
}

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const cls =
    notice.type === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800"
      : notice.type === "warn"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-900"
        : "border-red-500/20 bg-red-500/10 text-red-900";

  return (
    <div className={`flex items-start justify-between gap-3 rounded-lg border p-4 text-sm ${cls}`}>
      <div className="leading-relaxed">{notice.text}</div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100"
      >
        x
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlan,
  busy,
  onCheckout,
}: {
  plan: PlanCardData;
  currentPlan: string;
  busy: string | null;
  onCheckout: (tier: "pro" | "team") => void;
}) {
  const isCurrent = currentPlan === plan.key;
  const priceId =
    plan.key === "pro"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO
      : plan.key === "team"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM
        : "";
  const canBuy = plan.key === "pro" || plan.key === "team";
  const canCheckout = canBuy && ENABLE_STRIPE_CHECKOUT;
  const isEnterprise = plan.key === "enterprise";

  return (
    <div
      className={[
        "rounded-lg border p-5",
        isCurrent ? "border-black bg-black text-white" : "border-black/10 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={isCurrent ? "text-sm font-bold text-white" : "text-sm font-bold text-black"}>
            {plan.name}
          </div>
          <div className={isCurrent ? "mt-2 text-3xl font-bold text-white" : "mt-2 text-3xl font-bold text-black"}>
            {plan.price}
          </div>
        </div>
        {isCurrent ? (
          <span className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80">
            Current
          </span>
        ) : null}
      </div>

      <p className={isCurrent ? "mt-3 text-sm leading-relaxed text-white/70" : "mt-3 text-sm leading-relaxed text-black/60"}>
        {plan.desc}
      </p>

      <div className="mt-5 space-y-2">
        {plan.features.map((feature) => (
          <div
            key={feature}
            className={isCurrent ? "text-sm text-white/80" : "text-sm text-black/70"}
          >
            {feature}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {canCheckout ? (
          <Button
            variant={isCurrent ? "secondary" : "primary"}
            onClick={() => {
              if (plan.key === "pro" || plan.key === "team") onCheckout(plan.key);
            }}
            disabled={busy !== null || !priceId}
            className="w-full"
          >
            {busy === plan.key ? "Redirecting..." : plan.cta}
          </Button>
        ) : canBuy || isEnterprise ? (
          <Link
            href={CONTACT_SALES_HREF}
            className={[
              "inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition",
              isCurrent
                ? "border border-white/20 bg-white text-black hover:bg-white/90"
                : "border border-black/15 bg-black text-white hover:bg-neutral-900",
            ].join(" ")}
          >
            Contact sales
          </Link>
        ) : (
          <Button variant="secondary" disabled className="w-full">
            {plan.cta}
          </Button>
        )}
        {canCheckout && !priceId ? (
          <div className={isCurrent ? "mt-2 text-xs text-white/50" : "mt-2 text-xs text-black/45"}>
            Missing {plan.env}
          </div>
        ) : canBuy && !ENABLE_STRIPE_CHECKOUT ? (
          <div className={isCurrent ? "mt-2 text-xs text-white/50" : "mt-2 text-xs text-black/45"}>
            Manual onboarding while Stripe is pending.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { isZh } = useI18n();
  const c = (en: string, zh: string) => (isZh ? zh : en);
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"pro" | "team" | "portal" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const plan = data?.plan || "free";
  const effectivePlan = data?.effectivePlan || plan;
  const status = data?.status || "inactive";
  const canPortal = plan !== "free" && status !== "inactive";
  const periodEnd = useMemo(
    () => formatDate(data?.currentPeriodEnd),
    [data?.currentPeriodEnd]
  );
  const requestUsagePct = pct(data?.monthUsage?.requestCount || 0, data?.policy?.monthlyRequestLimit);
  const costUsagePct = pct(data?.monthUsage?.costUsd || 0, data?.policy?.monthlyCostLimitUsd);
  const riskLevel = Math.max(requestUsagePct, costUsagePct);
  const riskLabel = riskLevel >= 90 ? "Critical" : riskLevel >= 70 ? "Watch" : "Healthy";
  const riskClass =
    riskLevel >= 90
      ? "border-red-500/20 bg-red-500/10 text-red-800"
      : riskLevel >= 70
        ? "border-amber-500/20 bg-amber-500/10 text-amber-900"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-800";
  const stripeReady =
    !!data?.stripeConfig?.secretKey &&
    !!data?.stripeConfig?.pricePro &&
    !!data?.stripeConfig?.priceTeam;
  const webhookReady = !!data?.stripeConfig?.webhookSecret;
  const selfServeReady = ENABLE_STRIPE_CHECKOUT && stripeReady && webhookReady;
  const localizedPlans = plans.map((item) => {
    if (item.key === "free") {
      return {
        ...item,
        desc: c("Validate the API, generate test outputs, and inspect usage.", "验证 API、生成测试输出并查看用量。"),
        cta: c("Current free access", "当前免费权限"),
        features: [c("Developer API key", "开发者 API key"), c("Basic task access", "基础 task 权限"), c("Usage dashboard", "用量看板")],
      };
    }
    if (item.key === "pro") {
      return {
        ...item,
        desc: c("For builders shipping production workflows on top of OneAI.", "适合基于 OneAI 上线生产 workflow 的开发者。"),
        cta: c("Upgrade to Pro", "升级到 Pro"),
        features: [
          c("Higher request limits", "更高请求额度"),
          c("Cost-aware model routing", "成本感知模型路由"),
          "Request IDs and idempotency",
          c("Customer usage analytics", "客户用量分析"),
        ],
      };
    }
    if (item.key === "team") {
      return {
        ...item,
        desc: c("For teams that need shared usage, stronger limits, and billing ops.", "适合需要共享用量、更强限额和账单运营的团队。"),
        cta: c("Upgrade to Team", "升级到 Team"),
        features: [
          c("Shared organization billing", "组织共享账单"),
          c("API key governance", "API key 治理"),
          c("Provider/model policy", "Provider/model 策略"),
          c("Agent OS preview and handoff contracts", "Agent OS 预览和交接合同"),
          c("Priority commercial support", "优先商业支持"),
        ],
      };
    }
    return {
      ...item,
      price: c("Custom", "定制"),
      desc: c("For production customers that need custom policy, provider controls, and support.", "适合需要定制策略、provider 控制和支持的生产客户。"),
      cta: c("Contact sales", "联系销售"),
      features: [
        c("Custom request and cost limits", "定制请求和成本限制"),
        c("Custom provider/model policy", "定制 provider/model 策略"),
        c("Private model configuration", "私有模型配置"),
        c("Private Agent OS handoff protocol", "私有 Agent OS 交接协议"),
        c("Launch support and operational review", "上线支持和运营检查"),
      ],
    };
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setData(json.data || null);
    } catch (e: any) {
      setNotice({
        type: "error",
        text: e?.message || "Failed to load billing status.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setNotice({ type: "success", text: "Subscription updated successfully." });
    }
    if (params.get("canceled")) {
      setNotice({ type: "warn", text: "Checkout canceled." });
    }
    load();
  }, []);

  async function checkout(tier: "pro" | "team") {
    const priceId =
      tier === "pro"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM;

    if (!priceId) {
      setNotice({
        type: "error",
        text: `Missing Stripe price env for ${tier}. Set it and restart the web server.`,
      });
      return;
    }

    setBusy(tier);
    setNotice(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.url) {
        throw new Error(json?.error || json?.message || "Checkout URL not returned");
      }
      window.location.href = json.data.url;
    } catch (e: any) {
      setBusy(null);
      setNotice({ type: "error", text: e?.message || "Checkout failed." });
    }
  }

  async function openPortal() {
    if (!canPortal) {
      setNotice({
        type: "warn",
        text: "Billing portal is available after a paid subscription is active.",
      });
      return;
    }

    setBusy("portal");
    setNotice(null);

    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.data?.url) {
        throw new Error(json?.error || json?.message || "Portal URL not returned");
      }
      window.location.href = json.data.url;
    } catch (e: any) {
      setBusy(null);
      setNotice({ type: "error", text: e?.message || "Failed to open portal." });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Billing</Badge>
            <Badge>Commercial API</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-black">
            {c("Plans and Billing", "套餐和账单")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/55">
            {c(
              "Sell reliable OneAI API access with model routing, usage visibility, and cost controls. Stripe handles subscription and invoices.",
              "通过模型路由、用量可见性和成本控制售卖可靠的 OneAI API。Stripe 负责订阅和发票。"
            )}
          </p>
          {!ENABLE_STRIPE_CHECKOUT ? (
            <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-800">
              <span>{c("Manual sales mode", "人工销售模式")}</span>
              <span className="text-amber-900/50">{c("Contact:", "联系：")}</span>
              <a className="underline underline-offset-2" href={CONTACT_SALES_HREF}>
                {CONTACT_SALES_EMAIL}
              </a>
              <a className="underline underline-offset-2" href={CONTACT_TELEGRAM_HREF} target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a className="underline underline-offset-2" href={CONTACT_X_HREF} target="_blank" rel="noreferrer">
                X
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-black/10 bg-black/[0.03] px-2 py-1 text-xs font-medium text-black/65">
            {loading ? c("Loading plan", "套餐加载中") : `${c("Plan", "套餐")}: ${effectivePlan}`}
          </span>
          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClass(status)}`}>
            {status}
          </span>
          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${riskClass}`}>
            {c("Usage", "用量")}: {riskLabel}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={openPortal}
            disabled={busy === "portal" || !canPortal}
          >
            {busy === "portal" ? c("Opening...", "打开中...") : c("Manage Billing", "管理账单")}
          </Button>
        </div>
      </div>

      {notice ? <NoticeBar notice={notice} onClose={() => setNotice(null)} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c("Current plan", "当前套餐")}</div>
          <div className="mt-2 text-lg font-semibold capitalize">{effectivePlan}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c("Subscription status", "订阅状态")}</div>
          <div className="mt-2 text-lg font-semibold capitalize">{status}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">{c("Current period end", "当前周期结束")}</div>
          <div className="mt-2 text-lg font-semibold">{periodEnd}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-xs text-black/50">{c("Requests remaining", "剩余请求数")}</div>
          <div className="mt-2 text-xl font-semibold">{fmtNum(data?.remaining?.requests || 0)}</div>
          <div className="mt-2 text-xs text-black/45">{requestUsagePct.toFixed(1)}% used this month</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-xs text-black/50">{c("Model budget remaining", "剩余模型预算")}</div>
          <div className="mt-2 text-xl font-semibold">{fmtUsd(data?.remaining?.costUsd || 0)}</div>
          <div className="mt-2 text-xs text-black/45">{costUsagePct.toFixed(1)}% used this month</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-xs text-black/50">{c("Recommended action", "建议动作")}</div>
          <div className="mt-2 text-sm font-semibold text-black">
            {riskLevel >= 90
              ? c("Upgrade or increase limits before customer traffic fails.", "请在客户流量失败前升级或提高额度。")
              : riskLevel >= 70
                ? c("Monitor usage and prepare an upgrade path.", "请监控用量并准备升级路径。")
                : c("Current plan is within healthy operating range.", "当前套餐处于健康运行范围。")}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{c("Upgrade Path", "升级路径")}</CardTitle>
              <CardDescription>
                {c("A simple commercial path from free validation to paid production usage.", "从免费验证到付费生产用量的简单商业路径。")}
              </CardDescription>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
            >
              {c("Compare plans", "比较套餐")}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-4">
            {[
              ["Free", "Validate", "Test business_strategy and content_engine with strict cost controls."],
              ["Pro", "Ship", "Unlock customer support, market research, campaign, and decision intelligence."],
              ["Team", "Control", "Enable debug traces, model registry, custom tasks, and Agent OS preview."],
              ["Enterprise", "Customize", "Add private provider policy, executor policy, handoff protocol, and launch support."],
            ].map(([tier, verb, desc]) => (
              <div key={tier} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-black">{tier}</div>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-black/55">
                    {verb}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-black/60">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/playground" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              {c("Test free tasks", "测试免费 tasks")}
            </Link>
            <Link href="/agent-os" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              {c("Preview Agent OS", "预览 Agent OS")}
            </Link>
            <Link href={CONTACT_SALES_HREF} className="inline-flex h-9 items-center rounded-lg bg-black px-3 text-sm font-semibold text-white hover:bg-neutral-900">
              {c("Contact sales", "联系销售")}
            </Link>
            <a href={CONTACT_TELEGRAM_HREF} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-lg border border-black/10 px-3 text-sm font-semibold text-black hover:bg-black/[0.03]">
              Telegram
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c("Commercial Billing Loop", "商业账单闭环")}</CardTitle>
          <CardDescription>
            {c("Self-serve upgrade, Stripe checkout, webhook sync, plan policy, and audit trail in one loop.", "自助升级、Stripe checkout、webhook 同步、套餐策略和审计日志形成一个闭环。")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {[
              ["Self-serve UI", ENABLE_STRIPE_CHECKOUT, ENABLE_STRIPE_CHECKOUT ? "Checkout buttons visible" : "Manual sales mode"],
              ["Stripe checkout", stripeReady, stripeReady ? "Secret + price IDs ready" : "Missing Stripe checkout config"],
              ["Webhook sync", webhookReady, webhookReady ? "Subscription events can sync plans" : "Webhook secret missing"],
              ["Customer portal", data?.checkout?.portalAvailable, data?.checkout?.portalAvailable ? "Portal can open after subscription" : "Requires Stripe customer"],
              ["Audit trail", true, "Billing and key events are recorded"],
            ].map(([label, ok, desc]) => (
              <div key={String(label)} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-black">{label}</div>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      ok ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-900",
                    ].join(" ")}
                  >
                    {ok ? "Ready" : "Pending"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-black/55">{desc}</p>
              </div>
            ))}
          </div>

          {!selfServeReady ? (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-900">
              Self-serve checkout is not fully public yet. Customers can still contact sales, and plan activation can be managed manually while Stripe setup is completed.
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-800">
              Self-serve payment loop is ready for paid upgrades.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent OS Commercial Rights</CardTitle>
          <CardDescription>
            Agent OS is a higher-tier infrastructure layer: OneAI creates plans and handoff contracts; execution stays with OneClaw, bots, external agents, or humans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Free", "Task testing", "Validate business_strategy and content_engine before paid traffic."],
              ["Pro", "Production tasks", "Run paid Task Intelligence workflows with higher limits."],
              ["Team", "Agent OS preview", "Preview agent plans, context packets, and handoff contracts."],
              ["Enterprise", "Private protocol", "Define custom executor policies, private handoff rules, and launch controls."],
            ].map(([tier, title, desc]) => (
              <div key={tier} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="text-sm font-black text-black">{tier}</div>
                <div className="mt-2 text-sm font-semibold text-black/75">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly API Allowance</CardTitle>
          <CardDescription>
            Current month usage against the effective plan policy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Requests used</div>
              <div className="mt-2 text-xl font-semibold">
                {fmtNum(data?.monthUsage?.requestCount || 0)}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-black"
                  style={{
                    width: `${pct(
                      data?.monthUsage?.requestCount || 0,
                      data?.policy?.monthlyRequestLimit
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-black/45">
                Limit {fmtNum(data?.policy?.monthlyRequestLimit || 0)}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Model cost used</div>
              <div className="mt-2 text-xl font-semibold">
                {fmtUsd(data?.monthUsage?.costUsd || 0)}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-black"
                  style={{
                    width: `${pct(
                      data?.monthUsage?.costUsd || 0,
                      data?.policy?.monthlyCostLimitUsd
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-black/45">
                Limit {fmtUsd(data?.policy?.monthlyCostLimitUsd || 0)}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Tokens this month</div>
              <div className="mt-2 text-xl font-semibold">
                {fmtNum(data?.monthUsage?.totalTokens || 0)}
              </div>
              <div className="mt-2 text-xs text-black/45">
                Prompt {fmtNum(data?.monthUsage?.promptTokens || 0)} · Completion{" "}
                {fmtNum(data?.monthUsage?.completionTokens || 0)}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Allowed task tiers</div>
              <div className="mt-2 text-xl font-semibold capitalize">
                {(data?.policy?.allowedTiers || ["free"]).join(", ")}
              </div>
              <div className="mt-2 text-xs text-black/45">
                Active keys {fmtNum(data?.monthUsage?.activeKeys || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commercial Permissions</CardTitle>
          <CardDescription>
            Feature gates enforced by the effective plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Rate limit</div>
              <div className="mt-2 text-xl font-semibold">
                {fmtNum(data?.policy?.rateLimitRpm || 0)} RPM
              </div>
              <div className="mt-2 text-xs text-black/45">Inherited by API keys unless overridden</div>
            </div>
            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Max cost per request</div>
              <div className="mt-2 text-xl font-semibold">
                {fmtUsd(data?.policy?.maxCostPerRequestUsd || 0)}
              </div>
              <div className="mt-2 text-xs text-black/45">Compared with options.llm.maxCostUsd</div>
            </div>
            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Routing modes</div>
              <div className="mt-2 text-sm font-semibold capitalize leading-relaxed">
                {(data?.policy?.allowedModes || ["cheap", "balanced"]).join(", ")}
              </div>
            </div>
            <div className="rounded-lg border border-black/10 p-4">
              <div className="text-xs text-black/50">Advanced controls</div>
              <div className="mt-2 space-y-1 text-sm text-black/70">
                <div>Debug trace: {data?.policy?.allowDebug ? "Enabled" : "Locked"}</div>
                <div>Model select: {data?.policy?.allowExplicitModelSelection ? "Enabled" : "Locked"}</div>
                <div>Registry: {data?.policy?.allowModelRegistry ? "Enabled" : "Locked"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        {localizedPlans.map((item) => (
          <PlanCard
            key={item.key}
            plan={item}
            currentPlan={plan}
            busy={busy}
            onCheckout={checkout}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Permission Matrix</CardTitle>
          <CardDescription>
            What each plan unlocks in the API policy layer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] bg-black/[0.03] px-4 py-3 text-xs font-semibold text-black/60">
                <div>Capability</div>
                <div>Free</div>
                <div>Pro</div>
                <div>Team</div>
                <div>Enterprise</div>
              </div>
              {planMatrix.map((row) => (
                <div key={row[0]} className="grid grid-cols-[1.4fr_repeat(4,1fr)] border-t border-black/10 px-4 py-3 text-sm text-black/65">
                  <div className="font-medium text-black">{row[0]}</div>
                  <div>{row[1]}</div>
                  <div>{row[2]}</div>
                  <div>{row[3]}</div>
                  <div>{row[4]}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ENABLE_STRIPE_CHECKOUT ? "Stripe Launch Readiness" : "Manual Sales Mode"}</CardTitle>
          <CardDescription>
            {ENABLE_STRIPE_CHECKOUT
              ? "Checkout requires API secret key and both plan price IDs. Webhook is required before public launch."
              : "Automatic checkout is hidden for now. Customers contact sales, and you can activate plans manually while Stripe setup is pending."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ENABLE_STRIPE_CHECKOUT ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-black/10 p-4">
                <div className="text-xs text-black/50">Sales contacts</div>
                <div className="mt-2 space-y-1 text-sm font-semibold text-black">
                  <a className="block underline underline-offset-2" href={CONTACT_SALES_HREF}>
                    {CONTACT_SALES_EMAIL}
                  </a>
                  <a className="block underline underline-offset-2" href={CONTACT_TELEGRAM_HREF} target="_blank" rel="noreferrer">
                    t.me/waocfounder
                  </a>
                  <a className="block underline underline-offset-2" href={CONTACT_X_HREF} target="_blank" rel="noreferrer">
                    x.com/waoconnectone
                  </a>
                </div>
              </div>
              <div className="rounded-lg border border-black/10 p-4">
                <div className="text-xs text-black/50">Activation</div>
                <div className="mt-2 text-sm font-semibold text-black">Manual plan setup</div>
              </div>
              <div className="rounded-lg border border-black/10 p-4">
                <div className="text-xs text-black/50">Checkout</div>
                <div className="mt-2 text-sm font-semibold text-amber-800">Hidden until Stripe is ready</div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["Secret key", data?.stripeConfig?.secretKey],
                ["Webhook secret", data?.stripeConfig?.webhookSecret],
                ["Pro price", data?.stripeConfig?.pricePro],
                ["Team price", data?.stripeConfig?.priceTeam],
              ].map(([label, ok]) => (
                <div key={String(label)} className="rounded-lg border border-black/10 p-4">
                  <div className="text-xs text-black/50">{label}</div>
                  <div className={ok ? "mt-2 text-sm font-semibold text-emerald-700" : "mt-2 text-sm font-semibold text-red-700"}>
                    {ok ? "Configured" : "Missing"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Automation</CardTitle>
          <CardDescription>
            Self-serve subscription flow from checkout to portal, webhook sync, invoices, and audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {[
              ["Checkout", ENABLE_STRIPE_CHECKOUT && stripeReady, ENABLE_STRIPE_CHECKOUT ? "Customer can start Stripe checkout" : "Hidden in manual sales mode"],
              ["Webhook", webhookReady, webhookReady ? "Subscription updates can sync" : "Set STRIPE_WEBHOOK_SECRET"],
              ["Portal", data?.checkout?.portalAvailable, data?.checkout?.portalAvailable ? "Customer portal available" : "Available after Stripe customer exists"],
              ["Invoices", canPortal, canPortal ? "Invoices via Stripe portal" : "Manual invoice path available"],
              ["Audit", true, "Billing events are logged"],
            ].map(([label, ok, desc]) => (
              <div key={String(label)} className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                <div className="text-xs text-black/50">{String(label)}</div>
                <div className={ok ? "mt-2 text-sm font-bold text-emerald-700" : "mt-2 text-sm font-bold text-amber-800"}>
                  {ok ? "Ready" : "Pending"}
                </div>
                <div className="mt-2 text-xs leading-relaxed text-black/50">{String(desc)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise Documents</CardTitle>
          <CardDescription>
            Procurement links for customers that need SLA, DPA, invoices, terms, privacy, and team access controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {[
              ["Team access", "/team"],
              ["Contract", "/legal/enterprise-contract"],
              ["SLA", "/legal/sla"],
              ["DPA", "/legal/dpa"],
              ["Invoices", "/legal/invoices"],
              ["Terms", "/legal/terms"],
              ["Privacy", "/legal/privacy"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-sm font-bold text-black hover:bg-black/[0.05]"
              >
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Audit Trail</CardTitle>
          <CardDescription>
            Recent billing-sensitive events for this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.2fr_1fr_1.3fr_1fr] bg-black/[0.03] px-4 py-3 text-xs font-semibold text-black/60">
                <div>Action</div>
                <div>Target</div>
                <div>Metadata</div>
                <div>Time</div>
              </div>
              {data?.auditLogs?.length ? (
                data.auditLogs.map((event) => (
                  <div key={event.id} className="grid grid-cols-[1.2fr_1fr_1.3fr_1fr] border-t border-black/10 px-4 py-3 text-sm text-black/65">
                    <div className="font-mono text-xs font-semibold text-black">{event.action}</div>
                    <div className="truncate font-mono text-xs">{event.target || "-"}</div>
                    <div className="truncate text-xs">
                      {event.metadata
                        ? Object.entries(event.metadata)
                            .slice(0, 3)
                            .map(([key, value]) => `${key}: ${String(value)}`)
                            .join(" · ")
                        : "-"}
                    </div>
                    <div className="text-xs">{fmtTime(event.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="border-t border-black/10 px-4 py-8 text-center text-sm text-black/45">
                  No billing events yet. Start checkout, open portal, or receive a Stripe webhook to populate this trail.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>What customers pay for</CardTitle>
            <CardDescription>API value, not a generic chatbot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-black/65">
            <div>Full-model routing and fallback</div>
            <div>Structured task outputs</div>
            <div>Usage, requestId, and support metadata</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost control</CardTitle>
            <CardDescription>Protect margin before scale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-black/65">
            <div>Per-request maxCostUsd</div>
            <div>API key monthly budgets</div>
            <div>Provider/model allowlists by plan</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe readiness</CardTitle>
            <CardDescription>Keep billing operational.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-black/65">
            <div>Set price IDs in web env</div>
            <div>Configure webhook updates</div>
            <div>Use portal for invoices and payment methods</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
