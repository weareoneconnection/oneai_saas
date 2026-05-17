import Link from "next/link";

const trustAreas = [
  {
    title: "Security",
    desc: "Provider keys stay server-side, customer API keys are stored as hashes, and production access should go through customer backends.",
    href: "/security",
  },
  {
    title: "SLA",
    desc: "Enterprise availability, support response, incident classification, measurement, exclusions, and service-credit boundaries.",
    href: "/legal/sla",
  },
  {
    title: "DPA",
    desc: "Customer data categories, subprocessors, provider routing, deletion/export path, and enterprise data-processing terms.",
    href: "/legal/dpa",
  },
  {
    title: "Privacy",
    desc: "Account data, request data, operational logs, secrets, customer controls, and support requests.",
    href: "/legal/privacy",
  },
  {
    title: "Execution Boundary",
    desc: "OneAI plans, routes, records, approves, and verifies. OneClaw, OpenClaw, bots, customer agents, or humans execute.",
    href: "/docs/reference/agent-os",
  },
  {
    title: "Enterprise Contract",
    desc: "Order form, MSA, DPA, SLA, invoices, support expectations, and enterprise procurement package.",
    href: "/legal/enterprise-contract",
  },
];

const dataFlow = [
  ["Customer backend", "Sends API requests with a OneAI API key. Browser-side secrets are not recommended."],
  ["OneAI API", "Authenticates, applies policy, routes models/tasks, logs metadata, and records usage/cost."],
  ["Model provider", "Processes selected model requests according to the provider and model configuration."],
  ["Agent OS ledger", "Stores handoff contracts, approval state, proof callbacks, result callbacks, and review state."],
  ["Operator console", "Shows customers, keys, usage, failures, audit events, billing state, and execution records."],
];

const controls = [
  ["Key control", "Hashed customer keys, revocation, prefixes, allowed IPs, scopes, rate limits, and budgets."],
  ["Routing control", "Provider/model selection, allowlists, fallback policy, cost guards, and model health checks."],
  ["Cost control", "Token usage, estimated model cost, margin visibility, maxCostUsd, and monthly plan limits."],
  ["Audit control", "Login, key creation, billing changes, failed requests, Agent OS proof/result, and operator review events."],
  ["Execution control", "Approval policy, proof policy, result ledger, and no direct external action inside OneAI."],
  ["Contract control", "SLA, DPA, privacy, invoices, terms, enterprise order forms, and manual sales path."],
];

const enterprisePacket = [
  ["Security overview", "/security"],
  ["SLA overview", "/legal/sla"],
  ["DPA overview", "/legal/dpa"],
  ["Privacy / data handling", "/legal/privacy"],
  ["Execution boundary", "/docs/reference/agent-os"],
  ["Agent OS protocol versioning", "/docs/reference/agent-os/versioning"],
  ["Invoices", "/legal/invoices"],
  ["Enterprise contract pack", "/legal/enterprise-contract"],
  ["Terms", "/legal/terms"],
];

export default function TrustCenterPage() {
  return (
    <main className="bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-bold">OneAI API</Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/docs" className="text-black/60 hover:text-black">Docs</Link>
            <Link href="/pricing" className="text-black/60 hover:text-black">Pricing</Link>
            <Link href="/dashboard" className="text-black/60 hover:text-black">Console</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">Trust Center</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Enterprise trust for model routing, Task Intelligence, and Agent OS.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            Customers buying an AI gateway or intelligent coordination brain need
            more than model access. They need data boundaries, cost visibility,
            auditability, legal documents, and a clear separation between
            intelligence and execution.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {trustAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-base font-bold text-black">{area.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{area.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-black bg-black p-6 text-white">
          <div className="text-sm font-extrabold">Primary trust statement</div>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/70">
            OneAI is not positioned as a blind AI relay. The commercial product is
            designed to expose request ownership, provider/model routing, usage,
            estimated cost, failures, audit events, and Agent OS execution
            records so customers can operate AI as infrastructure.
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black/[0.02] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-black/45">Enterprise packet</div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Send this package to procurement.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/60">
                Use this trust package when an enterprise customer asks how OneAI
                handles security, data, execution boundaries, invoices, legal
                review, and Agent OS protocol integration.
              </p>
            </div>
            <a
              href="mailto:info@weareoneconnection.com?subject=OneAI%20Enterprise%20Trust%20Packet"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-neutral-900"
            >
              Contact enterprise
            </a>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {enterprisePacket.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-bold text-black transition hover:border-black/25 hover:bg-black/[0.02]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Data flow overview</h2>
          <div className="mt-5 overflow-x-auto rounded-lg border border-black/10">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                <tr>
                  <th className="px-4 py-3">Layer</th>
                  <th className="px-4 py-3">Responsibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {dataFlow.map(([layer, responsibility]) => (
                  <tr key={layer}>
                    <td className="px-4 py-4 font-bold text-black">{layer}</td>
                    <td className="px-4 py-4 leading-relaxed text-black/65">{responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Control checklist</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {controls.map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
                <div className="text-sm font-bold text-black">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
