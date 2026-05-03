import type { LLMProvider, LLMRoutingMode } from "./types.js";

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

const DEFAULT_MODEL = process.env.ONEAI_DEFAULT_MODEL || "gpt-4o-mini";

const DEFAULT_PROFILES: LLMModelProfile[] = [
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
    provider: "deepseek",
    model: "deepseek-chat",
    modes: ["cheap", "balanced", "auto"],
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
  return [
    ...DEFAULT_PROFILES,
    envProfile(),
    providerEnvProfile({
      provider: "openrouter",
      modelEnv: "OPENROUTER_MODEL",
      modes: ["cheap", "balanced", "premium", "fast", "auto"],
    }),
    groqProfile(),
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
  ].filter((x): x is LLMModelProfile => !!x);
}

export function findModelProfile(provider: string, model: string) {
  return listModelProfiles().find(
    (profile) => profile.provider === provider && profile.model === model
  );
}

export function chooseModelForMode(params: {
  provider?: string;
  mode?: LLMRoutingMode;
}) {
  const mode = params.mode || "auto";
  const candidates = listModelProfiles().filter((profile) => {
    if (params.provider && profile.provider !== params.provider) return false;
    return profile.modes.includes(mode) || profile.modes.includes("auto");
  });

  if (!candidates.length) return null;

  if (mode === "premium") {
    return candidates.find((profile) => profile.modes.includes("premium")) ?? candidates[0];
  }

  if (mode === "fast") {
    return candidates.find((profile) => profile.modes.includes("fast")) ?? candidates[0];
  }

  return [...candidates].sort((a, b) => {
    const aCost = (a.inputCostPerToken ?? 0) + (a.outputCostPerToken ?? 0);
    const bCost = (b.inputCostPerToken ?? 0) + (b.outputCostPerToken ?? 0);
    return aCost - bCost;
  })[0];
}

export function fallbackModelsForMode(params: {
  provider: string;
  model: string;
  mode?: LLMRoutingMode;
}): LLMModelProfile[] {
  const mode = params.mode || "auto";

  return listModelProfiles()
    .filter((profile) => {
      if (profile.provider === params.provider && profile.model === params.model) {
        return false;
      }

      return profile.modes.includes(mode) || profile.modes.includes("auto");
    })
    .sort((a, b) => {
      if (mode === "premium") {
        return Number(b.modes.includes("premium")) - Number(a.modes.includes("premium"));
      }

      if (mode === "fast") {
        return Number(b.modes.includes("fast")) - Number(a.modes.includes("fast"));
      }

      const aCost = (a.inputCostPerToken ?? 0) + (a.outputCostPerToken ?? 0);
      const bCost = (b.inputCostPerToken ?? 0) + (b.outputCostPerToken ?? 0);
      return aCost - bCost;
    });
}
