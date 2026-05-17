import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Agent OS Preview"
      description="Sidecar Agent OS infrastructure for capabilities, agent plan contracts, handoff previews, and context previews. OneAI does not execute external actions."
      pills={["preview-only", "handoff boundary", "OneAI brain", "OneClaw executes"]}
      prev={{ href: "/docs/reference/messages", label: "Messages" }}
      next={{ href: "/docs/reference/models", label: "Models" }}
    >
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
          title="4) Context Preview"
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
      </div>
    </DocShell>
  );
}
