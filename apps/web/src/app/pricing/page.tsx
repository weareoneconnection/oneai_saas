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
      <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 2xl:px-10">
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
      name: c("Trial", "试用"),
      price: c("Free", "免费"),
      desc: c("Sign up and get $1 free credit instantly. No card required.", "注册即送 $1 免费额度，无需绑卡。"),
      features: [
        c("$1 free credit on signup", "注册即送 $1 额度"),
        c("~30 conversations included", "约 30 次对话体验"),
        c("1,000 requests / month", "每月最多 1,000 次请求"),
        "30 RPM",
        c("cheap + balanced modes", "cheap + balanced 模式"),
      ],
    },
    {
      name: c("Pay-as-you-go", "按量付费"),
      price: c("Top up anytime", "随时充值"),
      desc: c("Prepay credits, pay only for what you use. No monthly fee.", "预充值额度，按实际用量扣费，无月费。"),
      features: [
        c("Top up from ¥50 / $10", "最低充值 ¥50 / $10"),
        c("Credits never expire", "额度永不过期"),
        c("Claude Sonnet 4.6 — ¥19 / 1M input · ¥92 / 1M output", "Claude Sonnet 4.6 — ¥19/百万输入 · ¥92/百万输出"),
        c("Claude Opus 4.8 — ¥43 / 1M input · ¥215 / 1M output", "Claude Opus 4.8 — ¥43/百万输入 · ¥215/百万输出"),
        c("Claude Haiku 4.5 — ¥9 / 1M input · ¥43 / 1M output", "Claude Haiku 4.5 — ¥9/百万输入 · ¥43/百万输出"),
        c("GPT-5 · Gemini 2.5 Pro · DeepSeek · Grok 4 also supported", "同时支持 GPT-5 · Gemini 2.5 Pro · DeepSeek · Grok 4"),
        c("120 RPM", "120 RPM 限速"),
      ],
    },
    {
      name: c("Team", "团队版"),
      price: c("Top up + priority", "充值 + 优先支持"),
      desc: c("Higher limits, debug traces, model controls, and priority support.", "更高限额、调试追踪、模型控制和优先支持。"),
      features: [
        c("600 RPM", "600 RPM 限速"),
        c("Debug trace + model registry", "调试追踪 + 模型注册表"),
        c("Explicit model selection", "指定模型直连"),
        c("Agent OS preview", "Agent OS 预览"),
        c("Priority onboarding support", "优先开通支持"),
      ],
    },
    {
      name: "Enterprise",
      price: c("Custom", "定制"),
      desc: c("Custom limits, private provider policy, dedicated support.", "定制限额、私有 provider 策略和专属支持。"),
      features: [
        c("Custom RPM & volume", "定制限速和用量"),
        c("Dedicated provider policy", "专属 provider 策略"),
        c("Custom models & health checks", "定制模型和健康检查"),
        c("Private handoff protocol", "私有 Agent OS 交接协议"),
        c("SLA + dedicated support", "SLA 保障 + 专属支持"),
      ],
    },
  ];

  const matrix = [
    [c("Billing model", "计费模式"), c("Free credit", "免费额度"), c("Prepaid credit", "预充值额度"), c("Prepaid credit", "预充值额度"), c("Custom", "定制")],
    [c("Minimum top-up", "最低充值"), "—", "¥50 / $10", "¥50 / $10", c("Custom", "定制")],
    [c("Credit expiry", "额度有效期"), "30 days", c("Never", "永不过期"), c("Never", "永不过期"), c("Custom", "定制")],
    [c("Monthly request cap", "每月请求上限"), "1,000", c("Unlimited", "不限"), c("Unlimited", "不限"), c("Custom", "定制")],
    [c("API key rate limit", "API key 限速"), "30 RPM", "120 RPM", "600 RPM", c("Custom", "定制")],
    [c("Routing modes", "路由模式"), "cheap, balanced", c("All modes", "全部模式"), c("All modes", "全部模式"), c("All modes", "全部模式")],
    [c("Debug trace", "调试追踪"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
    [c("Explicit model selection", "指定模型直连"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
    [c("Model registry", "模型注册表"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
    [c("Agent OS preview", "Agent OS 预览"), c("locked", "锁定"), c("locked", "锁定"), c("enabled", "开启"), c("enabled", "开启")],
  ];

  return (
    <main className="bg-white text-black">
      <Header />

      <section className="mx-auto w-full max-w-[1760px] px-4 py-14 sm:px-6 lg:px-8 2xl:px-10 md:py-20">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            {c("Commercial API pricing", "商用 API 价格")}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {c("Pay only for what you use. No monthly fees.", "按实际用量付费，无月费。")}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            {c(
              "OneAI uses a prepaid credit model. Top up your balance, call the API, and credits are deducted per request. No surprises, no waste.",
              "OneAI 采用预充值额度制。充值后调用 API，按每次请求实际消耗扣费，用多少算多少，余额永不过期。"
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
                href={plan.name === c("Trial", "试用") ? "/keys" : CONTACT_SALES_HREF}
                className={[
                  "mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition",
                  plan.name === "Pro"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-neutral-900",
                ].join(" ")}
              >
                {plan.name === c("Trial", "试用") ? c("Start free", "免费开始") : c("Contact sales", "联系开通")}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-5">
          <div className="text-sm font-bold text-black">{c("Manual onboarding", "人工开通")}</div>
          <p className="mt-2 text-sm leading-relaxed text-black/60">
            {c(
              "Transfer via WeChat / Alipay, then contact us with your email. We will top up your credit balance within minutes.",
              "微信或支付宝转账后，发送邮箱给我们，我们会在几分钟内为您充值额度，立即可用。"
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
            <div className="text-sm font-bold">{c("Model pricing", "模型定价")}</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {c(
                "Claude Sonnet: ¥0.022 / 1K input tokens · ¥0.108 / 1K output tokens. Credits deducted per actual usage.",
                "Claude Sonnet：¥0.022 / 千输入 tokens · ¥0.108 / 千输出 tokens，按实际用量从余额扣除。"
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
