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

const trustPillars = [
  ["Security", "Provider secrets stay server-side, customer keys are hashed, and production access should happen through customer backends."],
  ["Transparency", "Every commercial call is designed to expose requestId, provider, model, tokens, latency, cost, fallback, and ownership context."],
  ["Data boundary", "OneAI coordinates intelligence and records operational metadata. External executors perform actions outside the OneAI boundary."],
  ["Enterprise readiness", "SLA, DPA, Privacy, invoices, terms, audit logs, and team permissions are documented for procurement review."],
];

const commitments = [
  ["Provider keys stay server-side", "Customer-facing API keys never expose OpenAI, DeepSeek, OpenRouter, or other upstream provider secrets."],
  ["No blind relay positioning", "Every production response is designed to include ownership metadata: requestId, provider, model, usage, latency, cost, and fallback state where available."],
  ["No execution inside OneAI", "OneAI plans, coordinates, records, and verifies. External systems such as OneClaw, OpenClaw, bots, tools, or humans execute actions."],
  ["Customer keys are hashed", "OneAI stores customer API key hashes, not plaintext keys. Plaintext keys are shown once at creation."],
  ["Usage is auditable", "Requests, failed requests, API key events, billing events, and Agent OS execution records are logged for operational review."],
  ["Proof can be reviewed", "Agent OS proof can be marked verified, needs_review, or rejected by an operator before being trusted as completed evidence."],
];

const dataControls = [
  ["Payload storage", "Request input/output can be logged for debugging and support where enabled by product policy."],
  ["Deletion path", "Customer data deletion can be handled by operator request while self-serve deletion controls are expanded."],
  ["Training boundary", "OneAI does not position customer API traffic as training data for OneAI-owned models. Upstream provider handling depends on the provider selected and its terms."],
  ["Retention", "Operational logs are retained for billing, abuse prevention, debugging, and customer support until a formal retention window is configured."],
];

const executionBoundaryRows = [
  ["OneAI may do", "Plan, route, generate structured intelligence, create handoff contracts, record approvals, store proof/result metadata, and expose audit trails."],
  ["OneAI will not do", "Click buttons, log into customer tools, spend funds, post to social accounts, deploy code, move assets, or call external execution systems as the actor."],
  ["Executors do", "OneClaw, OpenClaw, bots, customer agents, or humans perform external actions and call back with proof and results."],
  ["Operators verify", "Admins review proof, failures, customer usage, cost, and audit events before trusting an execution as complete."],
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
            <Link href="/trust-center" className="text-black/60 hover:text-black">
              Trust Center
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

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {trustPillars.map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
            </div>
          ))}
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

        <div className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">Trust commitments</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              These are the operational controls a customer should expect before
              running production AI traffic through a model gateway or Task
              Intelligence API.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {commitments.map(([title, desc]) => (
              <Item key={title} title={title} desc={desc} />
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-white p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            Data handling
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            Clear boundaries for customer data and provider routing.
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {dataControls.map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                <div className="text-sm font-bold text-black">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">Execution Boundary</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              OneAI is the intelligent coordination brain. Execution remains
              intentionally outside OneAI so customers can preserve approval,
              accountability, and operational control.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
            <table className="min-w-[780px] w-full text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                <tr>
                  <th className="px-4 py-3">Boundary</th>
                  <th className="px-4 py-3">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {executionBoundaryRows.map(([title, desc]) => (
                  <tr key={title}>
                    <td className="px-4 py-4 font-bold text-black">{title}</td>
                    <td className="px-4 py-4 leading-relaxed text-black/65">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-wide text-white/45">
            Enterprise documents
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            Procurement-ready trust package.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
            Customers evaluating OneAI for production can review the service
            boundary, SLA overview, DPA overview, invoice path, terms, and
            privacy/data handling notes before moving into an enterprise
            contract.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Contract", "/legal/enterprise-contract"],
              ["SLA", "/legal/sla"],
              ["DPA", "/legal/dpa"],
              ["Invoices", "/legal/invoices"],
              ["Terms", "/legal/terms"],
              ["Privacy", "/legal/privacy"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                {label}
              </Link>
            ))}
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
