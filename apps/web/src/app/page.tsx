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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-sm font-bold">
            OA
          </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">OneAI API</div>
            <div className="text-xs text-black/50">全模型 AI 智能大脑 · Full-model AI brain</div>
            </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-black/65 md:flex">
          <Link href="/docs" className="hover:text-black">
            文档 Docs
          </Link>
          <Link href="/pricing" className="hover:text-black">
            价格 Pricing
          </Link>
          <Link href="/security" className="hover:text-black">
            安全 Security
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03] sm:inline-flex"
          >
            控制台 Console
          </Link>
          <Link
            href="/keys"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
          >
            获取 API Key
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-black/45">
              OneAI 只做统一智能协调大脑，执行交给 OneClaw 和 Bot。
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              全模型调用基础设施，内置 Task Intelligence 智能任务大脑。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/65 md:text-lg">
              OneAI 面向中国开发者、SaaS 团队和创业者，提供一个统一 API：
              模型路由、结构化任务、成本控制、流式对话、模型健康检查、
              用量统计和商业计费。OneAI 负责智能协调，外部系统负责执行。
            </p>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-black md:text-lg">
              We provide customized Task Intelligence for customer needs,
              turning OneAI into the AI brain behind their applications.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/55 md:text-base">
              为客户按业务需求定制 Task Intelligence，让 OneAI 成为应用背后的
              AI 智能大脑，而不是只做简单模型中转。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-neutral-900"
              >
                快速开始 Quickstart
              </Link>
              <Link
                href="/playground"
                className="inline-flex items-center justify-center rounded-lg border border-black/15 px-5 py-3 text-sm font-bold hover:bg-black/[0.03]"
              >
                在线测试 Playground
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <Metric value="全模型" label="OpenAI GPT-5, Anthropic, Gemini, xAI, DeepSeek, Qwen, Moonshot, Doubao, OpenRouter" />
              <Metric value="省成本" label="模式路由、maxCostUsd、价格覆盖、模型健康检查、fallback 追踪" />
              <Metric value="可商用" label="API keys、套餐、用量、计费、requestId、幂等、文档" />
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-black/10 bg-[#0f1115] p-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-sm font-semibold">两个商用 API · Two commercial APIs</div>
              <div className="text-xs text-white/45">task + chat</div>
            </div>
            <div className="mt-4 text-xs font-semibold text-white/70">Task intelligence</div>
            <pre className="mt-2 overflow-auto text-xs leading-relaxed text-white/75">
              <code>{code}</code>
            </pre>
            <div className="mt-5 border-t border-white/10 pt-4 text-xs font-semibold text-white/70">Model gateway</div>
            <pre className="mt-2 overflow-auto text-xs leading-relaxed text-white/75">
              <code>{chatCode}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            基础设施范围 · Infrastructure scope
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
            一个 OneAI，两种购买理由。
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-black/60 md:text-base">
            普通模型网关只解决“调用哪个模型”。OneAI 在模型网关之上，
            增加产品化 Task Intelligence、成本感知路由和可运营的 SaaS 控制台。
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Feature
            title="兼容 OpenAI 的模型网关"
            desc="Use /v1/chat/completions, streaming, Bearer auth, provider:model ids, model catalog sync, and health checks."
          />
          <Feature
            title="结构化 Task Intelligence"
            desc="对外提供 business_strategy、content_engine、support_brain 等商用任务，也支持按客户 workflow 定制智能大脑。"
          />
          <Feature
            title="商业化权限与计费控制"
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
                模型网关兼容性，加上 OneAI 的任务智能。
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "标准 Chat Completions，方便迁移",
                "商用 Task Registry，输出结构化业务结果",
                "模型健康检查和目录同步，方便运营",
                "用量、成本和套餐权限，支撑 API 收入",
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
