import Link from "next/link";

const items = [
  ["Processor role", "For customer API traffic, OneAI acts as infrastructure that routes, records, and governs requests according to customer configuration."],
  ["Customer data", "Customer inputs, outputs, request metadata, usage, errors, API key ownership, and Agent OS execution records may be processed to deliver the service."],
  ["Provider routing", "When customers select an upstream provider, that provider may process request data according to its own terms and data handling policies."],
  ["Security controls", "Provider keys remain server-side, customer API keys are stored hashed, and production requests can be traced by requestId, API key, model, usage, and cost."],
  ["Deletion and export", "Enterprise customers may request data export or deletion workflows. Self-serve controls can be expanded as part of enterprise onboarding."],
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
      </section>
    </main>
  );
}
