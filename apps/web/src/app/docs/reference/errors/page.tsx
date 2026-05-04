import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Errors"
      description="How OneAI reports validation, policy, and provider failures."
      pills={["requestId", "error code", "retryable"]}
      prev={{ href: "/docs/reference/schemas", label: "Schemas" }}
      next={{ href: "/docs/reference/rate-limits", label: "Rate limits" }}
    >
      <DocSectionTitle title="Failure shape" desc="Use requestId and code to support customers and debug provider behavior." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "success": false,
  "requestId": "req_...",
  "error": "Max cost exceeded",
  "code": "LLM_COST_LIMIT_EXCEEDED",
  "retryable": false
}`}</pre>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Common codes" desc="These codes are designed to be customer-safe and operationally useful." />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            ["INVALID_API_KEY", "The key is missing, revoked, or not found."],
            ["MODELS_FORBIDDEN", "The current key or plan cannot access model registry data."],
            ["MODEL_HEALTH_FORBIDDEN", "Health checks require an admin key."],
            ["LLM_COST_LIMIT_EXCEEDED", "The request exceeded the configured maxCostUsd policy."],
            ["UPSTREAM_CONFIG_ERROR", "Provider key, base URL, or model config is missing."],
            ["UPSTREAM_RATE_LIMITED", "Provider returned a retryable rate limit."],
          ].map(([code, desc]) => (
            <div key={code} className="rounded-lg border border-black/10 bg-white p-4">
              <code className="text-xs font-bold text-black">{code}</code>
              <p className="mt-2 text-sm text-black/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DocShell>
  );
}
