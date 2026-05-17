import Link from "next/link";
import { DocShell, DocSectionTitle } from "../../_components/DocShell";

const checklist = [
  {
    title: "Keep OneAI API keys server-side",
    desc: "Call OneAI from your backend. Do not expose customer API keys or upstream provider keys in browser code, mobile apps, or public repos.",
  },
  {
    title: "Use Idempotency-Key for retries",
    desc: "For operations that may be retried, send a stable Idempotency-Key so the same customer action does not create duplicated work.",
  },
  {
    title: "Set maxCostUsd",
    desc: "Attach maxCostUsd to production requests to prevent accidental expensive model usage.",
  },
  {
    title: "Start with cheap or balanced mode",
    desc: "Use cheap for high-volume simple tasks and balanced for business workflows. Reserve premium and explicit model selection for paid plans.",
  },
  {
    title: "Track requestId",
    desc: "Store requestId with your customer event so support teams can trace provider, model, usage, latency, and error state.",
  },
  {
    title: "Monitor usage daily",
    desc: "Review request count, token usage, estimated cost, errors, and expensive model usage before raising limits.",
  },
  {
    title: "Separate environments",
    desc: "Use different API keys for development, staging, and production. Revoke leaked or unused keys quickly.",
  },
  {
    title: "Confirm execution boundary",
    desc: "OneAI should produce intelligence and plans. Execution should remain with OneClaw, bots, your backend, or human review.",
  },
];

const launchTests = [
  ["Health", "GET /health returns ok"],
  ["Tasks", "GET /v1/tasks shows only public commercial tasks"],
  ["Models", "GET /v1/models or /v1/generate/models returns configured providers"],
  ["Task call", "POST /v1/generate succeeds with a Free task"],
  ["Gateway call", "POST /v1/chat/completions succeeds with a chosen model"],
  ["Usage", "Usage page shows requests, tokens, and estimated cost after traffic"],
  ["Cost", "OpenRouter and DeepSeek calls return estimatedCostUSD > 0 when pricing exists"],
  ["Auth", "Unauthenticated web users cannot create keys or view usage"],
];

export default function ProductionChecklistPage() {
  return (
    <DocShell
      title="Production Checklist"
      description="A practical launch checklist for teams using OneAI in a real SaaS or commercial API product."
      pills={["Security", "Cost control", "Usage", "Launch readiness", "生产检查"]}
      prev={{ href: "/docs/product-guide", label: "Product Guide" }}
      next={{ href: "/docs/reference/generate", label: "Generate Reference" }}
    >
      <DocSectionTitle
        title="Before sending customer traffic"
        desc="Use this checklist to make sure OneAI is configured as production infrastructure, not a local experiment."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {checklist.map((item, index) => (
          <div key={item.title} className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-bold text-white">
                {index + 1}
              </div>
              <div>
                <div className="text-sm font-extrabold text-black">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/65">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <DocSectionTitle
          title="Recommended production request"
          desc="This pattern gives you route control, cost control, and retry safety."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-[#0f1115] p-5 text-white">
          <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-white/75">
            <code>{`curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_ONEAI_API_KEY" \\
  -H "Idempotency-Key: customer-action-123" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Launch a paid AI feature in 30 days",
      "audience": "SaaS builders",
      "constraints": ["Keep it practical", "Prioritize validation"]
    },
    "options": {
      "llm": {
        "mode": "balanced",
        "maxCostUsd": 0.03
      }
    }
  }'`}</code>
          </pre>
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="Launch verification"
          desc="Run these checks after each deployment or environment-variable change."
        />
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Expected result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {launchTests.map(([area, expected]) => (
                <tr key={area}>
                  <td className="px-4 py-4 font-bold text-black">{area}</td>
                  <td className="px-4 py-4 leading-relaxed text-black/65">{expected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-black/10 bg-black/[0.02] p-6">
        <div className="text-sm font-extrabold text-black">Commercial recommendation</div>
        <p className="mt-2 text-sm leading-relaxed text-black/65">
          Start new customers on Free or a manually activated Pro plan, watch real
          usage for a few days, then raise limits. For high-value customers, design
          a dedicated Task Intelligence workflow instead of selling only raw model calls.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/task-intelligence" className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-white hover:bg-neutral-900">
            Task Intelligence
          </Link>
          <Link href="/pricing" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            Pricing
          </Link>
        </div>
      </section>
    </DocShell>
  );
}
