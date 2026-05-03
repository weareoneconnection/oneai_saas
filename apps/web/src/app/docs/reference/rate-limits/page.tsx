import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Rate limits"
      description="Quotas, API key limits, and cost controls for production usage."
      pills={["rateLimitRpm", "monthlyBudgetUsd", "maxCostUsd"]}
      prev={{ href: "/docs/reference/errors", label: "Errors" }}
      next={{ href: "/docs", label: "Docs Home" }}
    >
      <DocSectionTitle title="Best practices" desc="Control spend and protect the gateway before expanding customer limits." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <ul className="list-disc pl-5 text-sm text-black/70 space-y-2">
          <li>Set per-key rateLimitRpm for production keys</li>
          <li>Set monthlyBudgetUsd where customer spend needs a hard guard</li>
          <li>Use options.llm.maxCostUsd for expensive task classes</li>
        </ul>
      </div>
    </DocShell>
  );
}
