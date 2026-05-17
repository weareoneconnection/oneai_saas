// apps/web/src/app/docs/page.tsx
import Link from "next/link";

const quick = [
  { title: "产品使用说明", desc: "中文版产品定位、API 能力、任务列表、成本控制和商业使用方式。", href: "/docs/product-guide" },
  { title: "Use Cases", desc: "Customer-facing scenarios for strategy, content, support, market intelligence, and custom tasks.", href: "/use-cases" },
  { title: "Production Checklist", desc: "Security, cost controls, idempotency, usage, and launch verification.", href: "/docs/guides/production-checklist" },
  { title: "Task Examples", desc: "Copyable request and output examples for commercial tasks.", href: "/docs/examples" },
  { title: "Agent OS Preview", desc: "Capabilities, agent plans, handoff preview, and context preview without execution.", href: "/docs/reference/agent-os" },
  { title: "Quickstart", desc: "Make the first /v1/generate call.", href: "/docs/quickstart" },
  { title: "API Basics", desc: "Auth, request shape, response metadata.", href: "/docs/api" },
  { title: "Generate Reference", desc: "Task input, options, usage, trace.", href: "/docs/reference/generate" },
  { title: "Chat Completions", desc: "OpenAI-compatible model gateway calls.", href: "/docs/reference/chat" },
  { title: "Messages", desc: "Anthropic-style Messages API through OneAI model routing.", href: "/docs/reference/messages" },
  { title: "Models", desc: "Catalog, health checks, pricing coverage.", href: "/docs/reference/models" },
  { title: "Errors", desc: "Retryable failures and customer-safe errors.", href: "/docs/reference/errors" },
  { title: "Rate Limits", desc: "API key policy and production limits.", href: "/docs/reference/rate-limits" },
  { title: "Schemas", desc: "Structured output contracts.", href: "/docs/reference/schemas" },
];

export default function DocsHomePage() {
  return (
    <main className="bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-bold">
            OneAI API
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/pricing" className="text-black/60 hover:text-black">
              Pricing
            </Link>
            <Link href="/security" className="text-black/60 hover:text-black">
              Security
            </Link>
            <Link href="/dashboard" className="text-black/60 hover:text-black">
              Console
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            Documentation
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Build on the OneAI commercial API.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            OneAI is the model-routing and structured-intelligence layer.
            Use /v1/generate for task intelligence, /v1/chat/completions
            for OpenAI-compatible gateway calls, /v1/messages for
            Anthropic-style gateway calls, and /v1/models for catalog discovery.
          </p>
          <p className="mt-3 text-base leading-relaxed text-black/65">
            中文用户可以先阅读产品使用说明，了解 OneAI 如何作为统一全模型调用、
            成本控制和 Task Intelligence 的 AI 智能大脑基础设施。
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {quick.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-black/10 p-5 hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-sm font-bold">{item.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-[#0f1115] p-5 text-white">
          <div className="text-sm font-semibold">Production request</div>
          <pre className="mt-4 overflow-auto text-xs leading-relaxed text-white/75">
            <code>{`curl https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ONEAI_API_KEY" \\
  -H "Idempotency-Key: business-strategy-001" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Create a launch plan for OneAI API",
      "audience": "SaaS builders",
      "constraints": ["Keep it practical"]
    },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.03 } }
  }'`}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}
