import Link from "next/link";

const items = [
  ["Account data", "OneAI may store user email, organization membership, API key metadata, billing state, and usage events to provide the console and API service."],
  ["Request data", "OneAI may process request payloads, outputs, model metadata, token usage, latency, errors, and Agent OS execution records for service delivery and support."],
  ["Secrets", "Customer API keys are stored as hashes. Upstream provider keys are server-side infrastructure secrets and are not returned to customers."],
  ["Operational logs", "Logs support abuse prevention, billing, debugging, reliability, and customer support."],
  ["Customer requests", "Customers may request support for account review, billing records, data export, or deletion according to plan and legal requirements."],
];

export default function PrivacyPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/security" className="text-sm font-semibold text-black/55 hover:text-black">Back to security</Link>
        <div className="mt-8 text-xs font-bold uppercase tracking-wide text-black/45">Legal overview</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy and Data Handling Overview</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          OneAI is designed to make model routing, usage, and operational ownership visible for production AI customers.
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
