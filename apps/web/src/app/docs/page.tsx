// apps/web/src/app/docs/page.tsx
import Link from "next/link";

const quick = [
  { title: "Quickstart", desc: "Make the first /v1/generate call.", href: "/docs/quickstart" },
  { title: "API Basics", desc: "Auth, request shape, response metadata.", href: "/docs/api" },
  { title: "Generate Reference", desc: "Task input, options, usage, trace.", href: "/docs/reference/generate" },
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
            Execution stays with OneClaw and bots; the API returns plans,
            missions, chat decisions, usage metadata, and request IDs.
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
            <code>{`curl http://localhost:4000/v1/generate \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ONEAI_API_KEY" \\
  -H "Idempotency-Key: launch-plan-001" \\
  -d '{
    "type": "agent_plan",
    "input": { "goal": "Create a launch plan for OneAI API" },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.02 } }
  }'`}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}
