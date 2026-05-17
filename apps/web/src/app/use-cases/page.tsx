import Link from "next/link";

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
  return (
    <header className="border-b border-white/10 bg-[#030712]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-sm font-black text-white">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-black text-white">OneAI</div>
            <div className="truncate text-xs text-white/45">Use cases</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-white/55 md:flex">
          <Link href="/task-intelligence" className="hover:text-white">Task Intelligence</Link>
          <Link href="/docs/product-guide" className="hover:text-white">Docs</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-black hover:bg-emerald-100">Start</Link>
        </nav>
      </div>
    </header>
  );
}

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <Header />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-4xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300/70">
              Use cases
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
              AI workflows customers can understand, test, and buy.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
              OneAI gives builders more than model access. It packages common
              business needs into structured Task Intelligence APIs with clear
              inputs, outputs, cost controls, and commercial tiers.
            </p>
            <p className="mt-4 max-w-3xl text-sm font-bold leading-relaxed text-emerald-100/80 md:text-base">
              从“调用模型”升级为“售卖可复用业务智能”：策略、内容、客服、市场决策和客户定制 workflow。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/playground" className="inline-flex justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black hover:bg-emerald-100">
                Try in Playground
              </Link>
              <Link href="/task-intelligence" className="inline-flex justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white hover:bg-white/[0.1]">
                Learn Task Intelligence
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Use%20Case%20Pilot`} className="inline-flex justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-300/15">
                Contact Sales
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {outcomes.map(([title, desc]) => (
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
          {useCases.map((item, index) => (
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
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Example input</div>
                    <pre className="mt-4 max-h-[260px] overflow-auto text-xs leading-relaxed text-white/65">
                      <code>{JSON.stringify(item.input, null, 2)}</code>
                    </pre>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Output value</div>
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
                  Best next step: load a similar preset in Playground, then adapt the input contract to your product.
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link href="/playground" className="inline-flex justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-black hover:bg-emerald-100">
                    Try preset
                  </Link>
                  <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`OneAI ${item.title}`)}`} className="inline-flex justify-center rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-black text-white hover:bg-white/[0.1]">
                    Discuss
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
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Have a workflow that is not listed?</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/62">
                Custom Task Intelligence turns your workflow into a dedicated API:
                input schema, output schema, routing policy, cost guard, validation,
                and rollout path.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Custom%20Task%20Pilot`} className="inline-flex justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-black hover:bg-emerald-100">
                Start custom task
              </a>
              <Link href="/docs/guides/production-checklist" className="inline-flex justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-black text-white hover:bg-white/[0.1]">
                Production checklist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
