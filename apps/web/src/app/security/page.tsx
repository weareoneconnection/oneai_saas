// apps/web/src/app/security/page.tsx
import Link from "next/link";

function Item({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="text-sm font-bold text-black">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-black/65">{desc}</div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <main className="bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-bold">
            OneAI API
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/docs" className="text-black/60 hover:text-black">
              Docs
            </Link>
            <Link href="/pricing" className="text-black/60 hover:text-black">
              Pricing
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
            Security
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Security posture for OneAI API customers.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            OneAI is designed as API infrastructure: hashed API keys, scoped
            access, usage logs, billing controls, request IDs, and model routing
            policies. It coordinates intelligence; OneClaw and bots handle
            execution.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Item
            title="API key hygiene"
            desc="Keys are stored hashed on the API side. Create separate keys per environment and revoke leaked keys immediately."
          />
          <Item
            title="Usage and cost controls"
            desc="Track provider, model, token usage, estimated cost, latency, and requestId for customer support."
          />
          <Item
            title="Provider policy"
            desc="Use provider/model allowlists, routing modes, fallbacks, and maxCostUsd to keep production calls controlled."
          />
          <Item
            title="Model readiness"
            desc="Model registry, catalog sync, pricing coverage, and one-model-at-a-time health checks help operators verify providers before customer traffic."
          />
          <Item
            title="Request observability"
            desc="Every commercial call can be tied back to requestId, provider, model, usage, latency, error state, and API key."
          />
          <Item
            title="Execution boundary"
            desc="OneAI returns plans, structured decisions, and coordination outputs. Direct execution stays outside the OneAI API boundary."
          />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-6">
            <div className="text-sm font-bold">Operational recommendation</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Keep secrets server-side, pass requests through your backend, set
              idempotency keys for retries, and monitor usage daily before
              increasing customer limits.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-6">
            <div className="text-sm font-bold">Production checklist</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black/60">
              <li>Separate prod and dev API keys</li>
              <li>Set monthly budgets and maxCostUsd</li>
              <li>Enable Stripe billing before paid traffic</li>
              <li>Review Usage for errors and cost spikes</li>
              <li>Health-check new providers before exposing them</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
