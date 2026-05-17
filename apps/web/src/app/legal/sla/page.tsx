import Link from "next/link";

const items = [
  ["Scope", "OneAI provides commercial API access for model routing, task intelligence, usage visibility, and Agent OS handoff records. External execution is performed by customer tools, OneClaw, OpenClaw, bots, or human operators."],
  ["Availability target", "Production customers may request a written SLA. Default public service availability is provided on a commercially reasonable-efforts basis until a signed enterprise agreement is active."],
  ["Support response", "Enterprise response targets can be defined by contract. Critical production incidents should include requestId, endpoint, provider, model, timestamp, and business impact."],
  ["Incident classification", "Critical incidents affect production API availability or customer billing/security data. High incidents degrade key workflows. Normal incidents include configuration, provider, or task-specific support."],
  ["Customer responsibilities", "Customers must keep API keys server-side, configure allowed usage, monitor spend, avoid abusive traffic, and provide accurate incident details for support."],
  ["Exclusions", "Upstream provider outages, customer key misconfiguration, customer network failures, third-party executor failures, and misuse outside approved plan policy are excluded unless otherwise agreed."],
  ["Credits", "Service credits, if any, require an enterprise agreement and are not automatically granted by the public self-serve plan."],
];

const operationalMetrics = [
  ["API health", "Health endpoint, request success, error rate, latency, and provider availability."],
  ["Model infrastructure", "Model catalog sync, provider configured state, pricing coverage, and per-model health checks."],
  ["Agent OS ledger", "Handoff contract creation, approval, proof callback, result callback, and proof review state."],
  ["Commercial logs", "API key events, customer usage, billing events, failed requests, and audit logs."],
];

export default function SlaPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/docs" className="text-sm font-semibold text-black/55 hover:text-black">Back to docs</Link>
        <div className="mt-8 text-xs font-bold uppercase tracking-wide text-black/45">Enterprise document</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Service Level Agreement Overview</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          This page is a commercial SLA overview for OneAI customers. A binding SLA requires a signed enterprise order form or master services agreement.
        </p>
        <div className="mt-8 space-y-4">
          {items.map(([title, desc]) => (
            <section key={title} className="rounded-lg border border-black/10 p-5">
              <h2 className="text-base font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-black/65">{desc}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-wide text-white/45">Operational measurement</div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">What OneAI can measure for SLA review</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {operationalMetrics.map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-white/15 bg-white/10 p-4">
                <div className="text-sm font-bold">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
