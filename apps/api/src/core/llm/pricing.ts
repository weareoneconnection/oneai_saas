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
  // Built-in estimates are operational guardrails. Keep provider dashboards as the billing source of truth.
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
  "gpt-4.1-mini": {
    prompt: 0.0000004,
    completion: 0.0000016,
  },
  "gpt-4.1": {
    prompt: 0.000002,
    completion: 0.000008,
  },
  "openai/gpt-4.1-mini": {
    prompt: 0.0000004,
    completion: 0.0000016,
  },
  "openai/gpt-4.1": {
    prompt: 0.000002,
    completion: 0.000008,
  },
  "claude-opus-4-1": {
    prompt: 0.000015,
    completion: 0.000075,
  },
  "claude-opus-4": {
    prompt: 0.000015,
    completion: 0.000075,
  },
  "claude-sonnet-4": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "claude-3-5-haiku": {
    prompt: 0.0000008,
    completion: 0.000004,
  },
  "anthropic/claude-opus-4-1": {
    prompt: 0.000015,
    completion: 0.000075,
  },
  "anthropic/claude-opus-4": {
    prompt: 0.000015,
    completion: 0.000075,
  },
  "anthropic/claude-sonnet-4": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "anthropic/claude-3-5-haiku": {
    prompt: 0.0000008,
    completion: 0.000004,
  },
  "gemini-3-pro": {
    prompt: 0.000002,
    completion: 0.000012,
  },
  "gemini-2.5-pro": {
    prompt: 0.00000125,
    completion: 0.00001,
  },
  "gemini-2.5-flash": {
    prompt: 0.0000003,
    completion: 0.0000025,
  },
  "google/gemini-3-pro": {
    prompt: 0.000002,
    completion: 0.000012,
  },
  "google/gemini-2.5-pro": {
    prompt: 0.00000125,
    completion: 0.00001,
  },
  "google/gemini-2.5-flash": {
    prompt: 0.0000003,
    completion: 0.0000025,
  },
  "grok-4.20": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "grok-4-fast": {
    prompt: 0.0000002,
    completion: 0.0000005,
  },
  "grok-4": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "x-ai/grok-4.20": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "x-ai/grok-4-fast": {
    prompt: 0.0000002,
    completion: 0.0000005,
  },
  "x-ai/grok-4": {
    prompt: 0.000003,
    completion: 0.000015,
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
  "mistral-large": {
    prompt: 0.000002,
    completion: 0.000006,
  },
  "mistral-medium": {
    prompt: 0.0000004,
    completion: 0.000002,
  },
  "mistral-small": {
    prompt: 0.0000001,
    completion: 0.0000003,
  },
  "ministral-8b": {
    prompt: 0.0000001,
    completion: 0.0000001,
  },
  "mistralai/mistral-large": {
    prompt: 0.000002,
    completion: 0.000006,
  },
  "mistralai/mistral-medium": {
    prompt: 0.0000004,
    completion: 0.000002,
  },
  "mistralai/mistral-small": {
    prompt: 0.0000001,
    completion: 0.0000003,
  },
  "sonar-pro": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "sonar": {
    prompt: 0.000001,
    completion: 0.000001,
  },
  "perplexity/sonar-pro": {
    prompt: 0.000003,
    completion: 0.000015,
  },
  "perplexity/sonar": {
    prompt: 0.000001,
    completion: 0.000001,
  },
  "command-a": {
    prompt: 0.0000025,
    completion: 0.00001,
  },
  "cohere/command-a": {
    prompt: 0.0000025,
    completion: 0.00001,
  },
  "meta-llama/Llama-3.3-70B-Instruct-Turbo": {
    prompt: 0.00000088,
    completion: 0.00000088,
  },
  "accounts/fireworks/models/llama-v3p3-70b-instruct": {
    prompt: 0.0000009,
    completion: 0.0000009,
  },
  "llama-3.3-70b": {
    prompt: 0.00000085,
    completion: 0.0000012,
  },
  "Qwen/Qwen2.5-72B-Instruct": {
    prompt: 0.0000007,
    completion: 0.0000007,
  },
  "qwen-plus": {
    prompt: 0.0000004,
    completion: 0.0000012,
  },
  "qwen/qwen-plus": {
    prompt: 0.0000004,
    completion: 0.0000012,
  },
  "glm-4.5": {
    prompt: 0.0000006,
    completion: 0.0000022,
  },
  "z-ai/glm-4.5": {
    prompt: 0.0000006,
    completion: 0.0000022,
  },
  "MiniMax-M1": {
    prompt: 0.0000004,
    completion: 0.0000022,
  },
  "minimax/MiniMax-M1": {
    prompt: 0.0000004,
    completion: 0.0000022,
  },
  "kimi-k2": {
    prompt: 0.0000006,
    completion: 0.0000025,
  },
  "moonshotai/kimi-k2": {
    prompt: 0.0000006,
    completion: 0.0000025,
  },
  "doubao-seed": {
    prompt: 0.00000011,
    completion: 0.00000028,
  },
  "bytedance/doubao-seed": {
    prompt: 0.00000011,
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
