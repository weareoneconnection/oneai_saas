"use client";

// apps/web/src/app/pricing/page.tsx
import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

const CONTACT_SALES_EMAIL = "info@weareoneconnection.com";
const CONTACT_SALES_HREF =
  `mailto:${CONTACT_SALES_EMAIL}?subject=OneAI%20SaaS%20plan`;
const CONTACT_TELEGRAM_HREF = "https://t.me/waocfounder";
const CONTACT_X_HREF = "https://x.com/waoconnectone?s=21";

function Header() {
  const { isZh } = useI18n();

  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-sm font-bold">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold">OneAI API</div>
            <div className="truncate text-xs text-black/50">{isZh ? "价格" : "Pricing"}</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-black/65 md:flex">
          <Link href="/use-cases" className="hover:text-black">
            {isZh ? "使用场景" : "Use Cases"}
          </Link>
          <Link href="/docs" className="hover:text-black">
            {isZh ? "文档" : "Docs"}
          </Link>
          <Link href="/security" className="hover:text-black">
            {isZh ? "安全" : "Security"}
          </Link>
          <Link href="/dashboard" className="hover:text-black">
            {isZh ? "控制台" : "Console"}
          </Link>
        </nav>
        <LanguageToggle compact />
      </div>
    </header>
  );
}

export default function PricingPage() {
  const { isZh } = useI18n();
  const c = (en: string, zh: string) => (isZh ? zh : en);

  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: c("For local testing and validating structured tasks.", "适合测试和早期接入。"),
      features: [
        c("1,000 requests / month", "每月 1,000 次请求"),
        c("$10 model cost guard", "$10 模型成本保护"),
        "30 RPM",
        c("cheap + balanced modes", "cheap + balanced 模式"),
      ],
    },
    {
      name: "Pro",
      price: "$29/mo",
      desc: c("For builders shipping apps on OneAI API.", "适合正在上线产品的开发者和 SaaS 团队。"),
      features: [
        c("50,000 requests / month", "每月 50,000 次请求"),
        c("$500 model cost guard", "$500 模型成本保护"),
        "120 RPM",
        c("cheap, balanced, fast, auto modes", "cheap、balanced、fast、auto 模式"),
      ],
    },
    {
      name: "Team",
      price: "$99/mo",
      desc: c(
        "For teams needing shared billing, debug traces, and model controls.",
        "适合需要团队协作、调试和模型权限的商业团队。"
      ),
      features: [
        c("250,000 requests / month", "每月 250,000 次请求"),
        c("$2,500 model cost guard", "$2,500 模型成本保护"),
        "600 RPM",
        c("premium mode, debug trace, model registry", "premium 模式、debug trace、模型注册表"),
        c("Agent OS preview + handoff contracts", "Agent OS 预览和交接合同"),
      ],
    },
    {
      name: "Enterprise",
      price: c("Custom", "定制"),
      desc: c(
        "For custom providers, limits, contracts, and support.",
        "适合需要私有策略、定制模型和更高额度的生产团队。"
      ),
      features: [
        c("Custom request volume", "定制请求量"),
        c("Custom model-cost guard", "定制模型成本保护"),
        c("Dedicated provider policy", "专属 provider 策略"),
        c("Custom models, health checks, support", "定制模型、健康检查和支持"),
        c("Private handoff protocol", "私有 Agent OS 交接协议"),
      ],
    },
  ];

  const matrix = [
    [c("Monthly requests", "每月请求量"), "1,000", "50,000", "250,000", c("Custom", "定制")],
    [c("Monthly model-cost guard", "每月模型成本保护"), "$10", "$500", "$2,500", c("Custom", "定制")],
    [c("API key rate limit", "API key 限流"), "30 RPM", "120 RPM", "600 RPM", c("Custom", "定制")],
    ["maxCostUsd", "$0.05", "$1", "$5", c("Custom", "定制")],
    [c("Routing modes", "路由模式"), "cheap, balanced", "cheap, balanced, fast, auto", c("all modes", "全部模式"), c("all modes", "全部模式")],
    [c("Task tiers", "Task 等级"), "free", "free + pro", "free + pro + team", c("all tiers", "全部等级")],
    [c("Debug trace", "调试追踪"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
    [c("Explicit provider/model", "指定 provider/model"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
    [c("Model registry and health", "模型注册表和健康检查"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
    [c("Agent OS preview", "Agent OS 预览"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
  ];

  return (
    <main className="bg-white text-black">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            {c("Commercial API pricing", "商用 API 价格")}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {c("Sell full-model intelligence with cost controls built in.", "用内置成本控制售卖全模型智能能力。")}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            {c(
              "OneAI pricing is built around commercial API access: model routing, structured outputs, customer usage, billing, and cost guardrails.",
              "OneAI 的价格体系围绕商用 API、模型路由、结构化输出、客户用量、账单和成本控制设计。"
            )}
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
                {plan.name === "Free" ? c("Start free", "免费开始") : c("Contact sales", "联系开通")}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-5">
          <div className="text-sm font-bold text-black">{c("Manual onboarding", "人工开通")}</div>
          <p className="mt-2 text-sm leading-relaxed text-black/60">
            {c(
              "Stripe checkout is temporarily hidden. For Pro, Team, or Enterprise access, contact us and we will activate the plan manually.",
              "Stripe checkout 暂时隐藏。需要 Pro、Team 或企业版权限时，请通过邮箱、Telegram 或 X 联系，我们会人工开通。"
            )}
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

        <div className="mt-10 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            {c("Upgrade path", "升级路径")}
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {c("Start free, ship with Pro, customize with Team.", "免费开始，Pro 上线，Team 定制。")}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-black/60">
            {c(
              "OneAI lets customers test real Task Intelligence before paying, then upgrade when production traffic, paid workflows, or custom controls are needed.",
              "OneAI 允许客户先免费验证真实 Task Intelligence，再在需要生产流量、付费 workflow 或定制控制时升级。"
            )}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ["Free", "Test", "business_strategy and content_engine for API validation."],
              ["Pro", "Launch", "support_brain, market_research, campaign_mission, decision_intelligence."],
              ["Team", "Operate", "custom tasks, debug traces, model controls, Agent OS preview."],
              ["Enterprise", "Scale", "dedicated policy, private provider setup, private handoff protocol."],
            ].map(([tier, label, desc]) => (
              <div key={tier} className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-black">{tier}</div>
                  <span className="rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">
                    {label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-black/60">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/playground" className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-bold text-white hover:bg-neutral-900">
              {c("Test free tasks", "免费测试")}
            </Link>
            <Link href="/use-cases" className="inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-bold text-black hover:bg-black/[0.03]">
              {c("View use cases", "查看使用场景")}
            </Link>
            <a href={CONTACT_SALES_HREF} className="inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-bold text-black hover:bg-black/[0.03]">
              {c("Contact sales", "联系开通")}
            </a>
          </div>
        </div>

        <div className="mt-12">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wide text-black/45">
              {c("Permission matrix", "权限矩阵")}
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {c("The same limits are enforced by the API.", "页面展示的限制会由 API 实际执行。")}
            </h2>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] bg-black/[0.03] px-4 py-3 text-xs font-semibold text-black/60">
                <div>{c("Capability", "能力")}</div>
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

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">{c("Model gateway", "模型网关")}</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {c(
                "Chat Completions, streaming, model catalog, health checks, and provider readiness.",
                "支持模型网关、流式输出、模型目录和健康检查。"
              )}
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">{c("Cost controls", "成本控制")}</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {c(
                "Provider costs are tracked per request and controlled by routing policy, plan gates, monthly budgets, and maxCostUsd.",
                "每次请求都会统计 provider 成本，并通过路由策略、套餐限制、月度预算和 maxCostUsd 控制风险。"
              )}
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">{c("Task intelligence", "任务智能")}</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {c(
                "Generate business_strategy, content_engine, support_brain, and custom workflow intelligence.",
                "生成 business_strategy、content_engine、support_brain 和客户定制 workflow 智能。"
              )}
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">{c("Agent OS handoff", "Agent OS 交接")}</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {c(
                "Team and Enterprise plans can preview agent plans, context packets, and handoff contracts. OneAI plans; external executors act.",
                "Team 和企业版支持 agent plans、context packets 和 handoff contracts。OneAI 负责规划，外部执行器负责执行。"
              )}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
          <div className="text-sm font-bold text-white">{c("Which plan fits which use case?", "不同场景适合哪个套餐？")}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Free", c("Validate business_strategy and content_engine before paid traffic.", "在付费流量前验证 business_strategy 和 content_engine。")],
              ["Pro", c("Ship customer-facing support, market, decision, and campaign intelligence.", "上线面向客户的支持、市场、决策和 campaign intelligence。")],
              ["Team", c("Build custom task contracts and controlled internal workflows.", "构建自定义 task contract 和受控内部 workflow。")],
            ].map(([name, desc]) => (
              <div key={name} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <div className="text-sm font-black text-white">{name}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
              </div>
            ))}
          </div>
          <Link href="/use-cases" className="mt-5 inline-flex rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90">
            {c("View use cases", "查看使用场景")}
          </Link>
        </div>
      </section>
    </main>
  );
}
