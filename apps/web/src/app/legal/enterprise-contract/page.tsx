import Link from "next/link";

const sections = [
  ["Agreement structure", "Enterprise customers can use a master services agreement, order form, DPA, SLA exhibit, and invoice schedule. The public pages are commercial summaries; signed documents control final terms."],
  ["Commercial scope", "The contract should define API surfaces, task tiers, model gateway access, Agent OS handoff support, support level, provider key policy, and usage limits."],
  ["Security and data", "The DPA should cover customer data, request logging, provider routing, deletion/export requests, subprocessors, and incident contact path."],
  ["Billing", "The order form should define plan, price, billing period, payment method, taxes, credits, cancellation, and overage or fair-use terms."],
  ["SLA", "The SLA exhibit should define availability target, support severity, response target, exclusions, and service-credit rules if offered."],
];

export default function EnterpriseContractPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/billing" className="text-sm font-semibold text-black/55 hover:text-black">
          Back to billing
        </Link>
        <div className="mt-8 text-xs font-bold uppercase tracking-wide text-black/45">Enterprise contract</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Enterprise Contract Pack</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          OneAI can support formal enterprise procurement with contract, DPA, SLA, invoice, and security exhibits.
          This page defines the contract pack customers should expect before production rollout.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="mailto:info@weareoneconnection.com?subject=OneAI%20Enterprise%20Contract"
            className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white"
          >
            Request contract pack
          </a>
          <Link href="/legal/dpa" className="rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-black">
            Review DPA
          </Link>
          <Link href="/legal/sla" className="rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-black">
            Review SLA
          </Link>
        </div>
        <div className="mt-8 space-y-4">
          {sections.map(([title, desc]) => (
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
