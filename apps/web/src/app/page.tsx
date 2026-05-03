// apps/web/src/app/page.tsx
import Link from "next/link";

const code = `curl https://api.oneai.dev/v1/generate \\
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
            <div className="text-xs text-black/50">Full-model AI brain</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-black/65 md:flex">
          <Link href="/docs" className="hover:text-black">
            Docs
          </Link>
          <Link href="/pricing" className="hover:text-black">
            Pricing
          </Link>
          <Link href="/security" className="hover:text-black">
            Security
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/[0.03] sm:inline-flex"
          >
            Console
          </Link>
          <Link
            href="/keys"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
          >
            Get API Key
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
              OneAI only coordinates intelligence. OneClaw and bots execute.
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              OneAI API is the full-model intelligent brain for production AI.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/65 md:text-lg">
              Route tasks across models, enforce cost limits, return structured
              outputs, record usage, and expose commercial API controls without
              turning OneAI into an execution layer.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-neutral-900"
              >
                Read Quickstart
              </Link>
              <Link
                href="/playground"
                className="inline-flex items-center justify-center rounded-lg border border-black/15 px-5 py-3 text-sm font-bold hover:bg-black/[0.03]"
              >
                Open Playground
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <Metric value="Multi-model" label="OpenAI, DeepSeek, Groq, Qwen, Moonshot, Doubao, OpenRouter, custom" />
              <Metric value="Cost-aware" label="Mode routing, max cost guard, fallback, pricing telemetry" />
              <Metric value="Commercial" label="API keys, usage, billing, request IDs, idempotency" />
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-black/10 bg-[#0f1115] p-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-sm font-semibold">Generate API</div>
              <div className="text-xs text-white/45">structured JSON</div>
            </div>
            <pre className="mt-4 overflow-auto text-xs leading-relaxed text-white/75">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            Infrastructure scope
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
            Keep OneAI as the brain. Make the brain excellent.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-black/60 md:text-base">
            The web now sells the API, documents the platform, and gives
            customers a console for keys, usage, billing, tasks, and models.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Feature
            title="Unified model routing"
            desc="Choose cheap, fast, balanced, premium, or explicit provider/model per request."
          />
          <Feature
            title="Structured task registry"
            desc="Expose task types such as agent_plan, mission_os, and waoc_chat as productized API capabilities."
          />
          <Feature
            title="Usage and billing foundation"
            desc="Track requestId, tokens, estimated cost, latency, model, provider, and idempotency behavior."
          />
        </div>
      </section>
    </main>
  );
}
