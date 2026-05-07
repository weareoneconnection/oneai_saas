// apps/web/src/app/pricing/page.tsx
import Link from "next/link";

const CONTACT_SALES_EMAIL = "info@weareoneconnection.com";
const CONTACT_SALES_HREF =
  `mailto:${CONTACT_SALES_EMAIL}?subject=OneAI%20SaaS%20plan`;
const CONTACT_TELEGRAM_HREF = "https://t.me/waocfounder";
const CONTACT_X_HREF = "https://x.com/waoconnectone?s=21";

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "For local testing, early integration, and validating structured tasks.",
    features: ["1,000 requests / month", "$10 model cost guard", "30 RPM", "Cheap + balanced modes"],
  },
  {
    name: "Pro",
    price: "$29/mo",
    desc: "For builders selling or shipping apps on top of OneAI API.",
    features: [
      "50,000 requests / month",
      "$500 model cost guard",
      "120 RPM",
      "Cheap, balanced, fast, auto modes",
    ],
  },
  {
    name: "Team",
    price: "$99/mo",
    desc: "For teams that need shared billing, policy, and commercial controls.",
    features: [
      "250,000 requests / month",
      "$2,500 model cost guard",
      "600 RPM",
      "Premium mode, debug trace, model registry",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For production teams that need custom providers, higher limits, private policy, and support.",
    features: [
      "Custom request volume",
      "Custom model-cost guard",
      "Dedicated provider policy",
      "Custom models, health checks, support",
    ],
  },
];

const matrix = [
  ["Monthly requests", "1,000", "50,000", "250,000", "Custom"],
  ["Monthly model-cost guard", "$10", "$500", "$2,500", "Custom"],
  ["API key rate limit", "30 RPM", "120 RPM", "600 RPM", "Custom"],
  ["Per-request maxCostUsd", "$0.05", "$1", "$5", "Custom"],
  ["Routing modes", "cheap, balanced", "cheap, balanced, fast, auto", "all modes", "all modes"],
  ["Task tiers", "free", "free + pro", "free + pro + team", "all tiers"],
  ["Debug trace", "locked", "locked", "enabled", "enabled"],
  ["Explicit provider/model", "locked", "locked", "enabled", "enabled"],
  ["Model registry and health", "locked", "locked", "enabled", "enabled"],
  ["Custom provider policy", "locked", "locked", "limited", "enabled"],
];

function Header() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-sm font-bold">
            OA
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">OneAI API</div>
            <div className="text-xs text-black/50">Pricing</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-black/65 md:flex">
          <Link href="/docs" className="hover:text-black">
            Docs
          </Link>
          <Link href="/security" className="hover:text-black">
            Security
          </Link>
          <Link href="/dashboard" className="hover:text-black">
            Console
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function PricingPage() {
  return (
    <main className="bg-white text-black">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            Commercial API pricing
          </div>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Sell full-model intelligence with cost controls built in.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            OneAI pricing is built around commercial API access: model routing,
            structured outputs, customer usage, billing, and guardrails that
            protect margin while supporting more providers.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "rounded-lg border p-6",
                plan.name === "Pro" ? "border-black bg-black text-white" : "border-black/10 bg-white",
              ].join(" ")}
            >
              <div className={plan.name === "Pro" ? "text-sm font-bold text-white" : "text-sm font-bold text-black"}>
                {plan.name}
              </div>
              <div className={plan.name === "Pro" ? "mt-3 text-4xl font-bold text-white" : "mt-3 text-4xl font-bold text-black"}>
                {plan.price}
              </div>
              <p className={plan.name === "Pro" ? "mt-3 text-sm leading-relaxed text-white/70" : "mt-3 text-sm leading-relaxed text-black/60"}>
                {plan.desc}
              </p>
              <div className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className={plan.name === "Pro" ? "text-sm text-white/80" : "text-sm text-black/70"}
                  >
                    {feature}
                  </div>
                ))}
              </div>
              <Link
                href={plan.name === "Free" ? "/keys" : CONTACT_SALES_HREF}
                className={[
                  "mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition",
                  plan.name === "Pro"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-neutral-900",
                ].join(" ")}
              >
                {plan.name === "Free" ? "Start free" : "Contact sales"}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-5">
          <div className="text-sm font-bold text-black">Manual onboarding</div>
          <p className="mt-2 text-sm leading-relaxed text-black/60">
            Stripe checkout is temporarily hidden. For Pro, Team, or Enterprise
            access, contact sales and we will activate the plan manually.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            <a href={CONTACT_SALES_HREF} className="text-black underline underline-offset-4">
              {CONTACT_SALES_EMAIL}
            </a>
            <a href={CONTACT_TELEGRAM_HREF} target="_blank" rel="noreferrer" className="text-black underline underline-offset-4">
              Telegram
            </a>
            <a href={CONTACT_X_HREF} target="_blank" rel="noreferrer" className="text-black underline underline-offset-4">
              X
            </a>
          </div>
        </div>

        <div className="mt-12">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wide text-black/45">
              Permission matrix
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              The same limits are enforced by the API.
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-black/10">
            <div className="grid grid-cols-5 bg-black/[0.03] px-4 py-3 text-xs font-semibold text-black/60">
              <div>Capability</div>
              <div>Free</div>
              <div>Pro</div>
              <div>Team</div>
              <div>Enterprise</div>
            </div>
            {matrix.map((row) => (
              <div
                key={row[0]}
                className="grid grid-cols-5 border-t border-black/10 px-4 py-3 text-sm"
              >
                <div className="font-medium text-black">{row[0]}</div>
                <div className="text-black/65">{row[1]}</div>
                <div className="text-black/65">{row[2]}</div>
                <div className="text-black/65">{row[3]}</div>
                <div className="text-black/65">{row[4]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Model gateway</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Chat completions, streaming, model catalog, model health, and
              provider readiness are included in the commercial platform.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Cost controls</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Provider costs are tracked per request and can be limited with
              routing policy, plan gates, monthly budgets, and maxCostUsd.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Task intelligence</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Generate structured outputs for planning, missions, WAOC chat,
              OneClaw execution planning, and market decisions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
