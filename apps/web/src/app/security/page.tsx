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

const riskRows = [
  ["Hidden model routing", "OneAI returns provider, model, requestId, usage, latency, fallback state, and estimated cost."],
  ["Cost drift", "Plans, maxCostUsd, rate limits, monthly request limits, and usage dashboards keep spend visible."],
  ["Leaked keys", "Customer API keys are created once, stored hashed, and can be revoked without exposing upstream provider secrets."],
  ["Unsafe execution", "OneAI generates intelligence and plans. Execution belongs to OneClaw, bots, customer tools, or human operators."],
];

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
            Trust Center
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Trust controls for commercial AI infrastructure.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            OneAI is designed for teams that need to sell, monitor, and govern
            AI features. The system keeps provider access server-side, exposes
            request-level usage and cost, and separates intelligence from
            execution.
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-black bg-black p-6 text-white">
          <div className="text-sm font-extrabold">Core principle</div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
            OneAI should not behave like a blind relay. Every production call
            should be explainable by requestId, provider, model, token usage,
            estimated cost, route policy, and customer/API key ownership.
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

        <div className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">AI relay risks OneAI is built to reduce</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              The main customer concern is not only whether a model responds.
              It is whether routing, spend, data boundaries, and operational
              ownership are visible enough to trust in production.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                <tr>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">OneAI control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {riskRows.map(([risk, control]) => (
                  <tr key={risk}>
                    <td className="px-4 py-4 font-bold text-black">{risk}</td>
                    <td className="px-4 py-4 leading-relaxed text-black/65">{control}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
