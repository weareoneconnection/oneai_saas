import Link from "next/link";
import type { ReactNode } from "react";
import { CommercialPreview } from "@/components/home/CommercialPreview";
import { DynamicSystemMap } from "@/components/home/DynamicSystemMap";

const CONTACT_EMAIL = "info@weareoneconnection.com";
const CONTACT_TELEGRAM = "https://t.me/waocfounder";
const CONTACT_X = "https://x.com/waoconnectone?s=21";

const taskCode = `curl https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ONEAI_API_KEY" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Launch a paid AI feature in 30 days",
      "audience": "SaaS founders and product teams"
    },
    "options": {
      "llm": {
        "mode": "balanced",
        "maxCostUsd": 0.03
      }
    }
  }'`;

const chatCode = `curl https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\
  -H "content-type: application/json" \\
  -H "Authorization: Bearer $ONEAI_API_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "messages": [
      {
        "role": "user",
        "content": "Turn this idea into a commercial AI product plan."
      }
    ],
    "max_completion_tokens": 300
  }'`;

const navItems = [
  ["Platform", "#platform"],
  ["Tasks", "#tasks"],
  ["Task Intelligence", "/task-intelligence"],
  ["Use Cases", "/use-cases"],
  ["Commercial", "#commercial"],
  ["Docs", "/docs"],
  ["Pricing", "/pricing"],
];

const heroStats = [
  ["2", "API surfaces", "Gateway + structured task intelligence"],
  ["480+", "model catalog target", "Provider choice without product rewrites"],
  ["4", "routing modes", "Cheap, balanced, premium, explicit"],
  ["1", "control plane", "Keys, usage, customers, costs, billing"],
];

const systemLayers = [
  {
    number: "01",
    label: "Access",
    title: "Model Gateway",
    desc: "OpenAI-compatible model access with provider:model routing and product-level observability.",
    items: ["/v1/chat/completions", "provider:model routing", "streaming-ready", "model catalog"],
  },
  {
    number: "02",
    label: "Intelligence",
    title: "Task API",
    desc: "Structured business workflows packaged as stable API contracts instead of loose prompts.",
    items: ["/v1/generate", "typed task contracts", "structured JSON", "workflow outputs"],
  },
  {
    number: "03",
    label: "Governance",
    title: "Cost & Policy Layer",
    desc: "Control how AI is used with routing modes, cost guards, tier access, and request visibility.",
    items: ["maxCostUsd", "routing modes", "plan gates", "request tracing"],
  },
  {
    number: "04",
    label: "Revenue",
    title: "Commercial Console",
    desc: "Operate AI like a SaaS product with API keys, customers, usage, billing readiness, and analytics.",
    items: ["API keys", "usage analytics", "customers", "billing readiness"],
  },
];

const taskRows = [
  ["business_strategy", "Executive-ready strategy", "Free"],
  ["content_engine", "Product narrative and launch content", "Free"],
  ["campaign_mission", "Growth campaign planning", "Pro"],
  ["support_brain", "Customer support intelligence", "Pro"],
  ["market_research", "Market and competitor brief", "Pro"],
  ["custom_task_designer", "Customer-specific AI workflow", "Team"],
];

const modelRows = [
  ["OpenAI", "gpt-5.2", "frontier reasoning"],
  ["Anthropic", "claude", "judgment and long context"],
  ["Google", "gemini", "multimodal intelligence"],
  ["xAI", "grok", "realtime awareness"],
  ["DeepSeek", "reasoner", "efficient structured logic"],
  ["OpenRouter", "catalog routing", "multi-provider reach"],
];

const comparisonRows = [
  ["Integration", "Wire every provider manually", "One OpenAI-compatible gateway"],
  ["Output", "Prompt-shaped text", "Task-shaped structured contracts"],
  ["Cost control", "Manual monitoring", "Routing modes and cost guards"],
  ["Operations", "Scattered logs and usage", "Keys, requests, customers, usage, cost"],
  ["Commercialization", "Build billing logic yourself", "Plan-aware and billing-ready infrastructure"],
];

const trustRows = [
  {
    title: "No black-box routing",
    desc: "Responses expose provider, model, tokens, requestId, latency, fallback state, and estimated cost so teams know exactly what happened.",
  },
  {
    title: "Task contracts over loose prompts",
    desc: "Structured workflows package repeatable business logic behind typed inputs, stable outputs, tiers, and validation.",
  },
  {
    title: "Cost-first operations",
    desc: "Routing modes, maxCostUsd, plan limits, usage dashboards, and model pricing help teams prevent AI spend drift.",
  },
  {
    title: "Execution stays separate",
    desc: "OneAI coordinates intelligence. OneClaw, bots, or your own systems execute actions, keeping the API boundary clear.",
  },
];

const gatewayContrastRows = [
  ["Generic model gateway", "OneAI intelligence layer"],
  ["Primarily forwards requests to models", "Turns business intent into reusable Task Intelligence"],
  ["Competes on number of models", "Competes on workflow quality, cost control, and commercial readiness"],
  ["Often optimized for raw chat/completion calls", "Supports model gateway calls plus structured business tasks"],
  ["Trust depends on provider access", "Trust comes from transparent routing, usage, cost, task contracts, and execution boundaries"],
];

const launchPaths = [
  {
    title: "For SaaS founders",
    desc: "Launch AI features with keys, usage, model routing, and cost tracking without building the operating layer from scratch.",
  },
  {
    title: "For AI product teams",
    desc: "Standardize model access, package repeatable workflows, enforce policies, and monitor usage across your product.",
  },
  {
    title: "For agencies and builders",
    desc: "Turn strategy, content, research, support, and campaign workflows into reusable client-facing AI products.",
  },
];

const faqRows = [
  {
    q: "Is OneAI a model provider?",
    a: "No. OneAI sits above model providers as a commercial infrastructure layer. It helps your product route, govern, package, observe, and monetize AI usage.",
  },
  {
    q: "Can I keep using OpenAI-compatible requests?",
    a: "Yes. The gateway supports familiar /v1/chat/completions behavior while adding provider routing, cost visibility, and operational controls.",
  },
  {
    q: "What is Task Intelligence?",
    a: "Task Intelligence turns repeatable business workflows into stable API contracts with defined inputs, structured outputs, access tiers, and cost visibility.",
  },
  {
    q: "How is OneAI different from B.AI or a generic model gateway?",
    a: "Those platforms are strongest at model access and payment rails. OneAI includes a gateway, but its higher layer is Task Intelligence: business-ready outputs, cost controls, request visibility, and commercial SaaS operations.",
  },
  {
    q: "Are the console numbers on this homepage real?",
    a: "No. The homepage console and system map are product previews. Real usage, cost, request, and customer data should come from the authenticated dashboard.",
  },
];

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/82 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] text-sm font-black text-white shadow-2xl shadow-emerald-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.5),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.32),transparent_42%)]" />
            <span className="relative">OA</span>
          </div>

          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-black tracking-tight text-white">OneAI</div>
            <div className="truncate text-xs text-white/45">Commercial AI Operating Layer</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-white/52 lg:flex">
          {navItems.map(([label, href]) =>
            href.startsWith("#") ? (
              <a key={label} href={href} className="transition hover:text-white">
                {label}
              </a>
            ) : (
              <Link key={label} href={href} className="transition hover:text-white">
                {label}
              </Link>
            )
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-black text-white/80 transition hover:bg-white/[0.1] sm:inline-flex"
          >
            Console
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black shadow-lg shadow-white/10 transition hover:bg-emerald-100"
          >
            Start
          </Link>
        </div>
      </div>
    </header>
  );
}

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.7rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/30 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
  center = false,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300/70">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-white/55 md:text-lg">
        {desc}
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
  desc,
}: {
  value: string;
  label: string;
  desc: string;
}) {
  return (
    <Surface className="p-5 transition hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.075]">
      <div className="text-3xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm font-black text-emerald-200">{label}</div>
      <div className="mt-2 text-sm leading-relaxed text-white/42">{desc}</div>
    </Surface>
  );
}

function PreviewConsole() {
  const statusCards = [
    ["Gateway", "OpenAI-compatible", "ready"],
    ["Tasks", "Structured outputs", "preview"],
    ["Policy", "Cost guard", "active"],
  ];

  const routingPolicies = [
    ["cheap", "Low-cost model", "Simple generation"],
    ["balanced", "Balanced model", "Product workflows"],
    ["explicit", "provider:model", "Customer policy"],
  ];

  const sampleRequests = [
    ["sample_01", "business_strategy", "task"],
    ["sample_02", "content_engine", "task"],
    ["sample_03", "support_brain", "task"],
    ["sample_04", "chat.completions", "gateway"],
  ];

  return (
    <Surface className="relative overflow-hidden p-4">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/16 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#070b13]/96">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/75" />
            <span className="h-3 w-3 rounded-full bg-yellow-300/75" />
            <span className="h-3 w-3 rounded-full bg-emerald-300/75" />
          </div>

          <div className="font-mono text-xs text-white/34">oneai.product-preview</div>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-black text-white">AI Operations Preview</div>
              <div className="mt-1 max-w-sm text-xs leading-relaxed text-white/42">
                Gateway, tasks, routing, policy, and commercial visibility in one operating layer.
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="whitespace-nowrap rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100/85">
                Preview
              </span>
              <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/52">
                Sample flow
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {statusCards.map(([title, desc, state]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-black text-white">{title}</div>
                  <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-100/70">
                    {state}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold leading-relaxed text-white/42">
                  {desc}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-2 lg:hidden">
            {["Gateway ready", "Task preview", "Cost guard active"].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-bold text-white/65"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/32">
                Routing policy
              </div>

              <div className="mt-4 space-y-3">
                {routingPolicies.map(([mode, model, desc]) => (
                  <div key={mode} className="rounded-xl bg-black/24 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="whitespace-nowrap rounded-lg bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-100/85">
                        {mode}
                      </span>
                      <span className="truncate font-mono text-xs text-white/55">{model}</span>
                    </div>
                    <div className="mt-2 text-xs text-white/35">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/32">
                  Sample requests
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
              </div>

              <div className="mt-4 space-y-3">
                {sampleRequests.map(([id, task, type]) => (
                  <div
                    key={id}
                    className="grid grid-cols-[72px_1fr_62px] items-center gap-3 rounded-xl bg-black/24 p-3 text-xs"
                  >
                    <span className="font-mono text-white/38">{id}</span>
                    <span className="truncate font-bold text-white/72">{task}</span>
                    <span className="text-right font-mono text-emerald-100/72">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-white/30">
                  Product preview
                </div>
                <div className="mt-1 text-xs leading-relaxed text-white/46">
                  Example interface only. Real requests, customers, costs, and usage live inside the authenticated dashboard.
                </div>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/68 transition hover:bg-white/[0.1]"
              >
                Open Console
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function LayerCard({
  number,
  label,
  title,
  desc,
  items,
}: {
  number: string;
  label: string;
  title: string;
  desc: string;
  items: string[];
}) {
  return (
    <Surface className="group p-6 transition hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.075]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/30">
            {number}
          </div>
          <div className="mt-2 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
            {label}
          </div>
        </div>

        <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.055] transition group-hover:border-emerald-300/25" />
      </div>

      <h3 className="mt-6 text-2xl font-black tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/50">{desc}</p>

      <div className="mt-6 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 font-mono text-xs text-white/52"
          >
            {item}
          </div>
        ))}
      </div>
    </Surface>
  );
}

function CodePanel() {
  return (
    <Surface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-300/80" />
        </div>
        <div className="font-mono text-xs text-white/35">oneai.api</div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">
            structured task api
          </div>
          <pre className="max-h-[360px] overflow-auto text-[11px] leading-relaxed text-white/68 sm:text-xs">
            <code>{taskCode}</code>
          </pre>
        </div>

        <div className="p-4">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">
            model gateway
          </div>
          <pre className="max-h-[360px] overflow-auto text-[11px] leading-relaxed text-emerald-100/72 sm:text-xs">
            <code>{chatCode}</code>
          </pre>
        </div>
      </div>
    </Surface>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white">
      <Header />

      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_55%_92%,rgba(59,130,246,0.10),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 md:py-24 lg:grid-cols-[0.93fr_1.07fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>AI gateway</Badge>
              <Badge>Task intelligence</Badge>
              <Badge>Commercial control plane</Badge>
            </div>

            <h1 className="mt-7 max-w-5xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-7xl md:leading-[0.96]">
              The operating layer for commercial AI products.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/62 sm:text-lg md:text-xl">
              OneAI helps SaaS teams turn raw model access into paid, governed,
              measurable AI features with model routing, structured outputs,
              API keys, usage visibility, cost controls, and billing-ready operations.
            </p>

            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-emerald-100/80 sm:text-base">
              从“能调用模型”升级为“能销售、计量、治理和定制 AI 能力”的商业基础设施。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-9">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:bg-emerald-100"
              >
                Create API Key
              </Link>

              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                Read Quickstart
              </Link>

              <Link
                href="/task-intelligence"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15"
              >
                Task Intelligence
              </Link>

              <Link
                href="/use-cases"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                Use Cases
              </Link>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Commercial%20Access`}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
              >
                Contact Sales
              </a>
            </div>

            <div className="mt-10 hidden gap-3 sm:grid sm:grid-cols-2">
              {heroStats.slice(0, 2).map(([value, label, desc]) => (
                <StatCard key={label} value={value} label={label} desc={desc} />
              ))}
            </div>
          </div>

          <PreviewConsole />
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 sm:grid-cols-2 md:grid-cols-4">
          {heroStats.map(([value, label, desc]) => (
            <StatCard key={label} value={value} label={label} desc={desc} />
          ))}
        </div>
      </section>

      <DynamicSystemMap />

      <section id="platform" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <SectionTitle
          eyebrow="Platform architecture"
          title="One commercial layer above every model, task, customer, and request."
          desc="OneAI combines model access, structured workflow intelligence, operational visibility, and commercial controls into one product layer."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {systemLayers.map((layer) => (
            <LayerCard key={layer.title} {...layer} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <SectionTitle
              eyebrow="Developer experience"
              title="Two APIs. One product-grade AI system."
              desc="Use the gateway for familiar model access. Use Task Intelligence when your product needs stable business outputs instead of loose prompt responses."
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/docs"
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
              >
                <div className="text-lg font-black text-white">Read Docs</div>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  Explore auth, routes, task types, examples, response formats, and model usage.
                </p>
              </Link>

              <Link
                href="/task-intelligence"
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
              >
                <div className="text-lg font-black text-white">Task Intelligence</div>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  See how OneAI packages business workflows into structured, billable API contracts.
                </p>
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
              >
                <div className="text-lg font-black text-white">Open Console</div>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  Create keys, inspect requests, monitor usage, and manage AI operations.
                </p>
              </Link>
            </div>
          </div>

          <CodePanel />
        </div>
      </section>

      <section id="tasks" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionTitle
              eyebrow="Task Intelligence"
              title="Productize intelligence as reusable business contracts."
              desc="Task Intelligence gives your product stable inputs, structured outputs, plan-aware access, and measurable model cost."
            />
          </div>

          <Surface className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-12 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-wide text-white/35">
                <div className="col-span-5">Task</div>
                <div className="col-span-5">Use case</div>
                <div className="col-span-2 text-right">Tier</div>
              </div>

              {taskRows.map(([task, useCase, tier]) => (
                <div
                  key={task}
                  className="grid grid-cols-12 border-b border-white/10 px-4 py-4 text-sm last:border-b-0"
                >
                  <div className="col-span-5 font-mono text-emerald-100/80">{task}</div>
                  <div className="col-span-5 text-white/55">{useCase}</div>
                  <div className="col-span-2 text-right font-black text-white">{tier}</div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionTitle
              eyebrow="Model strategy"
              title="Route by business need, not provider lock-in."
              desc="Cheap when possible. Premium when necessary. Explicit when customers require it. Observable every time."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {modelRows.map(([provider, model, purpose]) => (
              <Surface key={provider} className="p-5 transition hover:border-emerald-300/25 hover:bg-white/[0.075]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-black text-white">{provider}</div>
                  <div className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-black text-white/35">
                    {purpose}
                  </div>
                </div>
                <div className="mt-4 font-mono text-sm text-emerald-100/70">{model}</div>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <SectionTitle
          center
          eyebrow="Why OneAI"
          title="The missing bridge between model APIs and monetized AI products."
          desc="Calling a model is easy. Turning that call into something customers can buy, trust, measure, and use repeatedly is the hard part."
        />

        <Surface className="mt-10 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-12 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-wide text-white/35">
              <div className="col-span-4">Capability</div>
              <div className="col-span-4">Raw model API</div>
              <div className="col-span-4">OneAI</div>
            </div>

            {comparisonRows.map(([capability, raw, oneai]) => (
              <div key={capability} className="grid grid-cols-12 border-t border-white/10 px-4 py-5 text-sm">
                <div className="col-span-4 font-black text-white">{capability}</div>
                <div className="col-span-4 pr-4 text-white/40">{raw}</div>
                <div className="col-span-4 font-bold text-emerald-100/75">{oneai}</div>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <SectionTitle
                eyebrow="Trust layer"
                title="Built to be more than a pass-through model relay."
                desc="Customers do not only worry about model access. They worry about hidden routing, runaway cost, unclear data boundaries, and whether AI outputs are usable inside a real product."
              />

              <div className="mt-8 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="text-sm font-black text-emerald-100">
                  Positioning
                </div>
                <p className="mt-2 text-sm leading-relaxed text-emerald-50/70">
                  Generic gateways sell access to models. OneAI sells the operating layer that turns models into governed, measurable, task-specific business intelligence.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {trustRows.map((item) => (
                <Surface key={item.title} className="p-5 transition hover:border-emerald-300/25 hover:bg-white/[0.075]">
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/52">{item.desc}</p>
                </Surface>
              ))}
            </div>
          </div>

          <Surface className="mt-10 overflow-x-auto">
            <div className="min-w-[760px]">
              {gatewayContrastRows.map((row, index) => (
                <div
                  key={row.join(":")}
                  className={`grid grid-cols-2 gap-4 px-4 py-4 text-sm ${
                    index === 0
                      ? "bg-white/[0.06] text-xs font-black uppercase tracking-wide text-white/35"
                      : "border-t border-white/10"
                  }`}
                >
                  <div className={index === 0 ? "" : "text-white/42"}>{row[0]}</div>
                  <div className={index === 0 ? "" : "font-bold text-emerald-100/75"}>{row[1]}</div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <SectionTitle
            center
            eyebrow="Launch paths"
            title="Built for builders who need AI to become a product line."
            desc="OneAI is useful whether you are shipping your first AI feature or standardizing model access across a growing platform."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {launchPaths.map((path) => (
              <Surface
                key={path.title}
                className="p-6 transition hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[0.075]"
              >
                <h3 className="text-2xl font-black tracking-tight text-white">{path.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/52">{path.desc}</p>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <section id="commercial" className="border-y border-white/10 bg-black">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div>
            <SectionTitle
              eyebrow="Commercial control"
              title="Operate AI like a serious SaaS business."
              desc="OneAI gives you the commercial layer around AI: login, keys, requests, usage, customers, costs, routing policies, plan gates, and billing readiness."
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-emerald-100"
              >
                View Pricing
              </Link>

              <a
                href={CONTACT_TELEGRAM}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                Telegram
              </a>

              <a
                href={CONTACT_X}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                X
              </a>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
            <CommercialPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionTitle
            eyebrow="FAQ"
            title="Clear enough for builders. Serious enough for buyers."
            desc="Answer the most important product, technical, and commercial questions before users enter the console or docs."
          />

          <div className="grid gap-3">
            {faqRows.map((item) => (
              <Surface key={item.q} className="p-5">
                <h3 className="text-lg font-black text-white">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/52">{item.a}</p>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 md:pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 via-white/[0.06] to-cyan-300/10 p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl sm:p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/75">
                Start building
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
                Build the AI infrastructure your customers can actually pay for.
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
                Start with API access. Add routing, tasks, usage, cost control,
                customer visibility, and billing-ready operations as your AI product grows.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:bg-emerald-100"
              >
                Create API Key
              </Link>

              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                Read Quickstart
              </Link>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Pilot%20Access`}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
