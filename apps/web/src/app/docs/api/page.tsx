import Link from "next/link";
import { DocShell, DocSectionTitle } from "../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="API Basics"
      description="Authentication, endpoint families, request shape, and response conventions."
      pills={["x-api-key", "Bearer", "Idempotency-Key", "requestId", "usage"]}
      prev={{ href: "/docs/quickstart", label: "Quickstart" }}
      next={{ href: "/docs/reference/generate", label: "Generate Reference" }}
    >
      <DocSectionTitle title="Authentication" desc="Task endpoints use x-api-key. OpenAI-compatible endpoints also support Authorization: Bearer." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`-H "x-api-key: YOUR_KEY"
-H "Authorization: Bearer YOUR_KEY"
-H "Idempotency-Key: stable-customer-operation-id"`}</pre>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Endpoint families" desc="OneAI exposes both structured task intelligence and standard model gateway APIs." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["/v1/generate", "Structured task intelligence for workflows such as agent_plan and mission_os."],
            ["/v1/chat/completions", "OpenAI-compatible chat completions with model routing and usage metadata."],
            ["/v1/models", "Model catalog with provider, pricing, health, and capability metadata."],
          ].map(([name, desc]) => (
            <div key={name} className="rounded-lg border border-black/10 bg-white p-5">
              <code className="text-sm font-bold text-black">{name}</code>
              <p className="mt-3 text-sm leading-relaxed text-black/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Generate request format" desc="OneAI routes by task type and LLM policy." />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "type": "mission_os",
  "input": {
    "goal": "Launch a builder campaign",
    "audience": "builders, creators, founders"
  },
  "options": {
    "debug": true,
    "llm": { "mode": "cheap", "maxCostUsd": 0.03 }
  }
}`}</pre>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/docs/reference/generate" className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-white hover:bg-neutral-900">
            Generate endpoint →
          </Link>
          <Link href="/docs/reference/chat" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            Chat endpoint →
          </Link>
          <Link href="/docs/reference/errors" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            Errors →
          </Link>
        </div>
      </div>
    </DocShell>
  );
}
