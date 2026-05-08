import Link from "next/link";

const CONTACT_EMAIL = "info@weareoneconnection.com";
const CONTACT_TELEGRAM = "https://t.me/waocfounder";
const CONTACT_X = "https://x.com/waoconnectone?s=21";

const taskCode = `curl https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ONEAI_API_KEY" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Launch a B2B AI API product in 30 days",
      "audience": "SaaS builders and small teams"
    },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.03 } }
  }'`;

const chatCode = `curl https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\
  -H "content-type: application/json" \\
  -H "Authorization: Bearer $ONEAI_API_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "messages": [
      { "role": "user", "content": "Explain OneAI in one sentence." }
    ],
    "max_completion_tokens": 300
  }'`;

const modelRows = [
  ["OpenAI", "GPT-5.2", "Frontier reasoning"],
  ["Anthropic", "Claude", "Long-context judgment"],
  ["Google", "Gemini", "Fast multimodal intelligence"],
  ["xAI", "Grok", "Realtime market awareness"],
  ["DeepSeek", "Reasoner", "Efficient structured logic"],
  ["OpenRouter", "480+ catalog", "Choice without lock-in"],
];

const taskRows = [
  ["business_strategy", "Executive-ready strategy", "Free"],
  ["content_engine", "Launch narrative engine", "Free"],
  ["campaign_mission", "Verifiable growth campaigns", "Pro"],
  ["support_brain", "Customer-facing response intelligence", "Pro"],
  ["market_research", "Decision-grade market brief", "Pro"],
  ["custom_task_designer", "Customer-specific workflow intelligence", "Team"],
];

const proofRows = [
  "OpenAI-compatible integration",
  "Structured JSON contracts",
  "Cost-aware model routing",
  "Operator customer visibility",
  "Billing and plan gates",
  "Execution stays external",
];

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f7f6f2]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-sm font-black shadow-sm">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-black tracking-tight">OneAI</div>
            <div className="truncate text-xs text-black/50">Commercial AI infrastructure · 商业 AI 基础设施</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-black/60 lg:flex">
          <a href="#platform" className="hover:text-black">Platform 平台</a>
          <a href="#tasks" className="hover:text-black">Tasks 任务</a>
          <a href="#commercial" className="hover:text-black">Commercial 商业化</a>
          <Link href="/docs" className="hover:text-black">Docs 文档</Link>
          <Link href="/pricing" className="hover:text-black">Pricing 价格</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-black/[0.03] sm:inline-flex"
          >
            Console
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-black px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-neutral-900 sm:px-4"
          >
            Start 开始
          </Link>
        </div>
      </div>
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/60 shadow-sm">
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-2xl font-black tracking-tight text-black">{value}</div>
      <div className="mt-1 text-xs leading-relaxed text-black/55">{label}</div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-black uppercase tracking-wide text-black/40">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-black md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-black/60">{desc}</p>
    </div>
  );
}

function ConsolePreview() {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-3 shadow-2xl shadow-black/10">
      <div className="rounded-lg border border-black/10 bg-[#f7f7f6] p-3">
        <div className="flex flex-col gap-2 border-b border-black/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black">OneAI Developer Console</div>
            <div className="text-xs text-black/45">Model routing, tasks, keys, usage, customers</div>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Live</span>
            <span className="rounded-full bg-black px-2 py-1 text-xs font-bold text-white">gpt-5.2</span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat value="480" label="Synced model catalog · 已同步模型目录" />
          <Stat value="$0.0003" label="Typical task cost · 常见任务成本" />
          <Stat value="Ready" label="API keys, billing, usage · 密钥、计费、用量" />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-black/10 bg-white p-4">
            <div className="text-xs font-black uppercase tracking-wide text-black/40">Routing decision</div>
            <div className="mt-3 space-y-3">
              {[
                ["Need low cost", "gpt-4o-mini", "cheap"],
                ["Need depth", "gpt-5.2", "premium"],
                ["Need fallback", "openrouter", "auto"],
              ].map((row) => (
                <div key={row[0]} className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.03] px-3 py-2 text-xs">
                  <span className="font-semibold text-black/65">{row[0]}</span>
                  <span className="font-mono text-black">{row[1]}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-bold text-black/55">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-[#0f1115] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wide text-white/45">Structured response</div>
              <div className="text-xs text-white/40">requestId + usage</div>
            </div>
            <pre className="mt-3 max-h-[260px] overflow-auto text-[11px] leading-relaxed text-white/75 sm:text-xs">
              <code>{`{
  "success": true,
  "task": "business_strategy",
  "usage": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "estimatedCostUsd": 0.000321
  },
  "data": {
    "summary": "Launch plan ready",
    "strategy": ["Validate wedge", "Ship API", "Track usage"],
    "risks": ["Support load", "Model cost"],
    "nextActions": ["Create keys", "Start pilot"]
  }
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  title,
  desc,
  items,
}: {
  title: string;
  desc: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-lg bg-black/[0.03] px-3 py-2 text-sm font-semibold text-black/70">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-[#f7f6f2] text-black">
      <Header />

      <section className="relative overflow-hidden border-b border-black/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,163,127,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(0,0,0,0.08),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Pill>Unified model gateway 统一模型网关</Pill>
              <Pill>Task Intelligence 任务智能</Pill>
              <Pill>Operator-grade SaaS infrastructure 商业运营基础设施</Pill>
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.03] tracking-tight text-black sm:text-5xl lg:text-7xl">
              The intelligence control layer for AI-native products.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-black/65">
              OneAI unifies frontier models, structured Task Intelligence, cost governance,
              customer usage, billing, and operator visibility into one commercial API layer.
              一个商业级 API 层，统一前沿大模型、结构化任务智能、成本治理、客户用量、计费和运营视角。
            </p>
            <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-black">
              Give your product an AI brain that can route, reason, structure, and govern.
              让你的产品拥有可路由、可推理、可结构化、可治理的 AI 智能大脑。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/10 hover:bg-neutral-900"
              >
                Create API Key 创建 API Key
              </Link>
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-lg border border-black/15 bg-white px-6 py-3 text-sm font-black shadow-sm hover:bg-black/[0.03]"
              >
                Read Docs 查看文档
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20SaaS%20Commercial%20Access`}
                className="inline-flex items-center justify-center rounded-lg border border-black/15 bg-white px-6 py-3 text-sm font-black shadow-sm hover:bg-black/[0.03]"
              >
                Contact Sales 联系开通
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <Stat value="2 APIs" label="One standard gateway plus one structured intelligence API · 模型网关 + 任务智能" />
              <Stat value="480+" label="Catalog-ready model coverage with health and readiness signals · 模型目录与健康状态" />
              <Stat value="SaaS-ready" label="Keys, usage, customers, billing, requestId, idempotency · 可商业运营" />
            </div>
          </div>

          <div className="min-w-0">
            <ConsolePreview />
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <SectionTitle
          eyebrow="Platform 平台"
          title="A commercial intelligence layer, not another prompt wrapper."
          desc="Model gateways provide access. OneAI adds routing judgment, structured task outputs, cost discipline, customer visibility, and a foundation for custom AI workflows. 模型网关解决接入，OneAI 进一步提供路由判断、结构化输出、成本纪律、客户可见性和可定制任务智能。"
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Feature
            title="OpenAI-compatible gateway · 兼容模型网关"
            desc="Keep the developer experience familiar while avoiding single-model lock-in."
            items={["/v1/chat/completions", "Streaming responses", "Provider:model routing", "Catalog sync and health checks"]}
          />
          <Feature
            title="Task Intelligence API · 任务智能 API"
            desc="Turn user intent into predictable business objects, not loose text."
            items={["Schema-shaped outputs", "Commercial task registry", "Customer workflow design", "Execution-ready planning"]}
          />
          <Feature
            title="Commercial control plane · 商业控制平面"
            desc="Sell AI access with the visibility and boundaries a real SaaS business needs."
            items={["API keys and scopes", "Usage, cost, latency", "Customer operations", "Plan policy and billing"]}
          />
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#111] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {proofRows.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/75">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionTitle
              eyebrow="Model coverage 模型覆盖"
              title="Route intelligence across frontier and cost-efficient models."
              desc="The goal is not to connect every model blindly. The goal is to make model choice operational: cheap when possible, premium when necessary, observable every time. 不是盲目接入所有模型，而是把模型选择变成可运营能力：能省则省，必要时用强模型，每次调用都可观察。"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {modelRows.map((row) => (
              <div key={row[0]} className="rounded-lg border border-black/10 bg-[#f7f6f2] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black">{row[0]}</div>
                  <div className="rounded-full bg-white px-2 py-1 text-xs font-bold text-black/50">{row[2]}</div>
                </div>
                <div className="mt-3 font-mono text-sm text-black/70">{row[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tasks" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionTitle
              eyebrow="Task Intelligence 任务智能"
              title="Package intelligence as products customers can rely on."
              desc="OneAI tasks are commercial contracts: stable inputs, stable outputs, clear tiers, measurable cost, and workflows that can be customized for each customer. OneAI 的任务不是普通 prompt，而是商业合约：输入稳定、输出稳定、套餐明确、成本可测，并能按客户业务定制。"
            />
            <div className="mt-8 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-12 bg-black/[0.03] px-4 py-3 text-xs font-black text-black/45">
                  <div className="col-span-4">Task</div>
                  <div className="col-span-5">Use case</div>
                  <div className="col-span-3 text-right">Tier</div>
                </div>
                {taskRows.map((row) => (
                  <div key={row[0]} className="grid grid-cols-12 border-t border-black/10 px-4 py-3 text-sm">
                    <div className="col-span-4 font-mono text-black/80">{row[0]}</div>
                    <div className="col-span-5 text-black/60">{row[1]}</div>
                    <div className="col-span-3 text-right font-bold text-black">{row[2]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-[#0f1115] p-4 text-white shadow-2xl shadow-black/10">
            <div className="flex flex-col gap-1 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-black">Two ways to integrate · 两种接入方式</div>
              <div className="text-xs text-white/45">task + chat</div>
            </div>
            <div className="mt-4 text-xs font-black uppercase tracking-wide text-white/45">Task Intelligence</div>
            <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/75 sm:text-xs">
              <code>{taskCode}</code>
            </pre>
            <div className="mt-5 border-t border-white/10 pt-4 text-xs font-black uppercase tracking-wide text-white/45">Model Gateway</div>
            <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/75 sm:text-xs">
              <code>{chatCode}</code>
            </pre>
          </div>
        </div>
      </section>

      <section id="commercial" className="border-y border-black/10 bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-white/40">Commercial operation 商业运营</div>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-5xl">
                Built for teams that monetize AI, not just experiment with it.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/60">
                OneAI includes login, API key issuance, customer visibility, request history,
                model cost estimates, usage analytics, policy gates, contact sales, and billing readiness.
                从登录、发 Key、客户视图、请求记录、模型成本、用量分析、套餐权限到人工开通和计费准备，直接面向商业运营。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-black text-black">
                  View Pricing 查看价格
                </Link>
                <a href={CONTACT_TELEGRAM} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-black text-white hover:bg-white/10">
                  Telegram
                </a>
                <a href={CONTACT_X} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-black text-white hover:bg-white/10">
                  X
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Customers", "Know who signed in, created keys, converted to usage, and generated cost."],
                ["Usage", "Track requests, tokens, model, provider, cost, latency, errors, and recent activity."],
                ["Policy", "Gate task tiers, routing modes, debug traces, explicit model choice, and budgets."],
                ["Trust", "Request IDs, idempotency keys, schema outputs, audit events, and execution boundaries."],
              ].map((item) => (
                <div key={item[0]} className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                  <div className="text-lg font-black">{item[0]}</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item[1]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xl shadow-black/5 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-black/40">Ready for pilots 准备接入</div>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-5xl">
                Start as a model gateway. Become the intelligence brain behind the product.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-black/60">
                Use standard model calls today. Then let OneAI design structured, measurable,
                customer-specific Task Intelligence for your real workflow.
                先用标准模型网关接入，再把真实业务流程升级成结构化、可衡量、可商业化的专属任务智能。
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-sm font-black text-white hover:bg-neutral-900">
                Create API Key
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}?subject=OneAI%20Task%20Intelligence`} className="inline-flex items-center justify-center rounded-lg border border-black/15 px-6 py-3 text-sm font-black hover:bg-black/[0.03]">
                Contact Sales: {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
