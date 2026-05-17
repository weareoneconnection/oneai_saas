import { DocShell, DocSectionTitle } from "../../../_components/DocShell";

const versions = [
  ["oneai.agent_os.v1", "Current", "Handoff contracts, executor protocol, approval policy, proof callbacks, result ledger, and context preview."],
  ["oneai.handoff.v1", "Current", "Stored handoff contract shape used by OneAI, OneClaw, OpenClaw, bots, external agents, and human operators."],
];

const compatibility = [
  ["Additive fields", "New optional fields may be added without changing the protocol version."],
  ["Breaking changes", "Required field removals, renamed statuses, changed callback semantics, or changed execution boundary require a new protocol version."],
  ["Executor tolerance", "Executors should ignore unknown fields and rely on requiredFields plus protocolVersion."],
  ["Approval safety", "Executors must not act when approvalPolicy.status is PENDING_APPROVAL or REJECTED."],
  ["Proof safety", "Executors should send proof before or with result when proofPolicy.required is true."],
];

const executorChecklist = [
  "Read protocolVersion and schemaVersion before processing.",
  "Store handoffId and executorRunId for every run.",
  "Validate approvalPolicy before any external action.",
  "Return proof artifacts through /v1/executions/{handoffId}/proof.",
  "Return final status through /v1/executions/{handoffId}/result.",
  "Never include secrets, private credentials, or raw customer tokens in proof/result callbacks.",
  "Treat OneAI as planner/ledger/verifier, not as the external execution actor.",
];

const executorExample = `# 1) Inspect protocol
curl -s https://oneai-saas-api-production.up.railway.app/v1/executor-protocol \\
  -H "x-api-key: YOUR_KEY" | jq

# 2) Create a stored handoff contract
curl -s https://oneai-saas-api-production.up.railway.app/v1/handoff/contracts \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "objective": "Prepare a production launch checklist",
    "targetExecutor": "openclaw",
    "executorProtocol": "openclaw.v1",
    "riskLevel": "medium",
    "approvalMode": "manual",
    "proofRequired": ["execution log", "result summary"]
  }' | jq

# 3) Approve before external execution
curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/executions/HANDOFF_ID/approval \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "status": "APPROVED",
    "approvedBy": "operator",
    "reason": "Approved for OpenClaw execution."
  }' | jq

# 4) Executor reports proof
curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/executions/HANDOFF_ID/proof \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "executorType": "openclaw",
    "executorRunId": "openclaw_run_001",
    "status": "RUNNING",
    "proof": {
      "summary": "OpenClaw started execution.",
      "artifacts": [{ "type": "log", "text": "Executor accepted handoff." }]
    }
  }' | jq

# 5) Executor reports final result
curl -s -X POST https://oneai-saas-api-production.up.railway.app/v1/executions/HANDOFF_ID/result \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "executorType": "openclaw",
    "executorRunId": "openclaw_run_001",
    "status": "SUCCEEDED",
    "result": {
      "summary": "Execution completed.",
      "output": "Launch checklist prepared."
    }
  }' | jq`;

export default function AgentOsVersioningPage() {
  return (
    <DocShell
      title="Reference: Agent OS Protocol Versioning"
      description="Version policy, compatibility rules, executor certification checklist, and OneClaw/OpenClaw integration expectations."
      pills={["oneai.agent_os.v1", "handoff schema", "executor compatibility", "protocol safety"]}
      prev={{ href: "/docs/reference/agent-os", label: "Agent OS" }}
      next={{ href: "/docs/reference/models", label: "Models" }}
    >
      <DocSectionTitle
        title="Current protocol versions"
        desc="OneAI treats Agent OS as a protocol surface. Executors should integrate against protocolVersion and schemaVersion, not only endpoint paths."
      />

      <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="min-w-[780px] w-full text-left text-sm">
          <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {versions.map(([version, status, scope]) => (
              <tr key={version}>
                <td className="px-4 py-4 font-mono font-bold text-black">{version}</td>
                <td className="px-4 py-4 text-black/65">{status}</td>
                <td className="px-4 py-4 leading-relaxed text-black/65">{scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="Compatibility policy"
          desc="The goal is to let OneClaw, OpenClaw, bots, and customer executors evolve without breaking existing handoff integrations."
        />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {compatibility.map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-black/10 bg-white p-5">
              <div className="text-sm font-bold text-black">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/65">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-black bg-black p-6 text-white">
        <div className="text-sm font-extrabold">Executor certification checklist</div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
          {executorChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="Example protocol fetch"
          desc="Executors can inspect the live protocol before integrating or before a new deployment."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/executor-protocol \\
  -H "x-api-key: YOUR_KEY" | jq`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="Executor example kit"
          desc="A complete OneAI → OpenClaw/OneClaw style lifecycle: protocol discovery, handoff contract, approval, proof, and final result."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="max-h-[760px] overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-black/80">
            {executorExample}
          </pre>
        </div>
      </div>
    </DocShell>
  );
}
