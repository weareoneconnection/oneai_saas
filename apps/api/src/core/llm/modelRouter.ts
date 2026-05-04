import type { LLMOverrides, LLMProviderConfig, LLMResolvedConfig } from "./types.js";
import { chooseModelForMode, fallbackModelsForMode } from "./modelRegistry.js";

export type TaskType = string;

type TaskModelPolicy = {
  provider?: string;
  model: string;
  temperature: number;
  maxTokens?: number;
};

const DEFAULT_MODEL = process.env.ONEAI_DEFAULT_MODEL || "gpt-4o-mini";
const DEFAULT_PROVIDER = process.env.ONEAI_DEFAULT_PROVIDER || "openai";
const DEFAULT_TEMPERATURE = Number(process.env.ONEAI_DEFAULT_TEMPERATURE ?? 0.7);

const TASK_MODEL_POLICIES: Record<string, TaskModelPolicy> = {
  mission: { model: DEFAULT_MODEL, temperature: 0.7 },
  tweet: { model: DEFAULT_MODEL, temperature: 0.8 },
};

function numberOrDefault(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function defaultModelForProvider(provider: string): string | undefined {
  switch (provider) {
    case "openai":
      return DEFAULT_MODEL;
    case "openrouter":
      return process.env.OPENROUTER_MODEL || undefined;
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
    case "gemini":
      return process.env.GEMINI_MODEL || "gemini-2.5-flash";
    case "xai":
      return process.env.XAI_MODEL || "grok-4";
    case "deepseek":
      return process.env.DEEPSEEK_MODEL || "deepseek-chat";
    case "groq":
      return process.env.GROQ_MODEL || undefined;
    case "mistral":
      return process.env.MISTRAL_MODEL || "mistral-large-latest";
    case "perplexity":
      return process.env.PERPLEXITY_MODEL || "sonar-pro";
    case "cohere":
      return process.env.COHERE_MODEL || "command-a-03-2025";
    case "together":
      return process.env.TOGETHER_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo";
    case "fireworks":
      return process.env.FIREWORKS_MODEL || "accounts/fireworks/models/llama-v3p3-70b-instruct";
    case "cerebras":
      return process.env.CEREBRAS_MODEL || "llama-3.3-70b";
    case "siliconflow":
      return process.env.SILICONFLOW_MODEL || "Qwen/Qwen2.5-72B-Instruct";
    case "zhipu":
      return process.env.ZHIPU_MODEL || "glm-4.5";
    case "minimax":
      return process.env.MINIMAX_MODEL || "MiniMax-M1";
    case "qwen":
      return process.env.QWEN_MODEL || undefined;
    case "moonshot":
      return process.env.MOONSHOT_MODEL || undefined;
    case "doubao":
      return process.env.DOUBAO_MODEL || undefined;
    case "custom":
    case "openai-compatible":
      return process.env.ONEAI_LLM_MODEL || undefined;
    default:
      return undefined;
  }
}

function resolveModelName(params: {
  provider: string;
  policyModel: string;
  mode?: LLMOverrides["mode"];
  overrideModel?: string;
}) {
  if (params.overrideModel) return params.overrideModel;

  if (params.mode) {
    const chosen = chooseModelForMode({
      provider: params.provider,
      mode: params.mode,
    });
    if (chosen) return chosen.model;
  }

  const providerDefault = defaultModelForProvider(params.provider);
  if (providerDefault) return providerDefault;

  return params.provider === DEFAULT_PROVIDER ? params.policyModel : "";
}

function parseProviderModelPair(value: string): LLMProviderConfig | null {
  const raw = value.trim();
  if (!raw) return null;

  const [provider, ...modelParts] = raw.split(":");
  const model = modelParts.join(":").trim();
  if (!provider?.trim() || !model) return null;

  return {
    provider: provider.trim(),
    model,
  };
}

function parseFallbacks(): LLMProviderConfig[] {
  return String(process.env.ONEAI_LLM_FALLBACKS || "")
    .split(",")
    .map(parseProviderModelPair)
    .filter((x): x is LLMProviderConfig => !!x);
}

function autoFallbacksFor(params: {
  provider: string;
  model: string;
  mode?: LLMOverrides["mode"];
}): LLMProviderConfig[] {
  if (process.env.ONEAI_LLM_AUTO_FALLBACKS !== "1") return [];

  return fallbackModelsForMode(params)
    .slice(0, Number(process.env.ONEAI_LLM_AUTO_FALLBACK_LIMIT || 2))
    .map((profile) => ({
      provider: profile.provider,
      model: profile.model,
    }));
}

export function resolveModel(
  task: TaskType,
  overrides?: LLMOverrides
): LLMResolvedConfig {
  const policy = TASK_MODEL_POLICIES[task] ?? {
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
  };

  const provider = overrides?.provider ?? policy.provider ?? DEFAULT_PROVIDER;
  const model = resolveModelName({
    provider,
    policyModel: policy.model,
    mode: overrides?.mode,
    overrideModel: overrides?.model,
  });
  const configuredFallbacks = parseFallbacks();
  const fallbacks = configuredFallbacks.length
    ? configuredFallbacks
    : autoFallbacksFor({ provider, model, mode: overrides?.mode });

  return {
    provider,
    model,
    ...(overrides?.mode ? { mode: overrides.mode } : {}),
    ...(typeof overrides?.maxCostUsd === "number"
      ? { maxCostUsd: overrides.maxCostUsd }
      : {}),
    temperature: numberOrDefault(
      overrides?.temperature,
      numberOrDefault(policy.temperature, DEFAULT_TEMPERATURE)
    ),
    ...(overrides?.maxTokens ?? policy.maxTokens
      ? { maxTokens: overrides?.maxTokens ?? policy.maxTokens }
      : {}),
    ...(overrides?.baseURL ? { baseURL: overrides.baseURL } : {}),
    ...(overrides?.apiKeyEnv ? { apiKeyEnv: overrides.apiKeyEnv } : {}),
    ...(fallbacks.length ? { fallbacks } : {}),
  };
}
