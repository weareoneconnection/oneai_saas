import type { LLMResolvedConfig } from "./types.js";
import { estimateLLMCostUSD } from "./pricing.js";

function listFromEnv(name: string): string[] {
  return String(process.env[name] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedProvider(provider: string): boolean {
  const allowed = listFromEnv("ONEAI_ALLOWED_LLM_PROVIDERS");
  if (!allowed.length) return true;
  return allowed.includes(provider);
}

function isAllowedModel(provider: string, model: string): boolean {
  const allowed = listFromEnv("ONEAI_ALLOWED_LLM_MODELS");
  if (!allowed.length) return true;

  return allowed.some((item) => {
    if (item.includes(":")) return item === `${provider}:${model}`;
    return item === model;
  });
}

export function assertLLMAllowed(config: LLMResolvedConfig) {
  if (!isAllowedProvider(config.provider)) {
    throw new Error(`LLM provider is not allowed: ${config.provider}`);
  }

  if (!isAllowedModel(config.provider, config.model)) {
    throw new Error(`LLM model is not allowed: ${config.provider}:${config.model}`);
  }

  for (const fallback of config.fallbacks ?? []) {
    if (!isAllowedProvider(fallback.provider)) {
      throw new Error(`LLM fallback provider is not allowed: ${fallback.provider}`);
    }

    if (!isAllowedModel(fallback.provider, fallback.model)) {
      throw new Error(
        `LLM fallback model is not allowed: ${fallback.provider}:${fallback.model}`
      );
    }
  }
}

function roughTokenCount(value: unknown): number {
  try {
    return Math.ceil(JSON.stringify(value ?? "").length / 4);
  } catch {
    return Math.ceil(String(value ?? "").length / 4);
  }
}

export function estimateMaxLLMCostUsd(
  config: LLMResolvedConfig,
  input: unknown
): number {
  const promptTokens = roughTokenCount(input);
  const completionTokens = config.maxTokens ?? Number(process.env.ONEAI_LLM_DEFAULT_MAX_TOKENS || 2048);

  return estimateLLMCostUSD({
    provider: config.provider,
    model: config.model,
    promptTokens,
    completionTokens,
  });
}

export function assertLLMCostAllowed(
  config: LLMResolvedConfig,
  input: unknown
) {
  if (typeof config.maxCostUsd !== "number") return;

  const estimatedCostUsd = estimateMaxLLMCostUsd(config, input);
  if (estimatedCostUsd <= 0) return;

  if (estimatedCostUsd > config.maxCostUsd) {
    throw new Error(
      `LLM estimated max cost ${estimatedCostUsd.toFixed(6)} exceeds maxCostUsd ${config.maxCostUsd}`
    );
  }
}
