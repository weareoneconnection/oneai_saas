import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Chat Completions"
      description="POST /v1/chat/completions — OpenAI-compatible model gateway access through OneAI."
      pills={["OpenAI-compatible", "streaming", "Bearer auth", "model routing"]}
      prev={{ href: "/docs/reference/generate", label: "Generate" }}
      next={{ href: "/docs/reference/messages", label: "Messages" }}
    >
      <DocSectionTitle title="Request" desc="Use provider:model ids from /v1/models. GPT-5 class models use max_completion_tokens." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\
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

      <div className="mt-10">
        <DocSectionTitle title="Streaming" desc="Set stream: true to receive server-sent events compatible with chat completion chunks." />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -N https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "messages": [
      { "role": "user", "content": "Write a short OneAI launch line." }
    ],
    "stream": true,
    "max_completion_tokens": 300
  }'`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle title="Response" desc="OneAI returns standard choices plus oneai.trace for routing observability." />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "id": "chatcmpl_...",
  "object": "chat.completion",
  "model": "gpt-5.2-...",
  "provider": "openai",
  "choices": [{ "message": { "role": "assistant", "content": "..." } }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 57,
    "total_tokens": 72,
    "estimated_cost_usd": 0.00012
  },
  "oneai": {
    "requestId": "chatcmpl_...",
    "trace": { "selectedProvider": "openai", "fallbackUsed": false }
  }
}`}</pre>
        </div>
      </div>
    </DocShell>
  );
}
