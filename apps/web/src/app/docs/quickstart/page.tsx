import Link from "next/link";
import { DocShell, DocSectionTitle } from "../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Quickstart"
      description="Create a key, run a free Task Intelligence request, check usage, then upgrade when production traffic needs paid workflows."
      pills={["Free task test", "POST /v1/generate", "Usage + cost controls"]}
      prev={{ href: "/docs", label: "Docs Home" }}
      next={{ href: "/docs/api", label: "API Basics" }}
    >
      <DocSectionTitle
        title="1) Create a server-side API key"
        desc="Create a key in Console. Keep it on your server and pass it via x-api-key."
      />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-black/80">{`curl -X POST https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Idempotency-Key: first-free-test-001" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Validate OneAI API for my product",
      "audience": "SaaS builders",
      "constraints": ["Keep it practical", "Keep it short"]
    },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.03 } }
  }'`}</pre>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/keys" className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-white hover:bg-neutral-900">
            Get API key →
          </Link>
          <Link href="/docs/reference/generate" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            Generate reference →
          </Link>
          <Link href="/docs/reference/chat" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            Chat reference →
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="2) Read the response"
          desc="The API returns structured data plus requestId, usage, cost, and trace metadata when debug is enabled."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-extrabold text-black">Success</div>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-black/80">{`{
  "success": true,
  "requestId": "req_...",
  "data": { ...schema-valid output... },
  "usage": { "provider": "openai", "model": "gpt-4o-mini" },
  "attempts": 1
}`}</pre>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-extrabold text-black">Failure</div>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-black/80">{`{
  "success": false,
  "error": "Failed to produce valid structured output",
  "details": { "code":"VALIDATION_FAILED", "issues":[...] }
}`}</pre>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="3) Check usage before scaling"
          desc="After the first request, confirm requests, tokens, model cost, latency, and failures in Usage."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Keys", "Create, rotate, revoke, and budget API keys.", "/keys"],
            ["Playground", "Test free and paid Task Intelligence examples.", "/playground"],
            ["Usage", "Track request volume, tokens, cost, latency, and failures.", "/usage"],
          ].map(([title, desc, href]) => (
            <Link key={title} href={href} className="rounded-lg border border-black/10 bg-black/[0.02] p-5 hover:bg-black/[0.04]">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="4) Use the model gateway"
          desc="For OpenAI-compatible integrations, call /v1/chat/completions with Authorization: Bearer."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "messages": [
      { "role": "user", "content": "Explain OneAI SaaS in one sentence." }
    ],
    "max_completion_tokens": 300
  }'`}</pre>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
        <div className="text-lg font-extrabold">Upgrade when the use case is real</div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          Free is for validation. Pro unlocks customer-facing support, market,
          decision, and campaign intelligence. Team unlocks custom task contracts,
          debug traces, model controls, and higher operating limits.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90">
            Compare plans
          </Link>
          <Link href="/docs/guides/production-checklist" className="rounded-lg border border-white/15 px-5 py-2 text-sm font-bold text-white hover:bg-white/10">
            Production checklist
          </Link>
        </div>
      </div>
    </DocShell>
  );
}
