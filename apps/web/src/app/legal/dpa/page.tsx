import Link from "next/link";

const items = [
  ["Processor role", "For customer API traffic, OneAI acts as infrastructure that routes, records, and governs requests according to customer configuration."],
  ["Customer data", "Customer inputs, outputs, request metadata, usage, errors, API key ownership, and Agent OS execution records may be processed to deliver the service."],
  ["Provider routing", "When customers select an upstream provider, that provider may process request data according to its own terms and data handling policies."],
  ["Security controls", "Provider keys remain server-side, customer API keys are stored hashed, and production requests can be traced by requestId, API key, model, usage, and cost."],
  ["Subprocessors", "Upstream model providers, database, hosting, payment, email/auth, and monitoring vendors may act as subprocessors depending on customer configuration and deployment."],
  ["International transfer", "Customer data may be routed through infrastructure regions and upstream providers selected for the service. Enterprise contracts may define region and provider restrictions."],
  ["Deletion and export", "Enterprise customers may request data export or deletion workflows. Self-serve controls can be expanded as part of enterprise onboarding."],
];

const dataCategories = [
  ["Identity", "User email, organization membership, role, login provider, and account state."],
  ["API metadata", "API key prefix/hash metadata, scopes, allowed IPs, budgets, status, and last-used timestamps."],
  ["Request data", "Input/output payloads where logging is enabled, task type, model, provider, usage, latency, errors, and requestId."],
  ["Agent OS records", "Agent plans, handoff contracts, approvals, proof artifacts, execution result metadata, and proof review state."],
  ["Billing data", "Plan, status, billing identifiers, invoice/payment references, usage totals, and commercial policy overrides."],
];

export default function DpaPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/docs" className="text-sm font-semibold text-black/55 hover:text-black">Back to docs</Link>
        <div className="mt-8 text-xs font-bold uppercase tracking-wide text-black/45">Enterprise document</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Data Processing Agreement Overview</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          This overview explains how OneAI treats customer API data. A formal DPA can be attached to enterprise contracts.
        </p>
        <div className="mt-8 space-y-4">
          {items.map(([title, desc]) => (
            <section key={title} className="rounded-lg border border-black/10 p-5">
              <h2 className="text-base font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-black/65">{desc}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black/[0.02] p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">Data categories</div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">What may be processed</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dataCategories.map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="text-sm font-bold text-black">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
