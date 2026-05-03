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
    </DocShell>
  );
}
