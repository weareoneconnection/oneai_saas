import type { LLMProvider, LLMRoutingMode } from "./types.js";
import { isProviderConfigured } from "./providerConfig.js";

export type LLMModelProfile = {
  provider: LLMProvider | string;
  model: string;
  modes: LLMRoutingMode[];
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  contextTokens?: number;
  supportsJson?: boolean;
  supportsTools?: boolean;
};

export type LLMRoutingStrategy = "balanced" | "cost" | "quality" | "fast";

let syncedProfiles: LLMModelProfile[] = [];
let syncedAt: string | null = null;

const DEFAULT_MODEL = process.env.ONEAI_DEFAULT_MODEL || "gpt-4o-mini";

const DEFAULT_PROFILES: LLMModelProfile[] = [
  {
    provider: "openai",
    model: "gpt-5.2",
    modes: ["balanced", "premium", "auto"],
    inputCostPerToken: 0.00000125,
    outputCostPerToken: 0.00001,
    contextTokens: 400_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-5.2-pro",
    modes: ["premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-5.1",
    modes: ["balanced", "premium", "auto"],
    inputCostPerToken: 0.00000125,
    outputCostPerToken: 0.00001,
    contextTokens: 400_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-5-mini",
    modes: ["cheap", "balanced", "fast", "auto"],
    inputCostPerToken: 0.00000025,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-5-nano",
    modes: ["cheap", "fast", "auto"],
    inputCostPerToken: 0.00000005,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-5.1-chat-latest",
    modes: ["balanced", "premium", "auto"],
    inputCostPerToken: 0.00000125,
    outputCostPerToken: 0.00001,
    contextTokens: 128_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    modes: ["cheap", "balanced", "fast", "auto"],
    inputCostPerToken: 0.00000015,
    outputCostPerToken: 0.0000006,
    supportsJson: true,
  },
  {
    provider: "openai",
    model: "gpt-4o",
    modes: ["premium", "auto"],
    inputCostPerToken: 0.0000025,
    outputCostPerToken: 0.00001,
    supportsJson: true,
  },
  {
    provider: "openai",
    model: "gpt-4.1-mini",
    modes: ["cheap", "balanced", "fast", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "openai",
    model: "gpt-4.1",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "anthropic",
    model: "claude-opus-4-1-20250805",
    modes: ["premium", "auto"],
    contextTokens: 200_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "anthropic",
    model: "claude-opus-4-20250514",
    modes: ["premium", "auto"],
    contextTokens: 200_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    modes: ["balanced", "premium", "auto"],
    contextTokens: 200_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
    modes: ["cheap", "fast", "auto"],
    contextTokens: 200_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "gemini",
    model: "gemini-3-pro-preview",
    modes: ["premium", "auto"],
    contextTokens: 1_048_576,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "gemini",
    model: "gemini-2.5-flash",
    modes: ["cheap", "balanced", "fast", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "gemini",
    model: "gemini-2.5-pro",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "xai",
    model: "grok-4.20",
    modes: ["premium", "auto"],
    contextTokens: 2_000_000,
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "xai",
    model: "grok-4",
    modes: ["premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "xai",
    model: "grok-4-fast",
    modes: ["fast", "balanced", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "deepseek",
    model: "deepseek-chat",
    modes: ["cheap", "balanced", "auto"],
    inputCostPerToken: 0.00000028,
    outputCostPerToken: 0.00000042,
    contextTokens: 128_000,
    supportsJson: true,
  },
  {
    provider: "deepseek",
    model: "deepseek-reasoner",
    modes: ["balanced", "premium", "auto"],
    inputCostPerToken: 0.00000028,
    outputCostPerToken: 0.00000042,
    contextTokens: 128_000,
    supportsJson: true,
  },
  {
    provider: "deepseek",
    model: "deepseek-v4-flash",
    modes: ["cheap", "fast", "balanced", "auto"],
    inputCostPerToken: 0.00000014,
    outputCostPerToken: 0.00000028,
    contextTokens: 1_000_000,
    supportsJson: true,
  },
  {
    provider: "mistral",
    model: "mistral-small-2603",
    modes: ["cheap", "fast", "balanced", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "mistral",
    model: "mistral-large-2512",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "mistral",
    model: "mistral-medium-2508",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "mistral",
    model: "ministral-8b-2410",
    modes: ["cheap", "fast", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "perplexity",
    model: "sonar",
    modes: ["cheap", "fast", "auto"],
    supportsJson: true,
  },
  {
    provider: "perplexity",
    model: "sonar-pro",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
  },
  {
    provider: "cohere",
    model: "command-a-03-2025",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "together",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    modes: ["cheap", "balanced", "auto"],
    supportsJson: true,
  },
  {
    provider: "fireworks",
    model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    modes: ["fast", "balanced", "auto"],
    supportsJson: true,
  },
  {
    provider: "cerebras",
    model: "llama-3.3-70b",
    modes: ["fast", "balanced", "auto"],
    supportsJson: true,
  },
  {
    provider: "siliconflow",
    model: "Qwen/Qwen2.5-72B-Instruct",
    modes: ["cheap", "balanced", "auto"],
    supportsJson: true,
  },
  {
    provider: "zhipu",
    model: "glm-4.5",
    modes: ["cheap", "balanced", "auto"],
    supportsJson: true,
    supportsTools: true,
  },
  {
    provider: "minimax",
    model: "MiniMax-M1",
    modes: ["balanced", "premium", "auto"],
    supportsJson: true,
  },
];

function envProfile(): LLMModelProfile | null {
  const provider = process.env.ONEAI_DEFAULT_PROVIDER || "openai";
  if (provider === "openai" && DEFAULT_MODEL === "gpt-4o-mini") return null;

  return {
    provider,
    model: DEFAULT_MODEL,
    modes: ["cheap", "balanced", "auto"],
    supportsJson: true,
  };
}

function groqProfile(): LLMModelProfile | null {
  const model = process.env.GROQ_MODEL?.trim();
  if (!model) return null;

  return {
    provider: "groq",
    model,
    modes: ["fast", "cheap", "auto"],
    supportsJson: true,
  };
}

function providerEnvProfile(params: {
  provider: string;
  modelEnv: string;
  modes: LLMRoutingMode[];
}): LLMModelProfile | null {
  const model = process.env[params.modelEnv]?.trim();
  if (!model) return null;

  return {
    provider: params.provider,
    model,
    modes: params.modes,
    supportsJson: true,
  };
}

function customProfile(): LLMModelProfile | null {
  const model = process.env.ONEAI_LLM_MODEL?.trim();
  if (!model) return null;

  return {
    provider: process.env.ONEAI_LLM_PROVIDER || "openai-compatible",
    model,
    modes: ["cheap", "balanced", "premium", "fast", "auto"],
    supportsJson: true,
  };
}

function configuredRegistryProfiles(): LLMModelProfile[] {
  return String(process.env.ONEAI_LLM_MODEL_REGISTRY || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item): LLMModelProfile | null => {
      const [provider, model, modesRaw] = item.split(":");
      if (!provider || !model) return null;

      const modes = String(modesRaw || "cheap|balanced|auto")
        .split("|")
        .map((mode) => mode.trim())
        .filter(Boolean) as LLMRoutingMode[];

      return {
        provider,
        model,
        modes,
        supportsJson: true,
      };
    })
    .filter((x): x is LLMModelProfile => !!x);
}

export function listModelProfiles(): LLMModelProfile[] {
  const seen = new Set<string>();
  return [
    ...syncedProfiles,
    ...DEFAULT_PROFILES,
    envProfile(),
    providerEnvProfile({
      provider: "openrouter",
      modelEnv: "OPENROUTER_MODEL",
      modes: ["cheap", "balanced", "premium", "fast", "auto"],
    }),
    providerEnvProfile({
      provider: "anthropic",
      modelEnv: "ANTHROPIC_MODEL",
      modes: ["balanced", "premium", "auto"],
    }),
    providerEnvProfile({
      provider: "gemini",
      modelEnv: "GEMINI_MODEL",
      modes: ["cheap", "balanced", "premium", "fast", "auto"],
    }),
    providerEnvProfile({
      provider: "xai",
      modelEnv: "XAI_MODEL",
      modes: ["balanced", "premium", "fast", "auto"],
    }),
    groqProfile(),
    providerEnvProfile({
      provider: "mistral",
      modelEnv: "MISTRAL_MODEL",
      modes: ["cheap", "balanced", "premium", "auto"],
    }),
    providerEnvProfile({
      provider: "perplexity",
      modelEnv: "PERPLEXITY_MODEL",
      modes: ["cheap", "balanced", "premium", "fast", "auto"],
    }),
    providerEnvProfile({
      provider: "cohere",
      modelEnv: "COHERE_MODEL",
      modes: ["balanced", "premium", "auto"],
    }),
    providerEnvProfile({
      provider: "together",
      modelEnv: "TOGETHER_MODEL",
      modes: ["cheap", "balanced", "fast", "auto"],
    }),
    providerEnvProfile({
      provider: "fireworks",
      modelEnv: "FIREWORKS_MODEL",
      modes: ["cheap", "balanced", "fast", "auto"],
    }),
    providerEnvProfile({
      provider: "cerebras",
      modelEnv: "CEREBRAS_MODEL",
      modes: ["fast", "balanced", "auto"],
    }),
    providerEnvProfile({
      provider: "siliconflow",
      modelEnv: "SILICONFLOW_MODEL",
      modes: ["cheap", "balanced", "auto"],
    }),
    providerEnvProfile({
      provider: "zhipu",
      modelEnv: "ZHIPU_MODEL",
      modes: ["cheap", "balanced", "premium", "auto"],
    }),
    providerEnvProfile({
      provider: "minimax",
      modelEnv: "MINIMAX_MODEL",
      modes: ["balanced", "premium", "auto"],
    }),
    providerEnvProfile({
      provider: "qwen",
      modelEnv: "QWEN_MODEL",
      modes: ["cheap", "balanced", "auto"],
    }),
    providerEnvProfile({
      provider: "moonshot",
      modelEnv: "MOONSHOT_MODEL",
      modes: ["cheap", "balanced", "auto"],
    }),
    providerEnvProfile({
      provider: "doubao",
      modelEnv: "DOUBAO_MODEL",
      modes: ["cheap", "balanced", "auto"],
    }),
    customProfile(),
    ...configuredRegistryProfiles(),
  ]
    .filter((x): x is LLMModelProfile => !!x)
    .filter((profile) => {
      const key = `${profile.provider}:${profile.model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function updateSyncedModelProfiles(profiles: LLMModelProfile[]) {
  syncedProfiles = profiles;
  syncedAt = new Date().toISOString();
}

export function getModelCatalogSyncState() {
  return {
    syncedAt,
    count: syncedProfiles.length,
  };
}

export function findModelProfile(provider: string, model: string) {
  const exact = listModelProfiles().find(
    (profile) => profile.provider === provider && profile.model === model
  );
  if (exact) return exact;

  return listModelProfiles()
    .filter((profile) => profile.provider === provider)
    .sort((a, b) => b.model.length - a.model.length)
    .find((profile) => model.startsWith(profile.model));
}

function isChatCompletionsModel(profile: LLMModelProfile): boolean {
  const provider = String(profile.provider);
  const model = profile.model.toLowerCase();

  if (provider !== "openai") return true;

  if (
    model.includes("image") ||
    model.includes("audio") ||
    model.includes("realtime") ||
    model.includes("transcribe") ||
    model.includes("tts") ||
    model.includes("embedding") ||
    model.includes("moderation") ||
    model.includes("search") ||
    model.includes("instruct")
  ) {
    return false;
  }

  return /^(gpt-(?:3\.5|4|5)|chatgpt-|o\d)/.test(model);
}

function preferStableChatModel(
  candidates: LLMModelProfile[],
  provider: string | undefined,
  mode: LLMRoutingMode
): LLMModelProfile | null {
  if (provider && provider !== "openai") return null;

  const preferred =
    mode === "premium"
      ? ["gpt-5.2", "gpt-5.1", "gpt-4o"]
      : mode === "balanced"
        ? ["gpt-4o-mini", "gpt-4.1-mini", "gpt-5-mini"]
        : ["gpt-4o-mini", "gpt-4.1-mini", "gpt-5-mini", "gpt-5-nano"];

  for (const model of preferred) {
    const match = candidates.find(
      (profile) => profile.provider === "openai" && profile.model === model
    );
    if (match) return match;
  }

  return null;
}

function routingStrategyFromEnv(): LLMRoutingStrategy {
  const raw = String(process.env.ONEAI_LLM_ROUTING_STRATEGY || "balanced").toLowerCase();
  if (raw === "cost" || raw === "quality" || raw === "fast") return raw;
  return "balanced";
}

export function getLLMRoutingStrategy(): LLMRoutingStrategy {
  return routingStrategyFromEnv();
}

function knownCost(profile: LLMModelProfile): number {
  const input = profile.inputCostPerToken;
  const output = profile.outputCostPerToken;
  if (typeof input !== "number" && typeof output !== "number") return Number.POSITIVE_INFINITY;
  return (input ?? 0) + (output ?? 0);
}

function qualityScore(profile: LLMModelProfile): number {
  const provider = String(profile.provider);
  const model = profile.model.toLowerCase();

  if (model.includes("gpt-5.2-pro")) return 100;
  if (model.includes("gpt-5.2")) return 98;
  if (model.includes("gpt-5.1")) return 96;
  if (model.includes("claude-opus")) return 96;
  if (model.includes("gemini-3-pro")) return 94;
  if (model.includes("claude-sonnet")) return 92;
  if (model.includes("grok-4")) return 90;
  if (model.includes("deepseek-reasoner")) return 88;
  if (model.includes("mistral-large")) return 86;
  if (model.includes("gpt-4.1")) return 84;
  if (model.includes("gemini-2.5-pro")) return 84;
  if (model.includes("qwen") || model.includes("kimi") || model.includes("glm")) return 78;
  if (provider === "openrouter") return 76;
  if (model.includes("gpt-4o-mini") || model.includes("gpt-5-mini")) return 74;
  if (model.includes("flash") || model.includes("mini") || model.includes("small")) return 68;
  return 60;
}

function strategySort(
  candidates: LLMModelProfile[],
  mode: LLMRoutingMode,
  strategy: LLMRoutingStrategy = routingStrategyFromEnv()
): LLMModelProfile[] {
  return [...candidates].sort((a, b) => {
    const configuredDelta =
      Number(isProviderConfigured(String(b.provider))) -
      Number(isProviderConfigured(String(a.provider)));
    if (configuredDelta !== 0) return configuredDelta;

    if (strategy === "quality" || mode === "premium") {
      const qualityDelta = qualityScore(b) - qualityScore(a);
      if (qualityDelta !== 0) return qualityDelta;
    }

    if (strategy === "fast" || mode === "fast") {
      const fastDelta = Number(b.modes.includes("fast")) - Number(a.modes.includes("fast"));
      if (fastDelta !== 0) return fastDelta;
    }

    const aCost = knownCost(a);
    const bCost = knownCost(b);
    if (aCost !== bCost) return aCost - bCost;

    return qualityScore(b) - qualityScore(a);
  });
}

export function rankModelProfiles(params: {
  provider?: string;
  mode?: LLMRoutingMode;
  strategy?: LLMRoutingStrategy;
  includeNonChat?: boolean;
}): LLMModelProfile[] {
  const mode = params.mode || "auto";
  return strategySort(
    listModelProfiles().filter((profile) => {
      if (params.provider && profile.provider !== params.provider) return false;
      if (!params.includeNonChat && !isChatCompletionsModel(profile)) return false;
      return profile.modes.includes(mode) || profile.modes.includes("auto");
    }),
    mode,
    params.strategy
  );
}

export function chooseModelForMode(params: {
  provider?: string;
  mode?: LLMRoutingMode;
  strategy?: LLMRoutingStrategy;
}) {
  const mode = params.mode || "auto";
  const strategy = params.strategy || routingStrategyFromEnv();
  const candidates = rankModelProfiles({ provider: params.provider, mode, strategy });

  if (!candidates.length) return null;

  const stable = strategy === "balanced" ? preferStableChatModel(candidates, params.provider, mode) : null;
  if (stable) return stable;

  return candidates[0];
}

export function fallbackModelsForMode(params: {
  provider: string;
  model: string;
  mode?: LLMRoutingMode;
  strategy?: LLMRoutingStrategy;
}): LLMModelProfile[] {
  const mode = params.mode || "auto";

  return rankModelProfiles({ mode, strategy: params.strategy || routingStrategyFromEnv() }).filter((profile) => {
    return !(profile.provider === params.provider && profile.model === params.model);
  });
}
