"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CommercialPreview } from "@/components/home/CommercialPreview";
import { DynamicSystemMap } from "@/components/home/DynamicSystemMap";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

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
  ["Trust", "/trust-center"],
  ["Docs", "/docs"],
  ["Pricing", "/pricing"],
];

const heroStats = [
  ["4", "API surfaces", "Generate + Chat + Messages + Agent OS"],
  ["480+", "model catalog target", "Provider choice without product rewrites"],
  ["4", "routing modes", "Cheap, balanced, premium, explicit"],
  ["1", "control plane", "Keys, usage, customers, costs, billing"],
];

const systemLayers = [
  {
    number: "01",
    label: "Access",
    title: "Model Gateway APIs",
    desc: "OpenAI-compatible Chat and Messages access with provider:model routing and product-level observability.",
    items: ["/v1/chat/completions", "/v1/messages", "streaming", "model catalog"],
  },
  {
    number: "02",
    label: "Intelligence",
    title: "Generate Task API",
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
    label: "Agent OS",
    title: "Preview & Handoff",
    desc: "Generate agent plans, context packets, and handoff contracts while keeping execution outside OneAI.",
    items: ["/v1/capabilities", "/v1/agent-plans", "/v1/handoff/preview", "/v1/context/preview"],
  },
  {
    number: "05",
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

const conversionSteps = [
  ["1", "Create a free key", "Sign in, create a server-side API key, and test without touching production code.", "/login"],
  ["2", "Run a billable workflow", "Start with business_strategy or content_engine, then move to Pro/Team task contracts.", "/playground"],
  ["3", "Measure cost and margin", "Track provider, model, tokens, estimated cost, failures, and customer usage from the console.", "/usage"],
];

const buyerProofRows = [
  ["Data boundary", "OneAI returns intelligence and handoff contracts. Execution stays with OneClaw, bots, your system, or humans."],
  ["Cost control", "Every request can carry model, token, latency, requestId, cost estimate, and routing trace metadata."],
  ["Commercial control", "API keys, usage, customers, billing readiness, team roles, audit events, and Agent OS ledger live in one console."],
];

const faqRows = [
  {
    q: "Is OneAI a model provider?",
    a: "No. OneAI sits above model providers as a commercial infrastructure layer. It helps your product route, govern, package, observe, and monetize AI usage.",
  },
  {
    q: "Can I keep using OpenAI-compatible requests?",
    a: "Yes. The gateway supports familiar /v1/chat/completions behavior, plus /v1/messages for Messages-style integrations, while adding provider routing, cost visibility, and operational controls.",
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
  const { isZh } = useI18n();
  const items = isZh
    ? [
        ["平台", "#platform"],
        ["Tasks", "#tasks"],
        ["Task Intelligence", "/task-intelligence"],
        ["使用场景", "/use-cases"],
        ["商业化", "#commercial"],
        ["信任中心", "/trust-center"],
        ["文档", "/docs"],
        ["价格", "/pricing"],
      ]
    : navItems;

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
            <div className="truncate text-xs text-white/45">
              {isZh ? "商业 AI 操作层" : "Commercial AI Operating Layer"}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-white/52 lg:flex">
          {items.map(([label, href]) =>
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
          <LanguageToggle compact />

          <Link
            href="/dashboard"
            className="hidden rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-black text-white/80 transition hover:bg-white/[0.1] sm:inline-flex"
          >
            {isZh ? "控制台" : "Console"}
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black shadow-lg shadow-white/10 transition hover:bg-emerald-100"
          >
            {isZh ? "开始使用" : "Start"}
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
  const { isZh } = useI18n();
  const statusCards = isZh
    ? [
        ["Gateway", "Chat Completions", "就绪"],
        ["Messages", "Messages 风格 API", "就绪"],
        ["Tasks", "结构化输出", "就绪"],
        ["Agent OS", "Handoff 预览", "预览"],
      ]
    : [
        ["Gateway", "Chat completions", "ready"],
        ["Messages", "Anthropic-style API", "ready"],
        ["Tasks", "Structured outputs", "ready"],
        ["Agent OS", "Handoff preview", "preview"],
      ];

  const routingPolicies = isZh
    ? [
        ["cheap", "低成本模型", "简单生成"],
        ["balanced", "均衡模型", "产品工作流"],
        ["premium", "前沿模型", "复杂推理"],
        ["explicit", "provider:model", "客户指定策略"],
      ]
    : [
        ["cheap", "Low-cost model", "Simple generation"],
        ["balanced", "Balanced model", "Product workflows"],
        ["premium", "Frontier model", "Complex reasoning"],
        ["explicit", "provider:model", "Customer policy"],
      ];

  const sampleRequests = [
    ["sample_01", "business_strategy", "task"],
    ["sample_02", "chat.completions", "gateway"],
    ["sample_03", "messages", "gateway"],
    ["sample_04", "agent-plans", "handoff"],
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
              <div className="text-sm font-black text-white">
                {isZh ? "AI 运营预览" : "AI Operations Preview"}
              </div>
              <div className="mt-1 max-w-sm text-xs leading-relaxed text-white/42">
                {isZh
                  ? "Gateway、tasks、路由、策略和商业可见性统一在一个操作层。"
                  : "Gateway, tasks, routing, policy, and commercial visibility in one operating layer."}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="whitespace-nowrap rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100/85">
                {isZh ? "预览" : "Preview"}
              </span>
              <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/52">
                {isZh ? "示例流程" : "Sample flow"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            {(isZh ? ["Chat 网关就绪", "Messages 就绪", "Task API 就绪", "Agent OS 预览"] : ["Chat gateway ready", "Messages ready", "Task API ready", "Agent OS preview"]).map((item) => (
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
                {isZh ? "路由策略" : "Routing policy"}
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
                  {isZh ? "示例请求" : "Sample requests"}
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
                  {isZh ? "产品预览" : "Product preview"}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-white/46">
                  {isZh
                    ? "这里只是示例界面。真实请求、客户、成本和用量在登录后的控制台中查看。"
                    : "Example interface only. Real requests, customers, costs, and usage live inside the authenticated dashboard."}
                </div>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/68 transition hover:bg-white/[0.1]"
              >
                {isZh ? "打开控制台" : "Open Console"}
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
  const { isZh } = useI18n();
  const c = {
    badges: isZh ? ["AI 网关", "Task Intelligence", "商业控制平面"] : ["AI gateway", "Task intelligence", "Commercial control plane"],
    heroTitle: isZh ? "面向商业 AI 产品的操作层。" : "The operating layer for commercial AI products.",
    heroDesc: isZh
      ? "OneAI 帮助 SaaS 团队把原始模型调用升级为可售卖、可治理、可计量的 AI 功能：模型路由、结构化输出、Agent OS handoff 基础设施、API keys、用量可见性、成本控制和商业运营能力。"
      : "OneAI helps SaaS teams turn raw model access into paid, governed, measurable AI features with model routing, structured outputs, Agent OS handoff infrastructure, API keys, usage visibility, cost controls, and billing-ready operations.",
    heroBrain: isZh
      ? "OneAI 是模型路由、Task Intelligence 和 Agent OS handoff 的智能协调大脑。OneClaw、bot、外部 agent 或人工操作员负责执行。"
      : "OneAI is the intelligent coordination brain for model routing, Task Intelligence, and Agent OS handoff. OneClaw, bots, external agents, or human operators handle execution.",
    heroLine: isZh
      ? "从“能调用模型”升级为“能销售、计量、治理和定制 AI 能力”的商业基础设施。"
      : "From model access to commercial AI infrastructure that can sell, measure, govern, and customize intelligence.",
    createKey: isZh ? "创建 API Key" : "Create API Key",
    quickstart: isZh ? "阅读快速开始" : "Read Quickstart",
    taskIntelligence: "Task Intelligence",
    useCases: isZh ? "使用场景" : "Use Cases",
    contactSales: isZh ? "联系销售" : "Contact Sales",
    platformEyebrow: isZh ? "平台架构" : "Platform architecture",
    platformTitle: isZh ? "覆盖每个模型、task、客户和请求的商业操作层。" : "One commercial layer above every model, task, customer, and request.",
    platformDesc: isZh
      ? "OneAI 把模型访问、结构化工作流智能、运营可见性和商业控制合并成一个产品层。"
      : "OneAI combines model access, structured workflow intelligence, operational visibility, and commercial controls into one product layer.",
    dxEyebrow: isZh ? "开发者体验" : "Developer experience",
    dxTitle: isZh ? "四个 API surfaces，一个产品级 AI 系统。" : "Four API surfaces. One product-grade AI system.",
    dxDesc: isZh
      ? "用 Chat 或 Messages 获得熟悉的模型访问，用 Generate 构建结构化 Task Intelligence，用 Agent OS 端点完成规划、上下文和 handoff 预览。"
      : "Use Chat or Messages for familiar model access, Generate for structured Task Intelligence, and Agent OS endpoints for planning, context, and handoff previews.",
    docsTitle: isZh ? "阅读文档" : "Read Docs",
    docsDesc: isZh ? "查看鉴权、路由、task 类型、示例、响应格式和模型使用。" : "Explore auth, routes, task types, examples, response formats, and model usage.",
    tiDesc: isZh ? "了解 OneAI 如何把商业工作流打包成结构化、可计费的 API 合约。" : "See how OneAI packages business workflows into structured, billable API contracts.",
    consoleTitle: isZh ? "打开控制台" : "Open Console",
    consoleDesc: isZh ? "创建 keys、查看请求、监控用量并管理 AI 运营。" : "Create keys, inspect requests, monitor usage, and manage AI operations.",
    conversionEyebrow: isZh ? "转化路径" : "Conversion path",
    conversionTitle: isZh ? "从首次登录到付费 AI 用量，形成一个可控闭环。" : "From first login to paid AI usage in one controlled flow.",
    conversionDesc: isZh
      ? "首页不仅解释 OneAI，还要推动新用户创建 key、完成第一次成功请求，并进入成本可见的生产集成。"
      : "The homepage should not only explain OneAI. It should move a new user toward key creation, a first successful request, and a cost-visible production integration.",
    startFree: isZh ? "免费开始" : "Start Free",
    tasksEyebrow: "Task Intelligence",
    tasksTitle: isZh ? "把智能产品化为可复用的商业合约。" : "Productize intelligence as reusable business contracts.",
    tasksDesc: isZh
      ? "Task Intelligence 为产品提供稳定输入、结构化输出、套餐权限和可计量模型成本。"
      : "Task Intelligence gives your product stable inputs, structured outputs, plan-aware access, and measurable model cost.",
    modelEyebrow: isZh ? "模型策略" : "Model strategy",
    modelTitle: isZh ? "按业务需求路由，而不是被 provider 锁定。" : "Route by business need, not provider lock-in.",
    modelDesc: isZh
      ? "能省则省，需要时用前沿模型，客户要求时显式指定。每次调用都可观测。"
      : "Cheap when possible. Premium when necessary. Explicit when customers require it. Observable every time.",
    whyEyebrow: isZh ? "为什么选择 OneAI" : "Why OneAI",
    whyTitle: isZh ? "连接模型 API 与可变现 AI 产品之间缺失的一层。" : "The missing bridge between model APIs and monetized AI products.",
    whyDesc: isZh
      ? "调用模型很容易。难的是把调用变成客户能购买、信任、计量并反复使用的产品能力。"
      : "Calling a model is easy. Turning that call into something customers can buy, trust, measure, and use repeatedly is the hard part.",
    trustEyebrow: isZh ? "信任层" : "Trust layer",
    trustTitle: isZh ? "不是简单转发模型请求的黑盒中转站。" : "Built to be more than a pass-through model relay.",
    trustDesc: isZh
      ? "客户不只担心能不能访问模型。他们更担心隐藏路由、成本失控、数据边界不清，以及 AI 输出能不能进入真实产品。"
      : "Customers do not only worry about model access. They worry about hidden routing, runaway cost, unclear data boundaries, and whether AI outputs are usable inside a real product.",
    positioning: isZh ? "定位" : "Positioning",
    positioningDesc: isZh
      ? "通用网关卖的是模型访问。OneAI 卖的是把模型变成可治理、可计量、面向特定任务的商业智能操作层。"
      : "Generic gateways sell access to models. OneAI sells the operating layer that turns models into governed, measurable, task-specific business intelligence.",
    launchEyebrow: isZh ? "上线路径" : "Launch paths",
    launchTitle: isZh ? "为需要把 AI 做成产品线的 builders 构建。" : "Built for builders who need AI to become a product line.",
    launchDesc: isZh
      ? "无论是发布第一个 AI 功能，还是为增长中的平台标准化模型访问，OneAI 都适用。"
      : "OneAI is useful whether you are shipping your first AI feature or standardizing model access across a growing platform.",
    commercialEyebrow: isZh ? "商业控制" : "Commercial control",
    commercialTitle: isZh ? "像严肃 SaaS 业务一样运营 AI。" : "Operate AI like a serious SaaS business.",
    commercialDesc: isZh
      ? "OneAI 提供 AI 周围的商业层：登录、keys、请求、用量、客户、成本、路由策略、套餐门槛和支付就绪能力。"
      : "OneAI gives you the commercial layer around AI: login, keys, requests, usage, customers, costs, routing policies, plan gates, and billing readiness.",
    viewPricing: isZh ? "查看价格" : "View Pricing",
    faqEyebrow: "FAQ",
    faqTitle: isZh ? "对 builders 足够清晰，对买家足够严肃。" : "Clear enough for builders. Serious enough for buyers.",
    faqDesc: isZh
      ? "在用户进入控制台或文档前，回答最重要的产品、技术和商业问题。"
      : "Answer the most important product, technical, and commercial questions before users enter the console or docs.",
    finalEyebrow: isZh ? "开始构建" : "Start building",
    finalTitle: isZh ? "构建客户真正愿意付费的 AI 基础设施。" : "Build the AI infrastructure your customers can actually pay for.",
    finalDesc: isZh
      ? "从 API 访问开始。随着 AI 产品增长，逐步加入路由、tasks、用量、成本控制、客户可见性和支付就绪运营。"
      : "Start with API access. Add routing, tasks, usage, cost control, customer visibility, and billing-ready operations as your AI product grows.",
  };

  const localizedHeroStats = isZh
    ? [
        ["4", "API surfaces", "Generate + Chat + Messages + Agent OS"],
        ["480+", "模型目录目标", "无需重写产品即可选择 provider"],
        ["4", "路由模式", "低成本、均衡、高级、显式指定"],
        ["1", "控制平面", "Keys、用量、客户、成本、支付"],
      ]
    : heroStats;

  const localizedSystemLayers = isZh
    ? [
        { number: "01", label: "访问", title: "模型网关 API", desc: "OpenAI-compatible Chat 和 Messages 访问，支持 provider:model 路由与产品级可观测性。", items: ["/v1/chat/completions", "/v1/messages", "streaming", "model catalog"] },
        { number: "02", label: "智能", title: "Generate Task API", desc: "把结构化商业工作流封装为稳定 API 合约，而不是松散 prompt。", items: ["/v1/generate", "typed task contracts", "structured JSON", "workflow outputs"] },
        { number: "03", label: "治理", title: "成本与策略层", desc: "通过路由模式、成本保护、套餐权限和请求可见性控制 AI 使用方式。", items: ["maxCostUsd", "routing modes", "plan gates", "request tracing"] },
        { number: "04", label: "Agent OS", title: "预览与 Handoff", desc: "生成 agent plans、上下文包和 handoff 合约，同时保持执行在 OneAI 外部。", items: ["/v1/capabilities", "/v1/agent-plans", "/v1/handoff/preview", "/v1/context/preview"] },
        { number: "05", label: "收入", title: "商业控制台", desc: "用 API keys、客户、用量、支付就绪和分析能力，像 SaaS 产品一样运营 AI。", items: ["API keys", "usage analytics", "customers", "billing readiness"] },
      ]
    : systemLayers;

  const localizedTaskRows = isZh
    ? [
        ["business_strategy", "高管级商业策略", "Free"],
        ["content_engine", "产品叙事和发布内容", "Free"],
        ["campaign_mission", "增长活动规划", "Pro"],
        ["support_brain", "客户支持智能", "Pro"],
        ["market_research", "市场与竞品简报", "Pro"],
        ["custom_task_designer", "客户定制 AI 工作流", "Team"],
      ]
    : taskRows;

  const localizedComparisonRows = isZh
    ? [
        ["集成", "手动接入每个 provider", "一个 OpenAI-compatible 网关"],
        ["输出", "prompt 形态文本", "task 形态结构化合约"],
        ["成本控制", "手动监控", "路由模式和成本保护"],
        ["运营", "日志和用量分散", "Keys、请求、客户、用量、成本"],
        ["商业化", "自己搭支付逻辑", "套餐感知、支付就绪的基础设施"],
      ]
    : comparisonRows;

  const localizedTrustRows = isZh
    ? [
        { title: "没有黑盒路由", desc: "响应暴露 provider、model、tokens、requestId、latency、fallback 状态和预估成本，团队清楚知道发生了什么。" },
        { title: "用 task 合约替代松散 prompt", desc: "结构化工作流把可复用商业逻辑封装在 typed inputs、稳定 outputs、tiers 和 validation 后面。" },
        { title: "成本优先运营", desc: "路由模式、maxCostUsd、套餐限制、用量面板和模型价格帮助团队避免 AI 成本漂移。" },
        { title: "执行边界分离", desc: "OneAI 协调智能。OneClaw、bot 或你自己的系统执行动作，让 API 边界保持清晰。" },
      ]
    : trustRows;

  const localizedLaunchPaths = isZh
    ? [
        { title: "给 SaaS 创始人", desc: "不用从零搭操作层，就能用 keys、用量、模型路由和成本追踪发布 AI 功能。" },
        { title: "给 AI 产品团队", desc: "标准化模型访问，封装可复用工作流，执行策略，并监控产品内 AI 用量。" },
        { title: "给 agency 和 builders", desc: "把策略、内容、研究、支持和活动工作流变成可复用的客户侧 AI 产品。" },
      ]
    : launchPaths;

  const localizedConversionSteps = isZh
    ? [
        ["1", "创建免费 key", "登录，创建服务端 API key，不碰生产代码也能测试。", "/login"],
        ["2", "运行可计费工作流", "先从 business_strategy 或 content_engine 开始，再升级到 Pro/Team task 合约。", "/playground"],
        ["3", "衡量成本和毛利", "在控制台追踪 provider、model、tokens、预估成本、失败和客户用量。", "/usage"],
      ]
    : conversionSteps;

  const localizedBuyerProofRows = isZh
    ? [
        ["数据边界", "OneAI 返回智能结果和 handoff 合约。执行仍在 OneClaw、bot、你的系统或人工侧完成。"],
        ["成本控制", "每个请求都能携带 model、token、latency、requestId、成本估算和路由 trace 元数据。"],
        ["商业控制", "API keys、用量、客户、支付就绪、团队角色、审计事件和 Agent OS ledger 都在同一个控制台。"],
      ]
    : buyerProofRows;

  const localizedFaqRows = isZh
    ? [
        { q: "OneAI 是模型供应商吗？", a: "不是。OneAI 位于模型供应商之上，是商业基础设施层，帮助产品路由、治理、封装、观测和变现 AI 用量。" },
        { q: "还能使用 OpenAI-compatible 请求吗？", a: "可以。网关支持熟悉的 /v1/chat/completions，也支持 /v1/messages，同时增加 provider 路由、成本可见性和运营控制。" },
        { q: "什么是 Task Intelligence？", a: "Task Intelligence 把可重复的商业工作流变成稳定 API 合约，包含明确输入、结构化输出、访问 tiers 和成本可见性。" },
        { q: "OneAI 和 B.AI 或通用模型网关有什么区别？", a: "这类平台强在模型访问和支付轨道。OneAI 也有网关，但更高的一层是 Task Intelligence：商业可用输出、成本控制、请求可见性和 SaaS 运营能力。" },
        { q: "首页控制台数字是真实的吗？", a: "不是。首页控制台和系统图是产品预览。真实用量、成本、请求和客户数据来自登录后的 dashboard。" },
      ]
    : faqRows;

  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white">
      <Header />

      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_55%_92%,rgba(59,130,246,0.10),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 md:py-24 lg:grid-cols-[0.93fr_1.07fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              {c.badges.map((badge) => <Badge key={badge}>{badge}</Badge>)}
            </div>

            <h1 className="mt-7 max-w-5xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-7xl md:leading-[0.96]">
              {c.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/62 sm:text-lg md:text-xl">
              {c.heroDesc}
            </p>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-white/52 sm:text-base">
              {c.heroBrain}
            </p>

            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-emerald-100/80 sm:text-base">
              {c.heroLine}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-9">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:bg-emerald-100"
              >
                {c.createKey}
              </Link>

              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                {c.quickstart}
              </Link>

              <Link
                href="/task-intelligence"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15"
              >
                {c.taskIntelligence}
              </Link>

              <Link
                href="/use-cases"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                {c.useCases}
              </Link>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Commercial%20Access`}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
              >
                {c.contactSales}
              </a>
            </div>

            <div className="mt-10 hidden gap-3 sm:grid sm:grid-cols-2">
              {localizedHeroStats.slice(0, 2).map(([value, label, desc]) => (
                <StatCard key={label} value={value} label={label} desc={desc} />
              ))}
            </div>
          </div>

          <PreviewConsole />
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 sm:grid-cols-2 md:grid-cols-4">
          {localizedHeroStats.map(([value, label, desc]) => (
            <StatCard key={label} value={value} label={label} desc={desc} />
          ))}
        </div>
      </section>

      <DynamicSystemMap />

      <section id="platform" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <SectionTitle
          eyebrow={c.platformEyebrow}
          title={c.platformTitle}
          desc={c.platformDesc}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {localizedSystemLayers.map((layer) => (
            <LayerCard key={layer.title} {...layer} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <SectionTitle
              eyebrow={c.dxEyebrow}
              title={c.dxTitle}
              desc={c.dxDesc}
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/docs"
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
              >
                <div className="text-lg font-black text-white">{c.docsTitle}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  {c.docsDesc}
                </p>
              </Link>

              <Link
                href="/task-intelligence"
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
              >
                <div className="text-lg font-black text-white">Task Intelligence</div>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{c.tiDesc}</p>
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]"
              >
                <div className="text-lg font-black text-white">{c.consoleTitle}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{c.consoleDesc}</p>
              </Link>
            </div>
          </div>

          <CodePanel />
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <SectionTitle
                eyebrow={c.conversionEyebrow}
                title={c.conversionTitle}
                desc={c.conversionDesc}
              />

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:bg-emerald-100"
                >
                  {c.startFree}
                </Link>
                <Link
                  href="/docs/quickstart"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                >
                  {c.quickstart}
                </Link>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Pilot%20Access`}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
                >
                  {c.contactSales}
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              {localizedConversionSteps.map(([step, title, desc, href]) => (
                <Link
                  key={title}
                  href={href}
                  className="grid gap-4 rounded-[1.45rem] border border-white/10 bg-white/[0.055] p-5 transition hover:border-emerald-300/25 hover:bg-white/[0.075] sm:grid-cols-[48px_1fr]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
                    {step}
                  </div>
                  <div>
                    <div className="text-lg font-black text-white">{title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {localizedBuyerProofRows.map(([title, desc]) => (
              <Surface key={title} className="p-5">
                <div className="text-lg font-black text-white">{title}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/52">{desc}</p>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <section id="tasks" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionTitle
              eyebrow={c.tasksEyebrow}
              title={c.tasksTitle}
              desc={c.tasksDesc}
            />
          </div>

          <Surface className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-12 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-wide text-white/35">
                <div className="col-span-5">Task</div>
                <div className="col-span-5">{isZh ? "使用场景" : "Use case"}</div>
                <div className="col-span-2 text-right">Tier</div>
              </div>

              {localizedTaskRows.map(([task, useCase, tier]) => (
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
              eyebrow={c.modelEyebrow}
              title={c.modelTitle}
              desc={c.modelDesc}
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
          eyebrow={c.whyEyebrow}
          title={c.whyTitle}
          desc={c.whyDesc}
        />

        <Surface className="mt-10 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-12 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-wide text-white/35">
              <div className="col-span-4">{isZh ? "能力" : "Capability"}</div>
              <div className="col-span-4">{isZh ? "原始模型 API" : "Raw model API"}</div>
              <div className="col-span-4">OneAI</div>
            </div>

            {localizedComparisonRows.map(([capability, raw, oneai]) => (
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
                eyebrow={c.trustEyebrow}
                title={c.trustTitle}
                desc={c.trustDesc}
              />

              <div className="mt-8 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="text-sm font-black text-emerald-100">
                  {c.positioning}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-emerald-50/70">
                  {c.positioningDesc}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {localizedTrustRows.map((item) => (
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
            eyebrow={c.launchEyebrow}
            title={c.launchTitle}
            desc={c.launchDesc}
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {localizedLaunchPaths.map((path) => (
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
              eyebrow={c.commercialEyebrow}
              title={c.commercialTitle}
              desc={c.commercialDesc}
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-emerald-100"
              >
                {c.viewPricing}
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
            eyebrow={c.faqEyebrow}
            title={c.faqTitle}
            desc={c.faqDesc}
          />

          <div className="grid gap-3">
            {localizedFaqRows.map((item) => (
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
                {c.finalEyebrow}
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
                {c.finalTitle}
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
                {c.finalDesc}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:bg-emerald-100"
              >
                {c.createKey}
              </Link>

              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                {c.quickstart}
              </Link>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Pilot%20Access`}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
              >
                {c.contactSales}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
