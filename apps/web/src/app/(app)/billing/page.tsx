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
};

type Notice = { type: "success" | "warn" | "error"; text: string };

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
];

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
  plan: (typeof plans)[number];
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
        {canBuy ? (
          <Button
            variant={isCurrent ? "secondary" : "primary"}
            onClick={() => onCheckout(plan.key)}
            disabled={busy !== null || !priceId}
            className="w-full"
          >
            {busy === plan.key ? "Redirecting..." : plan.cta}
          </Button>
        ) : (
          isEnterprise ? (
            <Link href="/docs" className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-black/15 bg-white text-sm font-semibold text-black hover:bg-black/[0.04]">
              {plan.cta}
            </Link>
          ) : (
            <Button variant="secondary" disabled className="w-full">
              {plan.cta}
            </Button>
          )
        )}
        {canBuy && !priceId ? (
          <div className={isCurrent ? "mt-2 text-xs text-white/50" : "mt-2 text-xs text-black/45"}>
            Missing {plan.env}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function BillingPage() {
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
            Plans and Billing
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/55">
            Sell reliable OneAI API access with model routing, usage visibility,
            and cost controls. Stripe handles subscription and invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-black/10 bg-black/[0.03] px-2 py-1 text-xs font-medium text-black/65">
            {loading ? "Loading plan" : `Plan: ${effectivePlan}`}
          </span>
          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClass(status)}`}>
            {status}
          </span>
          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${riskClass}`}>
            Usage: {riskLabel}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={openPortal}
            disabled={busy === "portal" || !canPortal}
          >
            {busy === "portal" ? "Opening..." : "Manage Billing"}
          </Button>
        </div>
      </div>

      {notice ? <NoticeBar notice={notice} onClose={() => setNotice(null)} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Current plan</div>
          <div className="mt-2 text-lg font-semibold capitalize">{effectivePlan}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Subscription status</div>
          <div className="mt-2 text-lg font-semibold capitalize">{status}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <div className="text-xs text-black/50">Current period end</div>
          <div className="mt-2 text-lg font-semibold">{periodEnd}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-xs text-black/50">Requests remaining</div>
          <div className="mt-2 text-xl font-semibold">{fmtNum(data?.remaining?.requests || 0)}</div>
          <div className="mt-2 text-xs text-black/45">{requestUsagePct.toFixed(1)}% used this month</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-xs text-black/50">Model budget remaining</div>
          <div className="mt-2 text-xl font-semibold">{fmtUsd(data?.remaining?.costUsd || 0)}</div>
          <div className="mt-2 text-xs text-black/45">{costUsagePct.toFixed(1)}% used this month</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-xs text-black/50">Recommended action</div>
          <div className="mt-2 text-sm font-semibold text-black">
            {riskLevel >= 90 ? "Upgrade or increase limits before customer traffic fails." : riskLevel >= 70 ? "Monitor usage and prepare an upgrade path." : "Current plan is within healthy operating range."}
          </div>
        </div>
      </div>

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
        {plans.map((item) => (
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
          <div className="overflow-hidden rounded-lg border border-black/10">
            <div className="grid grid-cols-5 bg-black/[0.03] px-4 py-3 text-xs font-semibold text-black/60">
              <div>Capability</div>
              <div>Free</div>
              <div>Pro</div>
              <div>Team</div>
              <div>Enterprise</div>
            </div>
            {planMatrix.map((row) => (
              <div key={row[0]} className="grid grid-cols-5 border-t border-black/10 px-4 py-3 text-sm text-black/65">
                <div className="font-medium text-black">{row[0]}</div>
                <div>{row[1]}</div>
                <div>{row[2]}</div>
                <div>{row[3]}</div>
                <div>{row[4]}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Launch Readiness</CardTitle>
          <CardDescription>
            Checkout requires API secret key and both plan price IDs. Webhook is required before public launch.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
