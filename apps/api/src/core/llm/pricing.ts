import { findModelProfile } from "./modelRegistry.js";

type ModelPricing = {
  prompt: number;
  completion: number;
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
};

function findPricing(model: string): ModelPricing | null {
  const key = Object.keys(DEFAULT_PRICING)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => model.startsWith(candidate));

  return key ? DEFAULT_PRICING[key] : null;
}

export function hasLLMPricing(provider: string | undefined, model: string): boolean {
  if (provider) {
    const profile = findModelProfile(provider, model);
    if (profile?.inputCostPerToken || profile?.outputCostPerToken) return true;
  }

  return !!findPricing(model);
}

export function estimateLLMCostUSD(params: {
  provider?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}) {
  if (params.provider) {
    const profile = findModelProfile(params.provider, params.model);
    if (profile?.inputCostPerToken || profile?.outputCostPerToken) {
      return (
        params.promptTokens * (profile.inputCostPerToken ?? 0) +
        params.completionTokens * (profile.outputCostPerToken ?? 0)
      );
    }
  }

  const pricing = findPricing(params.model);
  if (!pricing) return 0;

  return (
    params.promptTokens * pricing.prompt +
    params.completionTokens * pricing.completion
  );
}
