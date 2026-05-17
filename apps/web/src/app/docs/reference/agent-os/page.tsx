import { DocShell, DocSectionTitle } from "../../_components/DocShell";

const protocolRows = [
  ["Planner", "OneAI", "Creates plans, context packets, handoff contracts, approval policies, proof policies, and ledger records."],
  ["Executor", "OneClaw / OpenClaw / bot / external / human", "Performs external actions only after approval policy allows execution."],
  ["Verifier", "OneAI operator / admin", "Reviews proof, marks proof verified, needs_review, or rejected, and closes operational trust loop."],
  ["Customer system", "Your backend", "Owns API keys, sends requests, stores business-side decisions, and keeps secrets out of browsers."],
];

const lifecycleRows = [
  ["1", "contract_created", "OneAI creates a handoff contract and stores an execution ledger record."],
  ["2", "approval_decided", "Approval is auto-approved by policy or waits for a manual approval callback/operator action."],
  ["3", "executor_started", "OneClaw, OpenClaw, bot, external agent, or human starts external work outside OneAI."],
  ["4", "proof_received", "Executor submits logs, URLs, screenshots, transaction references, JSON, or text proof."],
  ["5", "proof_reviewed", "Operator or policy reviews proof and marks it verified, needs_review, or rejected."],
  ["6", "result_received", "Executor submits the final result and status."],
  ["7", "ledger_closed", "OneAI keeps the full handoff/proof/result trail for customer and operator review."],
];

export default function Page() {
  return (
    <DocShell
      title="Reference: Agent OS"
      description="Standard handoff contracts, executor protocol, approval policy, proof callbacks, and execution result ledger. OneAI does not execute external actions."
      pills={["handoff schema", "executor protocol", "proof ledger", "OneAI brain"]}
      prev={{ href: "/docs/reference/messages", label: "Messages" }}
      next={{ href: "/docs/reference/models", label: "Models" }}
    >
      <DocSectionTitle
        title="Protocol model"
        desc="Agent OS is a coordination protocol, not an executor runtime. OneAI owns planning, approvals, records, and verification metadata; external executors own real-world action."
      />
      <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="min-w-[820px] w-full text-left text-sm">
          <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">System</th>
              <th className="px-4 py-3">Responsibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {protocolRows.map(([role, system, responsibility]) => (
              <tr key={role}>
                <td className="px-4 py-4 font-bold text-black">{role}</td>
                <td className="px-4 py-4 text-black/65">{system}</td>
                <td className="px-4 py-4 leading-relaxed text-black/65">{responsibility}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
        <div className="text-sm font-extrabold">Non-negotiable execution boundary</div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          OneAI never performs external actions through Agent OS. It can create
          the plan, approval policy, proof policy, handoff contract, and ledger
          record. OneClaw, OpenClaw, bots, customer systems, or humans perform
          the action and report proof/results back to OneAI.
        </p>
      </div>

      <DocSectionTitle
        title="1) Capabilities"
        desc="List OneAI task capabilities plus Agent OS preview capabilities. This is a capability directory, not a workflow execution endpoint."
      />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/capabilities \\
  -H "x-api-key: YOUR_KEY" | jq`}</pre>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="2) Agent Plan Contract"
          desc="Create a standard plan object that can later be handed off to OneClaw, bots, external agents, or humans."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/agent-plans \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "objective": "Prepare a production launch checklist for OneAI",
    "constraints": ["Do not execute actions", "Every action must be verifiable"],
    "targetExecutor": "oneclaw",
    "riskLevel": "medium"
  }' | jq`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="3) Handoff Preview"
          desc="Package a plan for an executor without triggering execution. This preserves the OneAI / OneClaw boundary."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/handoff/preview \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "objective": "Hand off a launch checklist to OneClaw",
    "targetExecutor": "oneclaw",
    "approvalRequired": true,
    "proofRequired": ["deployment log", "health check result"]
  }' | jq`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="4) Standard Handoff Contract"
          desc="Create a stored Agent OS contract for OneClaw, OpenClaw, bots, external agents, or human operators. The contract includes approval policy, proof requirements, callbacks, and a ledger record."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/handoff/contracts \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "objective": "Hand off a launch checklist to OpenClaw",
    "targetExecutor": "openclaw",
    "executorProtocol": "openclaw.v1",
    "riskLevel": "medium",
    "approvalMode": "manual",
    "proofRequired": ["execution log", "result summary"]
  }' | jq`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="5) Executor Protocol"
          desc="Executor teams can inspect the OneAI Agent OS protocol and callback routes before integrating."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/executor-protocol \\
  -H "x-api-key: YOUR_KEY" | jq`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="6) Approval, Proof, Result"
          desc="Executors never need direct database access. They report approval, proof, and final results through standard callbacks."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-white p-6">
            <div className="text-sm font-bold">Approve</div>
            <pre className="mt-4 whitespace-pre-wrap text-xs text-black/80">{`curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/executions/HANDOFF_ID/approval \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{"status":"APPROVED","approvedBy":"operator"}'`}</pre>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-6">
            <div className="text-sm font-bold">Proof</div>
            <pre className="mt-4 whitespace-pre-wrap text-xs text-black/80">{`curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/executions/HANDOFF_ID/proof \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{"executorRunId":"run_001","status":"RUNNING","proof":{"artifacts":[],"summary":"Started execution."}}'`}</pre>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-6">
            <div className="text-sm font-bold">Result</div>
            <pre className="mt-4 whitespace-pre-wrap text-xs text-black/80">{`curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/executions/HANDOFF_ID/result \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{"executorRunId":"run_001","status":"SUCCEEDED","result":{"summary":"Completed."}}'`}</pre>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="7) Executor lifecycle"
          desc="Use this lifecycle when integrating OneClaw, OpenClaw, bots, external agents, or human operators."
        />
        <div className="mt-6 grid gap-3">
          {lifecycleRows.map(([step, name, desc]) => (
            <div key={name} className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 md:grid-cols-[48px_220px_1fr] md:items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                {step}
              </div>
              <code className="text-sm font-bold text-black">{name}</code>
              <p className="text-sm leading-relaxed text-black/65">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="8) Context Preview"
          desc="Normalize business, thread, customer, memory, retrieval, and policy context before attaching it to Task Intelligence or Agent Plan requests."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/context/preview \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "threadId": "launch-thread-001",
    "customerId": "customer_123",
    "memoryHints": ["Customer prefers short practical plans"],
    "retrievalContext": [{ "title": "Launch notes", "text": "Ship API docs first." }],
    "policyHints": ["Do not execute external actions"]
  }' | jq`}</pre>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
        <div className="text-sm font-extrabold">Execution boundary</div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          OneAI is the intelligence and coordination brain. These Agent OS
          endpoints create capability metadata, plans, context packets, and
          handoff previews. They do not click buttons, call external tools, or
          execute real-world actions. Execution belongs to OneClaw, bots,
          customer agents, or human operators.
        </p>
        <div className="mt-5">
          <a
            href="/docs/reference/agent-os/versioning"
            className="inline-flex rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
          >
            View protocol versioning
          </a>
        </div>
      </div>
    </DocShell>
  );
}
