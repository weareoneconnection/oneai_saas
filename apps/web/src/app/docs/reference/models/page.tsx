import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Models"
      description="GET /v1/models — discover model ids, capabilities, readiness, pricing coverage, and catalog sync status."
      pills={["GET /v1/models", "POST /v1/models/sync", "POST /v1/models/health"]}
      prev={{ href: "/docs/reference/chat", label: "Chat Completions" }}
      next={{ href: "/docs/reference/schemas", label: "Schemas" }}
    >
      <DocSectionTitle title="List models" desc="Use this endpoint to discover provider:model ids for the chat gateway." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/models \\
  -H "Authorization: Bearer YOUR_KEY"`}</pre>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Model object" desc="Commercial fields help customers understand whether a model is callable, priced, and operational." />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "id": "openai:gpt-5.2",
  "object": "model",
  "provider": "openai",
  "model": "gpt-5.2",
  "modes": ["balanced", "premium", "auto"],
  "contextTokens": 400000,
  "supportsJson": true,
  "supportsTools": true,
  "configured": true,
  "available": true,
  "hasPricing": true,
  "health": {
    "ok": true,
    "testedAt": "2026-05-04T03:55:06.113Z",
    "latencyMs": 1549
  }
}`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Catalog sync and health checks" desc="Admin keys can sync provider catalogs and run lightweight health checks one model at a time." />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-white p-6">
            <div className="text-sm font-bold">Sync catalog</div>
            <pre className="mt-4 whitespace-pre-wrap text-xs text-black/80">{`curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/models/sync \\
  -H "Authorization: Bearer ADMIN_KEY"`}</pre>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-6">
            <div className="text-sm font-bold">Check health</div>
            <pre className="mt-4 whitespace-pre-wrap text-xs text-black/80">{`curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/models/health \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ADMIN_KEY" \\
  -d '{"provider":"openai","model":"gpt-5.2"}'`}</pre>
          </div>
        </div>
      </div>
    </DocShell>
  );
}
