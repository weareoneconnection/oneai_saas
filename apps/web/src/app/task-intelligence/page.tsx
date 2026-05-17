import Link from "next/link";

const CONTACT_EMAIL = "info@weareoneconnection.com";

const taskCards = [
  {
    name: "Business Strategy",
    task: "business_strategy",
    tier: "Free",
    desc: "Turn a goal into a strategy, milestones, risks, next actions, and success metrics.",
  },
  {
    name: "Content Engine",
    task: "content_engine",
    tier: "Free",
    desc: "Generate hooks, posts, CTAs, hashtags, and launch variants for product marketing.",
  },
  {
    name: "Market Research",
    task: "market_research",
    tier: "Pro",
    desc: "Create a market brief from product, audience, competitors, and launch context.",
  },
  {
    name: "Decision Intelligence",
    task: "decision_intelligence",
    tier: "Pro",
    desc: "Convert context and options into a recommendation, confidence, risks, and next steps.",
  },
  {
    name: "Support Brain",
    task: "support_brain",
    tier: "Pro",
    desc: "Draft customer replies with intent, confidence, suggested action, and memory update.",
  },
  {
    name: "Custom Task Designer",
    task: "custom_task_designer",
    tier: "Team",
    desc: "Design a custom task contract for a customer's real workflow and rollout plan.",
  },
];

const contractSteps = [
  ["Input contract", "Define what the customer sends: goal, context, audience, constraints, messages, or business data."],
  ["Routing policy", "Choose cheap, balanced, fast, premium, auto, or an explicit provider/model policy."],
  ["Workflow prompt", "Package the task into a stable internal prompt and validation path instead of loose ad-hoc prompting."],
  ["Output schema", "Return predictable JSON fields the customer's product can store, display, review, or pass to another tool."],
  ["Usage metadata", "Attach requestId, model, provider, token usage, latency, fallback state, and estimated cost."],
];

const examples = [
  ["SaaS launch", "business_strategy", "A founder turns a 30-day launch goal into a practical execution plan."],
  ["Marketing workflow", "content_engine", "A team generates product posts and campaign variants with cost controls."],
  ["Support automation", "support_brain", "A product drafts customer replies without giving the model direct execution power."],
  ["Enterprise workflow", "custom_task_designer", "A customer designs a proprietary task with its own inputs, outputs, and policy."],
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
            <div className="truncate text-xs text-white/45">Task Intelligence</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-white/55 md:flex">
          <Link href="/docs/product-guide" className="hover:text-white">Product Guide</Link>
          <Link href="/docs/guides/production-checklist" className="hover:text-white">Checklist</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-black hover:bg-emerald-100">Start</Link>
        </nav>
      </div>
    </header>
  );
}

export default function TaskIntelligencePage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <Header />

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300/70">
              OneAI Task Intelligence
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
              Turn business intent into API-ready intelligence.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/62 md:text-lg">
              OneAI is not only a model gateway. Task Intelligence packages
              repeatable business workflows into stable inputs, structured
              outputs, plan-aware access, and measurable model cost.
            </p>
            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-emerald-100/80 md:text-base">
              不是普通 prompt 模板，也不是单纯模型中转站。OneAI 把业务需求变成可售卖、可计量、可治理的智能 API。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black hover:bg-emerald-100">
                Create API Key
              </Link>
              <Link href="/docs/product-guide" className="inline-flex justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white hover:bg-white/[0.1]">
                Read Product Guide
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}?subject=Custom%20Task%20Intelligence`} className="inline-flex justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-300/15">
                Design Custom Task
              </a>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/30">
            <div className="rounded-[1.3rem] border border-white/10 bg-black/30 p-4">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/35">Task contract</div>
              <div className="mt-4 space-y-3">
                {contractSteps.map(([title, desc], index) => (
                  <div key={title} className="grid grid-cols-[38px_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/10 text-xs font-black text-emerald-100">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-white/50">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="max-w-3xl">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300/70">Public tasks</div>
          <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Tasks customers can understand, test, and buy.</h2>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            Public tasks are commercial-facing contracts. Internal workflows can remain private while customers see a clean product catalog.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {taskCards.map((task) => (
            <div key={task.task} className="rounded-[1.3rem] border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[0.075]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-white">{task.name}</div>
                  <code className="mt-2 block text-xs font-bold text-emerald-100/75">{task.task}</code>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/55">
                  {task.tier}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/52">{task.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300/70">Use cases</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Sell outcomes, not raw tokens.</h2>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              The value of Task Intelligence is that customers can plug outputs into real product workflows: dashboards, review queues, support tools, campaign systems, or agent execution layers.
            </p>
          </div>
          <div className="grid gap-3">
            {examples.map(([title, task, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-lg font-black text-white">{title}</div>
                  <code className="text-xs font-bold text-emerald-100/70">{task}</code>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/52">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.68fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Need a custom intelligence workflow?</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/62">
                OneAI can turn a customer workflow into a custom task with its own input contract, output schema, routing policy, plan gate, and rollout path.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Custom%20Task%20Intelligence`} className="inline-flex justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-black hover:bg-emerald-100">
                Contact Sales
              </a>
              <Link href="/docs/guides/production-checklist" className="inline-flex justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-black text-white hover:bg-white/[0.1]">
                Production Checklist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
