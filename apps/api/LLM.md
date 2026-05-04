# OneAI LLM Layer

OneAI treats LLMs as infrastructure behind the intelligence workflow. Existing workflows keep calling `/v1/generate`; the LLM layer decides provider, model, fallback, trace, and cost policy.

## Defaults

```bash
ONEAI_DEFAULT_PROVIDER=openai
ONEAI_DEFAULT_MODEL=gpt-4o-mini
```

If unset, OneAI defaults to `openai:gpt-4o-mini` to preserve existing behavior.

## Provider Keys

```bash
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=...
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-5
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
XAI_API_KEY=...
XAI_MODEL=grok-4
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
GROQ_API_KEY=...
GROQ_MODEL=...
MISTRAL_API_KEY=...
MISTRAL_MODEL=mistral-large-latest
PERPLEXITY_API_KEY=...
PERPLEXITY_MODEL=sonar-pro
COHERE_API_KEY=...
COHERE_MODEL=command-a-03-2025
TOGETHER_API_KEY=...
TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
FIREWORKS_API_KEY=...
FIREWORKS_MODEL=accounts/fireworks/models/llama-v3p3-70b-instruct
CEREBRAS_API_KEY=...
CEREBRAS_MODEL=llama-3.3-70b
SILICONFLOW_API_KEY=...
SILICONFLOW_MODEL=Qwen/Qwen2.5-72B-Instruct
ZHIPU_API_KEY=...
ZHIPU_MODEL=glm-4.5
MINIMAX_API_KEY=...
MINIMAX_MODEL=MiniMax-M1
QWEN_API_KEY=...
QWEN_BASE_URL=...
QWEN_MODEL=...
MOONSHOT_API_KEY=...
MOONSHOT_BASE_URL=...
MOONSHOT_MODEL=...
DOUBAO_API_KEY=...
DOUBAO_BASE_URL=...
DOUBAO_MODEL=...
ONEAI_LLM_API_KEY=...
ONEAI_LLM_BASE_URL=...
ONEAI_LLM_MODEL=...
```

`ONEAI_LLM_*` is for custom OpenAI-compatible providers.

`OPENROUTER_*` is useful for commercial testing because one provider key can route many upstream models.

`ANTHROPIC_*`, `GEMINI_*`, `XAI_*`, `MISTRAL_*`, `PERPLEXITY_*`, `COHERE_*`, `TOGETHER_*`, `FIREWORKS_*`, and `CEREBRAS_*` are first-class commercial provider slots using OpenAI-compatible chat completion clients where the provider supports it.

`SILICONFLOW_*`, `ZHIPU_*`, `QWEN_*`, `MOONSHOT_*`, `DOUBAO_*`, and `MINIMAX_*` cover major Asia/China model routes. Override the base URL when the vendor account requires a regional or gateway-specific endpoint.

`QWEN_*`, `MOONSHOT_*`, and `DOUBAO_*` are OpenAI-compatible slots. Set the provider base URL explicitly to avoid coupling OneAI to vendor-specific defaults.

## Extra Model Registry

Register additional models without code changes:

```bash
ONEAI_LLM_MODEL_REGISTRY=openrouter:anthropic/claude-3.5-sonnet:premium|auto,qwen:qwen-plus:cheap|balanced|auto
```

Format:

```text
provider:model:mode1|mode2|mode3
```

## Per-Request Options

```json
{
  "options": {
    "llm": {
      "provider": "deepseek",
      "model": "deepseek-chat",
      "mode": "cheap",
      "temperature": 0.5,
      "maxTokens": 2000,
      "maxCostUsd": 0.02
    }
  }
}
```

Supported modes:

- `cheap`
- `balanced`
- `premium`
- `fast`
- `auto`

## Fallbacks

Static fallback order:

```bash
ONEAI_LLM_FALLBACKS=openai:gpt-4o-mini,deepseek:deepseek-chat
```

Optional automatic fallback from the model registry:

```bash
ONEAI_LLM_AUTO_FALLBACKS=1
ONEAI_LLM_AUTO_FALLBACK_LIMIT=2
```

Fallback only applies to retryable provider failures such as timeouts, rate limits, and 5xx responses.

## Auto Mode

```bash
ONEAI_LLM_AUTO_MODE=1
```

When enabled, OneAI infers the routing mode from task type and input size unless the request explicitly pins `provider` or `model`.

## Allowlist

```bash
ONEAI_ALLOWED_LLM_PROVIDERS=openai,deepseek
ONEAI_ALLOWED_LLM_MODELS=openai:gpt-4o-mini,deepseek:deepseek-chat
```

If unset, allowlist checks are open. Admin keys can still use internal debug overrides.

## Admin Registry

```text
GET /v1/generate/models
```

Requires an admin API key. Returns registered model profiles and a non-secret configuration summary.
