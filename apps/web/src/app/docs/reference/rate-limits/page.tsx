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
          <li>Use cheap or balanced modes for default customer traffic</li>
          <li>Reserve premium and explicit model selection for paid plans</li>
        </ul>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Plan gates" desc="Plans can control task tiers, routing modes, explicit model selection, debug traces, and model registry access." />
        <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-white">
          <div className="grid grid-cols-12 bg-black/[0.03] px-4 py-3 text-xs font-bold text-black/60">
            <div className="col-span-3">Plan</div>
            <div className="col-span-3">Modes</div>
            <div className="col-span-3">Model selection</div>
            <div className="col-span-3">Debug / registry</div>
          </div>
          {[
            ["Free", "cheap, balanced", "Locked", "Locked"],
            ["Pro", "cheap, balanced, fast, auto", "Locked", "Locked"],
            ["Team", "cheap, balanced, fast, premium, auto", "Allowed", "Allowed"],
            ["Enterprise", "all commercial modes", "Allowed", "Allowed"],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-12 border-t border-black/10 px-4 py-3 text-sm text-black/70">
              <div className="col-span-3 font-semibold text-black">{row[0]}</div>
              <div className="col-span-3">{row[1]}</div>
              <div className="col-span-3">{row[2]}</div>
              <div className="col-span-3">{row[3]}</div>
            </div>
          ))}
        </div>
      </div>
    </DocShell>
  );
}
