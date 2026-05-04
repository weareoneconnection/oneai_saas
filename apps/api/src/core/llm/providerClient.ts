import OpenAI from "openai";
import type {
  LLMGenerateRequest,
  LLMGenerateResult,
  LLMProviderConfig,
  LLMResolvedConfig,
  LLMTraceAttempt,
} from "./types.js";
import { estimateLLMCostUSD } from "./pricing.js";

const clients = new Map<string, OpenAI>();

export function modelUsesMaxCompletionTokens(provider: string, model: string): boolean {
  return usesMaxCompletionTokens(provider, model);
}

export function modelSupportsTemperature(provider: string, model: string): boolean {
  return supportsTemperature(provider, model);
}

function readEnv(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return process.env[name]?.trim() || undefined;
}

function defaultApiKeyEnv(provider: string): string {
  switch (provider) {
    case "openrouter":
      return "OPENROUTER_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "gemini":
      return "GEMINI_API_KEY";
    case "xai":
      return "XAI_API_KEY";
    case "deepseek":
      return "DEEPSEEK_API_KEY";
    case "groq":
      return "GROQ_API_KEY";
    case "mistral":
      return "MISTRAL_API_KEY";
    case "perplexity":
      return "PERPLEXITY_API_KEY";
    case "cohere":
      return "COHERE_API_KEY";
    case "together":
      return "TOGETHER_API_KEY";
    case "fireworks":
      return "FIREWORKS_API_KEY";
    case "cerebras":
      return "CEREBRAS_API_KEY";
    case "siliconflow":
      return "SILICONFLOW_API_KEY";
    case "zhipu":
      return "ZHIPU_API_KEY";
    case "minimax":
      return "MINIMAX_API_KEY";
    case "qwen":
      return "QWEN_API_KEY";
    case "moonshot":
      return "MOONSHOT_API_KEY";
    case "doubao":
      return "DOUBAO_API_KEY";
    case "custom":
    case "openai-compatible":
      return "ONEAI_LLM_API_KEY";
    case "openai":
    default:
      return "OPENAI_API_KEY";
  }
}

function defaultBaseURL(provider: string): string | undefined {
  switch (provider) {
    case "openrouter":
      return process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
    case "anthropic":
      return process.env.ANTHROPIC_BASE_URL?.trim() || "https://api.anthropic.com/v1";
    case "gemini":
      return process.env.GEMINI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta/openai";
    case "xai":
      return process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1";
    case "deepseek":
      return process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com";
    case "groq":
      return process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1";
    case "mistral":
      return process.env.MISTRAL_BASE_URL?.trim() || "https://api.mistral.ai/v1";
    case "perplexity":
      return process.env.PERPLEXITY_BASE_URL?.trim() || "https://api.perplexity.ai";
    case "cohere":
      return process.env.COHERE_BASE_URL?.trim() || "https://api.cohere.com/compatibility/v1";
    case "together":
      return process.env.TOGETHER_BASE_URL?.trim() || "https://api.together.xyz/v1";
    case "fireworks":
      return process.env.FIREWORKS_BASE_URL?.trim() || "https://api.fireworks.ai/inference/v1";
    case "cerebras":
      return process.env.CEREBRAS_BASE_URL?.trim() || "https://api.cerebras.ai/v1";
    case "siliconflow":
      return process.env.SILICONFLOW_BASE_URL?.trim() || "https://api.siliconflow.cn/v1";
    case "zhipu":
      return process.env.ZHIPU_BASE_URL?.trim() || "https://open.bigmodel.cn/api/paas/v4";
    case "minimax":
      return process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.chat/v1";
    case "qwen":
      return process.env.QWEN_BASE_URL?.trim() || undefined;
    case "moonshot":
      return process.env.MOONSHOT_BASE_URL?.trim() || undefined;
    case "doubao":
      return process.env.DOUBAO_BASE_URL?.trim() || undefined;
    case "custom":
    case "openai-compatible":
      return process.env.ONEAI_LLM_BASE_URL?.trim() || undefined;
    case "openai":
      return process.env.OPENAI_BASE_URL?.trim() || undefined;
    default:
      return undefined;
  }
}

function usesMaxCompletionTokens(provider: string, model: string): boolean {
  if (provider !== "openai") return false;
  return (
    /^gpt-5(?:[.-]|$)/.test(model) ||
    /^o\d/.test(model)
  );
}

function supportsTemperature(provider: string, model: string): boolean {
  if (provider !== "openai") return true;
  return !/^gpt-5(?:[.-]|$)/.test(model);
}

function requiresExplicitBaseURL(provider: string): boolean {
  return [
    "custom",
    "openai-compatible",
    "qwen",
    "moonshot",
    "doubao",
  ].includes(provider);
}

function resolveClientConfig(config: LLMResolvedConfig) {
  const provider = config.provider || "openai";
  const apiKeyEnv = config.apiKeyEnv || defaultApiKeyEnv(provider);
  const apiKey = readEnv(apiKeyEnv);
  const baseURL = config.baseURL || defaultBaseURL(provider);

  if (!config.model) {
    throw new Error(`${provider} model is missing`);
  }

  if (!apiKey) {
    throw new Error(`${apiKeyEnv} is missing`);
  }

  if (requiresExplicitBaseURL(provider) && !baseURL) {
    throw new Error(`${provider} requires baseURL`);
  }

  return { provider, apiKeyEnv, apiKey, baseURL };
}

export function assertLLMConfigured(config: LLMResolvedConfig) {
  resolveClientConfig(config);

  for (const fallback of config.fallbacks ?? []) {
    resolveClientConfig({
      ...config,
      ...fallback,
      temperature: fallback.temperature ?? config.temperature,
    });
  }
}

export function getLLMClient(config: LLMResolvedConfig) {
  const resolved = resolveClientConfig(config);
  const cacheKey = [
    resolved.provider,
    resolved.apiKeyEnv,
    resolved.baseURL || "default",
    resolved.apiKey,
  ].join(":");

  const cached = clients.get(cacheKey);
  if (cached) return cached;

  const client = new OpenAI({
    apiKey: resolved.apiKey,
    ...(resolved.baseURL ? { baseURL: resolved.baseURL } : {}),
  });

  clients.set(cacheKey, client);
  return client;
}

export function buildChatCompletionParams(request: LLMGenerateRequest) {
  return {
    model: request.model,
    messages: request.messages,
    ...(supportsTemperature(request.provider, request.model)
      ? { temperature: request.temperature }
      : {}),
    ...(request.maxTokens
      ? usesMaxCompletionTokens(request.provider, request.model)
        ? { max_completion_tokens: request.maxTokens }
        : { max_tokens: request.maxTokens }
      : {}),
  };
}

async function generateLLMTextOnce(
  request: LLMGenerateRequest
): Promise<LLMGenerateResult> {
  const start = Date.now();
  const client = getLLMClient(request);

  const completion = await client.chat.completions.create(buildChatCompletionParams(request));

  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  const totalTokens = completion.usage?.total_tokens ?? 0;
  const estimatedCostUSD = estimateLLMCostUSD({
    provider: request.provider,
    model: completion.model || request.model,
    promptTokens,
    completionTokens,
  });
  const latencyMs = Date.now() - start;

  return {
    text: completion.choices[0]?.message?.content ?? "",
    finishReason: completion.choices[0]?.finish_reason,
    usage: {
      provider: request.provider,
      model: completion.model || request.model,
      ...(request.mode ? { mode: request.mode } : {}),
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUSD,
      estimatedCostUsd: estimatedCostUSD,
      createdAt: new Date().toISOString(),
      latencyMs,
    },
    trace: {
      selectedProvider: request.provider,
      selectedModel: completion.model || request.model,
      ...(request.mode ? { mode: request.mode } : {}),
      fallbackUsed: false,
      attempts: [
        {
          provider: request.provider,
          model: completion.model || request.model,
          ...(request.mode ? { mode: request.mode } : {}),
          ok: true,
          latencyMs,
        },
      ],
      latencyMs,
    },
    raw: completion,
  };
}

async function attemptGenerate(
  request: LLMGenerateRequest
): Promise<{ result?: LLMGenerateResult; attempt: LLMTraceAttempt; error?: unknown }> {
  const start = Date.now();

  try {
    const result = await generateLLMTextOnce(request);
    return {
      result,
      attempt: {
        provider: request.provider,
        model: result.usage.model || request.model,
        ...(request.mode ? { mode: request.mode } : {}),
        ok: true,
        latencyMs: Date.now() - start,
      },
    };
  } catch (error) {
    return {
      error,
      attempt: {
        provider: request.provider,
        model: request.model,
        ...(request.mode ? { mode: request.mode } : {}),
        ok: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function toFallbackRequest(
  request: LLMGenerateRequest,
  fallback: LLMProviderConfig
): LLMGenerateRequest {
  return {
    ...request,
    provider: fallback.provider,
    model: fallback.model,
    temperature: fallback.temperature ?? request.temperature,
    ...(fallback.maxTokens ?? request.maxTokens
      ? { maxTokens: fallback.maxTokens ?? request.maxTokens }
      : {}),
    ...(fallback.baseURL ? { baseURL: fallback.baseURL } : {}),
    ...(fallback.apiKeyEnv ? { apiKeyEnv: fallback.apiKeyEnv } : {}),
  };
}

function isRetryableLLMError(err: unknown): boolean {
  const anyErr = err as any;
  const status = Number(anyErr?.status ?? anyErr?.code);
  if ([408, 409, 429, 500, 502, 503, 504].includes(status)) return true;

  const message = String(anyErr?.message ?? err ?? "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("service unavailable") ||
    message.includes("bad gateway")
  );
}

export async function generateLLMText(
  request: LLMGenerateRequest
): Promise<LLMGenerateResult> {
  const start = Date.now();
  const attempts: LLMTraceAttempt[] = [];
  const primary = await attemptGenerate(request);
  attempts.push(primary.attempt);

  if (primary.result) {
    return {
      ...primary.result,
      trace: {
        ...primary.result.trace,
        attempts,
        latencyMs: Date.now() - start,
      },
      usage: {
        ...primary.result.usage,
        fallbackUsed: false,
      },
    };
  }

  const err = primary.error;
  const fallbacks = request.fallbacks ?? [];
  if (!fallbacks.length || !isRetryableLLMError(err)) {
    throw err;
  }

  const from = `${request.provider}:${request.model}`;
  let lastError = err;

  for (const fallback of fallbacks) {
    const fallbackRequest = toFallbackRequest(request, fallback);
    const fallbackResult = await attemptGenerate(fallbackRequest);
    attempts.push(fallbackResult.attempt);

    if (fallbackResult.result) {
      const fallbackTo = `${fallbackResult.result.usage.provider}:${fallbackResult.result.usage.model}`;

      return {
        ...fallbackResult.result,
        fallbackUsed: true,
        fallbackFrom: from,
        usage: {
          ...fallbackResult.result.usage,
          fallbackUsed: true,
          fallbackFrom: from,
        },
        trace: {
          ...fallbackResult.result.trace,
          fallbackUsed: true,
          fallbackFrom: from,
          fallbackTo,
          attempts,
          latencyMs: Date.now() - start,
        },
      };
    }

    lastError = fallbackResult.error;
    if (!isRetryableLLMError(fallbackResult.error)) break;
  }

  throw lastError;
}
