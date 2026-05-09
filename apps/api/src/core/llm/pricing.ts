import { findModelProfile } from "./modelRegistry.js";

type ModelPricing = {
  prompt: number;
  completion: number;
};

export type ResolvedModelPricing = {
  inputCostPerToken: number;
  outputCostPerToken: number;
  inputCostPer1MTokens: number;
  outputCostPer1MTokens: number;
  source: "registry" | "built_in";
};

const DEFAULT_PRICING: Record<string, ModelPricing> = {
  "gpt-5.2": {
    prompt: 0.00000125,
    completion: 0.00001,
  },
  "gpt-5.1": {
    prompt: 0.00000125,
    completion: 0.00001,
  },
  "gpt-5-mini": {
    prompt: 0.00000025,
    completion: 0.000002,
  },
  "gpt-5-nano": {
    prompt: 0.00000005,
    completion: 0.0000004,
  },
  "gpt-4o-mini": {
    prompt: 0.00000015,
    completion: 0.0000006,
  },
  "gpt-4o": {
    prompt: 0.0000025,
    completion: 0.00001,
  },
  "openai/gpt-5.2": {
    prompt: 0.00000125,
    completion: 0.00001,
  },
  "openai/gpt-5.1": {
    prompt: 0.00000125,
    completion: 0.00001,
  },
  "openai/gpt-5-mini": {
    prompt: 0.00000025,
    completion: 0.000002,
  },
  "openai/gpt-5-nano": {
    prompt: 0.00000005,
    completion: 0.0000004,
  },
  "openai/gpt-4o-mini": {
    prompt: 0.00000015,
    completion: 0.0000006,
  },
  "openai/gpt-4o": {
    prompt: 0.0000025,
    completion: 0.00001,
  },
  "deepseek-chat": {
    prompt: 0.00000028,
    completion: 0.00000042,
  },
  "deepseek-reasoner": {
    prompt: 0.00000028,
    completion: 0.00000042,
  },
  "deepseek-v4-flash": {
    prompt: 0.00000014,
    completion: 0.00000028,
  },
  "deepseek/deepseek-chat": {
    prompt: 0.00000028,
    completion: 0.00000042,
  },
  "deepseek/deepseek-reasoner": {
    prompt: 0.00000028,
    completion: 0.00000042,
  },
  "deepseek/deepseek-v4-flash": {
    prompt: 0.00000014,
    completion: 0.00000028,
  },
};

function findPricing(model: string): ModelPricing | null {
  const key = Object.keys(DEFAULT_PRICING)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => model.startsWith(candidate));

  return key ? DEFAULT_PRICING[key] : null;
}

export function resolveLLMPricing(
  provider: string | undefined,
  model: string
): ResolvedModelPricing | null {
  if (provider) {
    const profile = findModelProfile(provider, model);
    if (profile?.inputCostPerToken || profile?.outputCostPerToken) {
      const inputCostPerToken = profile.inputCostPerToken ?? 0;
      const outputCostPerToken = profile.outputCostPerToken ?? 0;
      return {
        inputCostPerToken,
        outputCostPerToken,
        inputCostPer1MTokens: inputCostPerToken * 1_000_000,
        outputCostPer1MTokens: outputCostPerToken * 1_000_000,
        source: "registry",
      };
    }
  }

  const pricing = findPricing(model);
  if (!pricing) return null;

  return {
    inputCostPerToken: pricing.prompt,
    outputCostPerToken: pricing.completion,
    inputCostPer1MTokens: pricing.prompt * 1_000_000,
    outputCostPer1MTokens: pricing.completion * 1_000_000,
    source: "built_in",
  };
}

export function hasLLMPricing(provider: string | undefined, model: string): boolean {
  return !!resolveLLMPricing(provider, model);
}

export function estimateLLMCostUSD(params: {
  provider?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}) {
  const pricing = resolveLLMPricing(params.provider, params.model);
  if (!pricing) return 0;

  return (
    params.promptTokens * pricing.inputCostPerToken +
    params.completionTokens * pricing.outputCostPerToken
  );
}
