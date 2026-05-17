"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "info@weareoneconnection.com";

const useCases = [
  {
    title: "Launch AI SaaS Feature",
    subtitle: "Ship AI features with a business plan, not just a model call.",
    pain: "Teams know they need AI, but lack a clear launch plan, milestones, risks, and measurable next steps.",
    tasks: ["business_strategy"],
    plan: "Free to start",
    input: {
      goal: "Launch a paid AI feature in 30 days",
      audience: "SaaS founders and product teams",
      constraints: ["Keep it practical", "Prioritize fast validation"],
    },
    output: ["Strategy", "Milestones", "Risks", "Next actions", "Success metrics"],
  },
  {
    title: "Marketing Content Engine",
    subtitle: "Turn product ideas into launch copy and reusable content variants.",
    pain: "Product teams waste time rewriting the same launch narrative across posts, hooks, CTAs, and campaigns.",
    tasks: ["content_engine"],
    plan: "Free to start",
    input: {
      topic: "Announce OneAI Task Intelligence API",
      audience: "developers and SaaS builders",
      tone: "clear and practical",
      brand: "OneAI",
    },
    output: ["Angle", "Hooks", "Posts", "CTA", "Hashtags", "Variants"],
  },
  {
    title: "AI Customer Support Brain",
    subtitle: "Generate customer replies with intent, confidence, and next action.",
    pain: "Support teams need fast replies, but raw chat output is hard to govern, audit, or connect to customer memory.",
    tasks: ["support_brain"],
    plan: "Pro",
    input: {
      message: "What is OneAI and how can my product use it?",
      context: "customer support",
      customer: "new SaaS builder",
    },
    output: ["Reply", "Intent", "Confidence", "Suggested action", "Memory update"],
  },
  {
    title: "Market & Decision Intelligence",
    subtitle: "Create market briefs and recommendations before committing resources.",
    pain: "Teams need to compare markets, competitors, and launch paths without turning every decision into a long research cycle.",
    tasks: ["market_research", "decision_intelligence"],
    plan: "Pro",
    input: {
      product: "Unified model gateway plus Task Intelligence API",
      audience: "SaaS builders",
      objective: "Find a practical launch wedge",
    },
    output: ["Market brief", "Competitor angle", "Recommendation", "Tradeoffs", "Risks"],
  },
  {
    title: "Custom Task Intelligence",
    subtitle: "Package a customer's workflow into a dedicated intelligence API.",
    pain: "Enterprise customers do not want generic prompts. They need workflow-specific inputs, outputs, policy, and rollout plans.",
    tasks: ["custom_task_designer"],
    plan: "Team / Enterprise",
    input: {
      business: "AI customer support SaaS",
      workflow: "Classify tickets and draft replies with escalation rules",
      users: "support agents and customer success managers",
    },
    output: ["Input contract", "Output schema", "Policy", "Rollout plan", "Evaluation criteria"],
  },
];

const outcomes = [
  ["Faster validation", "Turn ideas into structured plans and content without building a custom prompt stack first."],
  ["Lower cost risk", "Use routing modes and maxCostUsd so every task can be measured and controlled."],
  ["Cleaner product integration", "Return structured outputs your app can display, store, review, or send to another tool."],
  ["Higher-value sales", "Move from selling raw model access to selling customer-specific intelligence workflows."],
];

function Header() {
  const { isZh } = useI18n();
  return (
    <header className="border-b border-white/10 bg-[#030712]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-sm font-black text-white">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-black text-white">OneAI</div>
            <div className="truncate text-xs text-white/45">{isZh ? "使用场景" : "Use cases"}</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-white/55 md:flex">
          <Link href="/task-intelligence" className="hover:text-white">Task Intelligence</Link>
          <Link href="/docs/product-guide" className="hover:text-white">{isZh ? "文档" : "Docs"}</Link>
          <Link href="/pricing" className="hover:text-white">{isZh ? "价格" : "Pricing"}</Link>
          <LanguageToggle compact />
          <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-black hover:bg-emerald-100">{isZh ? "开始" : "Start"}</Link>
        </nav>
      </div>
    </header>
  );
}

export default function UseCasesPage() {
  const { isZh } = useI18n();
  const localizedOutcomes = isZh
    ? [
        ["更快验证", "先把想法变成结构化计划和内容，而不必先搭一整套 prompt stack。"],
        ["更低成本风险", "使用 routing modes 和 maxCostUsd，让每个 task 都可计量、可控制。"],
        ["更干净的产品集成", "返回你的应用可展示、存储、审核或发送给其他工具的结构化输出。"],
        ["更高价值销售", "从卖原始模型访问，升级为卖客户专属智能工作流。"],
      ]
    : outcomes;
  const localizedUseCases = isZh
    ? [
        {
          title: "发布 AI SaaS 功能",
          subtitle: "用商业计划发布 AI 功能，而不是只做一次模型调用。",
          pain: "团队知道需要 AI，但缺少清晰发布计划、里程碑、风险和可衡量下一步。",
          tasks: ["business_strategy"],
          plan: "Free to start",
          input: { goal: "30 天内发布付费 AI 功能", audience: "SaaS 创始人和产品团队", constraints: ["保持实用", "优先快速验证"] },
          output: ["策略", "里程碑", "风险", "下一步行动", "成功指标"],
        },
        {
          title: "营销内容引擎",
          subtitle: "把产品想法变成发布文案和可复用内容变体。",
          pain: "产品团队反复重写 posts、hooks、CTA 和活动叙事，浪费大量时间。",
          tasks: ["content_engine"],
          plan: "Free to start",
          input: { topic: "发布 OneAI Task Intelligence API", audience: "开发者和 SaaS builders", tone: "清晰实用", brand: "OneAI" },
          output: ["角度", "Hooks", "Posts", "CTA", "Hashtags", "变体"],
        },
        {
          title: "AI 客服大脑",
          subtitle: "生成带意图、信心和下一步动作的客户回复。",
          pain: "客服团队需要快速回复，但原始 chat 输出难治理、难审计，也难接入客户记忆。",
          tasks: ["support_brain"],
          plan: "Pro",
          input: { message: "OneAI 是什么，我的产品如何使用？", context: "customer support", customer: "new SaaS builder" },
          output: ["回复", "意图", "信心", "建议动作", "记忆更新"],
        },
        {
          title: "市场与决策智能",
          subtitle: "在投入资源前生成市场简报和决策建议。",
          pain: "团队需要比较市场、竞品和发布路径，但不想每次决策都变成漫长研究周期。",
          tasks: ["market_research", "decision_intelligence"],
          plan: "Pro",
          input: { product: "统一模型网关 + Task Intelligence API", audience: "SaaS builders", objective: "找到实用发布切入点" },
          output: ["市场简报", "竞品角度", "建议", "取舍", "风险"],
        },
        {
          title: "定制 Task Intelligence",
          subtitle: "把客户工作流封装成专属智能 API。",
          pain: "企业客户不要通用 prompt，他们需要针对工作流的输入、输出、策略和上线计划。",
          tasks: ["custom_task_designer"],
          plan: "Team / Enterprise",
          input: { business: "AI 客服 SaaS", workflow: "工单分类并按升级规则起草回复", users: "support agents 和客户成功经理" },
          output: ["输入合约", "输出 schema", "策略", "上线计划", "评估标准"],
        },
      ]
    : useCases;

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <Header />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-4xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300/70">
              {isZh ? "使用场景" : "Use cases"}
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
              {isZh ? "客户能理解、测试和购买的 AI 工作流。" : "AI workflows customers can understand, test, and buy."}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
              {isZh
                ? "OneAI 给 builders 的不只是模型访问。它把常见商业需求封装成结构化 Task Intelligence API，带清晰输入、输出、成本控制和商业套餐。"
                : "OneAI gives builders more than model access. It packages common business needs into structured Task Intelligence APIs with clear inputs, outputs, cost controls, and commercial tiers."}
            </p>
            <p className="mt-4 max-w-3xl text-sm font-bold leading-relaxed text-emerald-100/80 md:text-base">
              {isZh
                ? "从“调用模型”升级为“售卖可复用业务智能”：策略、内容、客服、市场决策和客户定制 workflow。"
                : "Move from calling models to selling reusable business intelligence: strategy, content, support, market decisions, and custom customer workflows."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/playground" className="inline-flex justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black hover:bg-emerald-100">
                {isZh ? "在 Playground 测试" : "Try in Playground"}
              </Link>
              <Link href="/task-intelligence" className="inline-flex justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white hover:bg-white/[0.1]">
                {isZh ? "了解 Task Intelligence" : "Learn Task Intelligence"}
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Use%20Case%20Pilot`} className="inline-flex justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-300/15">
                {isZh ? "联系销售" : "Contact Sales"}
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {localizedOutcomes.map(([title, desc]) => (
              <div key={title} className="rounded-[1.3rem] border border-white/10 bg-white/[0.055] p-5">
                <div className="text-sm font-black text-white">{title}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="space-y-6">
          {localizedUseCases.map((item, index) => (
            <div key={item.title} className="rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-6">
              <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/55">
                      {item.plan}
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl font-black tracking-tight md:text-4xl">{item.title}</h2>
                  <p className="mt-3 text-base font-bold text-emerald-100/80">{item.subtitle}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/52">{item.pain}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {item.tasks.map((task) => (
                      <code key={task} className="rounded-lg bg-black/24 px-3 py-2 text-xs font-bold text-emerald-100/75">
                        {task}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{isZh ? "示例输入" : "Example input"}</div>
                    <pre className="mt-4 max-h-[260px] overflow-auto text-xs leading-relaxed text-white/65">
                      <code>{JSON.stringify(item.input, null, 2)}</code>
                    </pre>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{isZh ? "输出价值" : "Output value"}</div>
                    <div className="mt-4 grid gap-2">
                      {item.output.map((value) => (
                        <div key={value} className="rounded-xl bg-white/[0.055] px-3 py-2 text-sm font-bold text-white/72">
                          {value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm leading-relaxed text-white/45">
                  {isZh ? "最佳下一步：在 Playground 加载类似 preset，然后把输入合约改成你的产品需要的结构。" : "Best next step: load a similar preset in Playground, then adapt the input contract to your product."}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link href="/playground" className="inline-flex justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-black hover:bg-emerald-100">
                    {isZh ? "测试 preset" : "Try preset"}
                  </Link>
                  <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`OneAI ${item.title}`)}`} className="inline-flex justify-center rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-black text-white hover:bg-white/[0.1]">
                    {isZh ? "沟通" : "Discuss"}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">{isZh ? "有未列出的工作流？" : "Have a workflow that is not listed?"}</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/62">
                {isZh
                  ? "Custom Task Intelligence 可以把你的工作流变成专属 API：输入 schema、输出 schema、路由策略、成本保护、验证和上线路径。"
                  : "Custom Task Intelligence turns your workflow into a dedicated API: input schema, output schema, routing policy, cost guard, validation, and rollout path."}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Custom%20Task%20Pilot`} className="inline-flex justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-black hover:bg-emerald-100">
                {isZh ? "开始定制 task" : "Start custom task"}
              </a>
              <Link href="/docs/guides/production-checklist" className="inline-flex justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-black text-white hover:bg-white/[0.1]">
                {isZh ? "生产上线清单" : "Production checklist"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
