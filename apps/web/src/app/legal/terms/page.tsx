import Link from "next/link";

const items = [
  ["Service boundary", "OneAI provides API access, model routing, task intelligence, usage visibility, billing controls, and Agent OS handoff records. OneAI does not execute external customer actions."],
  ["Acceptable use", "Customers are responsible for using OneAI and upstream model providers lawfully, safely, and according to applicable provider policies."],
  ["Customer keys", "Customer API keys must be kept server-side where possible and must not be shared publicly. Leaked keys should be revoked immediately."],
  ["Outputs", "AI outputs may be incomplete or incorrect. Customers are responsible for reviewing outputs before relying on them in production workflows."],
  ["Plan limits", "Access to tasks, models, debug traces, model registry, Agent OS endpoints, and support levels may be limited by plan policy."],
];

export default function TermsPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/docs" className="text-sm font-semibold text-black/55 hover:text-black">Back to docs</Link>
        <div className="mt-8 text-xs font-bold uppercase tracking-wide text-black/45">Legal overview</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Terms of Service Overview</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          This page summarizes the intended commercial service terms. Final legal terms should be reviewed before large-scale enterprise deployment.
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
