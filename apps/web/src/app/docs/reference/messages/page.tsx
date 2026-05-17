import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Messages"
      description="POST /v1/messages — Anthropic-style Messages API through OneAI model routing, usage tracking, and cost controls."
      pills={["Anthropic-style", "streaming", "x-api-key auth", "model routing"]}
      prev={{ href: "/docs/reference/chat", label: "Chat Completions" }}
      next={{ href: "/docs/reference/models", label: "Models" }}
    >
      <DocSectionTitle
        title="Request"
        desc="Use provider:model ids from /v1/models. This endpoint accepts a top-level system prompt plus user/assistant messages."
      />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "system": "You are OneAI, a concise commercial AI infrastructure assistant.",
    "messages": [
      { "role": "user", "content": "Explain OneAI SaaS in one sentence." }
    ],
    "max_tokens": 300
  }'`}</pre>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="Streaming"
          desc="Set stream: true to receive Anthropic-style server-sent events: message_start, content_block_delta, message_delta, and message_stop."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`curl -N https://oneai-saas-api-production.up.railway.app/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "system": "You write short launch copy.",
    "messages": [
      { "role": "user", "content": "Write a short OneAI launch line." }
    ],
    "stream": true,
    "max_tokens": 300
  }'`}</pre>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title="Response"
          desc="OneAI returns a Messages-style response plus provider, estimated cost, and oneai.trace metadata."
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm text-black/80">{`{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "model": "gpt-5.2-...",
  "provider": "openai",
  "content": [
    { "type": "text", "text": "..." }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 57,
    "estimated_cost_usd": 0.00012
  },
  "oneai": {
    "requestId": "msg_...",
    "trace": { "selectedProvider": "openai", "fallbackUsed": false }
  }
}`}</pre>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
        <div className="text-sm font-extrabold">When to use this endpoint</div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          Use /v1/messages when customers already have Anthropic-style clients
          or prefer a system-plus-messages request shape. Use /v1/chat/completions
          for OpenAI-compatible clients, and /v1/generate for OneAI Task Intelligence.
        </p>
      </div>
    </DocShell>
  );
}
