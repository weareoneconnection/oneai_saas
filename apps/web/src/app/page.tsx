// apps/web/src/app/page.tsx
import Link from "next/link";

const code = `curl https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ONEAI_API_KEY" \\
  -d '{
    "type": "mission_os",
    "input": {
      "goal": "Launch a builder campaign",
      "audience": "builders and founders"
    },
    "options": {
      "llm": { "mode": "cheap", "maxCostUsd": 0.03 }
    }
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

function Header() {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-sm font-bold">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold">OneAI API</div>
            <div className="max-w-[180px] text-xs text-black/50 sm:max-w-none">Full-model AI brain · 全模型 AI 智能大脑</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-black/65 md:flex">
          <Link href="/docs" className="hover:text-black">
            Docs 文档
          </Link>
          <Link href="/pricing" className="hover:text-black">
            Pricing 价格
          </Link>
          <Link href="/security" className="hover:text-black">
            安全 Security
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03] sm:inline-flex"
          >
            Console 控制台
          </Link>
          <Link
            href="/keys"
            className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-900 sm:px-4"
          >
            API Key
          </Link>
        </div>
      </div>
    </header>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t border-black/10 pt-4">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-black/55">{label}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="text-sm font-bold">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-white text-black">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:py-20">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-black/45">
              OneAI coordinates intelligence. OneClaw and bots execute. · OneAI 负责智能协调，执行交给 OneClaw 和 Bot。
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-6xl">
              Full-model AI infrastructure with Task Intelligence built in.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/65 md:text-lg">
              OneAI gives teams one API for model routing, structured tasks,
              cost controls, streaming chat, model health, usage, and billing.
              一个统一 API，覆盖模型路由、结构化任务、成本控制、流式对话、模型健康和商业计费。
            </p>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-black md:text-lg">
              We provide customized Task Intelligence for customer needs,
              turning OneAI into the AI brain behind their applications.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/55 md:text-base">
              Custom Task Intelligence can be designed around each customer workflow.
              可按客户业务流程定制任务智能，让 OneAI 成为应用背后的 AI brain。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-neutral-900"
              >
                Quickstart 快速开始
              </Link>
              <Link
                href="/playground"
                className="inline-flex items-center justify-center rounded-lg border border-black/15 px-5 py-3 text-sm font-bold hover:bg-black/[0.03]"
              >
                Playground 在线测试
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <Metric value="Full-model" label="OpenAI GPT-5, Anthropic, Gemini, xAI, DeepSeek, Qwen, Moonshot, Doubao, OpenRouter · 全模型接入" />
              <Metric value="Cost-aware" label="Mode routing, maxCostUsd, pricing, model health, fallback telemetry · 成本感知路由" />
              <Metric value="Commercial" label="API keys, plans, usage, billing, request IDs, idempotency, docs · 商业化 API 基础设施" />
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-black/10 bg-[#0f1115] p-3 text-white sm:p-4">
            <div className="flex flex-col gap-1 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold">Two commercial APIs · 两个商用 API</div>
              <div className="text-xs text-white/45">task + chat</div>
            </div>
            <div className="mt-4 text-xs font-semibold text-white/70">Task intelligence</div>
            <pre className="mt-2 max-w-full overflow-x-auto rounded-md text-[11px] leading-relaxed text-white/75 sm:text-xs">
              <code>{code}</code>
            </pre>
            <div className="mt-5 border-t border-white/10 pt-4 text-xs font-semibold text-white/70">Model gateway</div>
            <pre className="mt-2 max-w-full overflow-x-auto rounded-md text-[11px] leading-relaxed text-white/75 sm:text-xs">
              <code>{chatCode}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            Infrastructure scope · 基础设施范围
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
            One platform, two reasons to buy.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-black/60 md:text-base">
            A normal model gateway gives access to models. OneAI adds
            productized Task Intelligence, cost-aware routing, and an operator-ready SaaS console.
            普通模型网关解决模型调用，OneAI 进一步提供任务智能、成本路由和商业控制台。
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Feature
            title="OpenAI-compatible gateway · 兼容 OpenAI 的模型网关"
            desc="Use /v1/chat/completions, streaming, Bearer auth, provider:model ids, model catalog sync, and health checks."
          />
          <Feature
            title="Structured Task Intelligence · 结构化任务智能"
            desc="Business strategy, content engine, support brain, execution planning, and custom workflow intelligence. 支持商用任务和客户 workflow 定制。"
          />
          <Feature
            title="Commercial controls · 商业权限与计费"
            desc="Track requestId, tokens, cost, latency, model, provider, API key usage, plan gates, and billing state."
          />
        </div>
      </section>

      <section className="border-t border-black/10 bg-black/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-black/45">
                Moat
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
                Gateway compatibility plus OneAI Task Intelligence.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Standard Chat Completions · 标准模型网关",
                "Commercial Task Registry · 商用任务注册表",
                "Model health and catalog sync · 模型健康和目录同步",
                "Usage, cost, and plan policy · 用量、成本和套餐权限",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-black/10 bg-white p-4 text-sm font-semibold text-black/75">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
