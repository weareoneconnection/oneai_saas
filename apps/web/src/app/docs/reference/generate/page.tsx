import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Generate"
      description="POST /v1/generate — the primary structured intelligence endpoint."
      pills={["POST /v1/generate", "task type", "LLM policy", "usage metadata"]}
      prev={{ href: "/docs/api", label: "API Basics" }}
      next={{ href: "/docs/reference/schemas", label: "Schemas" }}
    >
      <DocSectionTitle title="Request" desc="Route by task type and choose a model mode or explicit provider/model." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "type": "agent_plan",
  "input": { "goal": "Create a launch plan for OneAI API" },
  "options": {
    "debug": true,
    "llm": {
      "mode": "cheap",
      "maxCostUsd": 0.02
    }
  }
}`}</pre>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Response metadata" desc="Commercial callers should store requestId and usage for support and billing." />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "success": true,
  "requestId": "req_...",
  "data": { "...": "..." },
  "usage": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "totalTokens": 699,
    "estimatedCostUsd": 0.00027
  }
}`}</pre>
        </div>
      </div>
    </DocShell>
  );
}
