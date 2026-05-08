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
    desc: "For local testing and validating structured tasks. 适合测试和早期接入。",
    features: ["1,000 requests / month · 每月 1,000 次请求", "$10 model cost guard · 模型成本保护", "30 RPM", "cheap + balanced modes"],
  },
  {
    name: "Pro",
    price: "$29/mo",
    desc: "For builders shipping apps on OneAI API. 适合正在上线产品的开发者和 SaaS 团队。",
    features: [
      "50,000 requests / month · 每月 50,000 次请求",
      "$500 model cost guard · 模型成本保护",
      "120 RPM",
      "cheap, balanced, fast, auto modes",
    ],
  },
  {
    name: "Team",
    price: "$99/mo",
    desc: "For teams needing shared billing and controls. 适合需要团队协作、调试和模型权限的商业团队。",
    features: [
      "250,000 requests / month · 每月 250,000 次请求",
      "$2,500 model cost guard · 模型成本保护",
      "600 RPM",
      "premium mode, debug trace, model registry",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For custom providers, limits, and support. 适合需要私有策略、定制模型和更高额度的生产团队。",
    features: [
      "Custom request volume · 定制请求量",
      "Custom model-cost guard · 定制模型成本保护",
      "Dedicated provider policy · 专属 provider 策略",
      "Custom models, health checks, support · 定制模型、健康检查和支持",
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-sm font-bold">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold">OneAI API</div>
            <div className="truncate text-xs text-black/50">Pricing 价格</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-black/65 md:flex">
          <Link href="/docs" className="hover:text-black">
            Docs 文档
          </Link>
          <Link href="/security" className="hover:text-black">
            Security 安全
          </Link>
          <Link href="/dashboard" className="hover:text-black">
            Console 控制台
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
            Commercial API pricing · 商用 API 价格
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Sell full-model intelligence with cost controls built in.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            OneAI pricing is built around commercial API access: model routing,
            structured outputs, customer usage, billing, and cost guardrails.
            价格体系围绕商用 API、结构化输出、用量统计和成本控制设计。
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "min-w-0 rounded-lg border p-5 sm:p-6",
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
                {plan.name === "Free" ? "Start free 免费开始" : "Contact sales 联系开通"}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-5">
          <div className="text-sm font-bold text-black">Manual onboarding · 人工开通</div>
          <p className="mt-2 text-sm leading-relaxed text-black/60">
            Stripe checkout is temporarily hidden. For Pro, Team, or Enterprise
            access, contact us and we will activate the plan manually.
            暂时采用人工开通，需要付费权限可通过邮箱、Telegram 或 X 联系。
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
              Permission matrix · 权限矩阵
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              The same limits are enforced by the API. 页面展示的限制会由 API 实际执行。
            </h2>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] bg-black/[0.03] px-4 py-3 text-xs font-semibold text-black/60">
                <div>Capability 能力</div>
                <div>Free</div>
                <div>Pro</div>
                <div>Team</div>
                <div>Enterprise</div>
              </div>
              {matrix.map((row) => (
                <div
                  key={row[0]}
                  className="grid grid-cols-[1.4fr_repeat(4,1fr)] border-t border-black/10 px-4 py-3 text-sm"
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
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Model gateway · 模型网关</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Chat Completions, streaming, model catalog, health checks, and provider readiness.
              支持模型网关、流式输出、模型目录和健康检查。
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">成本控制 · Cost controls</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Provider costs are tracked per request and controlled by routing policy,
              plan gates, monthly budgets, and maxCostUsd. 每次请求统计成本并控制风险。
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Task intelligence · 任务智能</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Generate business_strategy, content_engine, support_brain, and custom
              workflow intelligence. 支持结构化业务输出和客户 workflow 定制。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
