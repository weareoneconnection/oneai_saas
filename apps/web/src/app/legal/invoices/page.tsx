import Link from "next/link";

const items = [
  ["Self-serve invoices", "When Stripe checkout is enabled, paid customers can access invoices and payment methods through the customer billing portal."],
  ["Manual invoices", "Enterprise or manual-sales customers can request invoice-based billing through Contact Sales."],
  ["Billing evidence", "OneAI records plan status, billing-sensitive events, monthly request counts, token usage, and estimated model cost for operational review."],
  ["Plan changes", "Plan upgrades, cancellations, webhook updates, and portal sessions should appear in the billing audit trail when configured."],
  ["Required details", "For invoice support, include account email, organization name, plan, billing period, and any relevant Stripe customer or subscription ID."],
];

export default function InvoicesPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/billing" className="text-sm font-semibold text-black/55 hover:text-black">Back to billing</Link>
        <div className="mt-8 text-xs font-bold uppercase tracking-wide text-black/45">Enterprise document</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Invoices and Billing Guide</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          OneAI supports Stripe-based subscriptions and manual enterprise billing paths.
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
