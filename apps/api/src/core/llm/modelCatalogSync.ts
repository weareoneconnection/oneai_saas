import { updateSyncedModelProfiles, type LLMModelProfile } from "./modelRegistry.js";

type SyncResult = {
  ok: boolean;
  syncedAt: string;
  count: number;
  providers: Record<string, number>;
  errors: Array<{ provider: string; error: string }>;
};

type CatalogSource = {
  provider: string;
  keyEnv: string;
  url: string | (() => string);
  dataPath?: "data" | "models";
  headers?: () => Record<string, string>;
  modelFilter?: (profile: LLMModelProfile) => boolean;
};

function hasEnv(name: string) {
  return !!process.env[name]?.trim();
}

function inferModes(provider: string, model: string): LLMModelProfile["modes"] {
  const id = model.toLowerCase();
  if (
    id.includes("nano") ||
    id.includes("mini") ||
    id.includes("flash") ||
    id.includes("small") ||
    id.includes("haiku") ||
    id.includes("fast")
  ) {
    return ["cheap", "fast", "auto"];
  }
  if (
    id.includes("pro") ||
    id.includes("opus") ||
    id.includes("large") ||
    id.includes("gpt-5") ||
    id.includes("grok-4")
  ) {
    return ["balanced", "premium", "auto"];
  }
  if (provider === "groq" || provider === "cerebras") return ["fast", "balanced", "auto"];
  return ["cheap", "balanced", "auto"];
}

function normalizeModel(provider: string, item: any): LLMModelProfile | null {
  const rawModel = String(item?.id || item?.name || item?.model || "").trim();
  const model = rawModel.replace(/^models\//, "");
  if (!model) return null;

  const promptPrice = Number(
    item?.pricing?.prompt ??
      item?.pricing?.input ??
      item?.input_cost_per_token ??
      item?.inputCostPerToken
  );
  const completionPrice = Number(
    item?.pricing?.completion ??
      item?.pricing?.output ??
      item?.output_cost_per_token ??
      item?.outputCostPerToken
  );
  const contextTokens = Number(
    item?.context_length ??
      item?.contextLength ??
      item?.max_context_length ??
      item?.input_token_limit ??
      item?.inputTokenLimit
  );
  const hasPricing = Number.isFinite(promptPrice) || Number.isFinite(completionPrice);

  return {
    provider,
    model,
    modes: inferModes(provider, model),
    supportsJson: true,
    supportsTools: /gpt|claude|gemini|grok|mistral|glm/i.test(model),
    ...(Number.isFinite(contextTokens) && contextTokens > 0 ? { contextTokens } : {}),
    ...(hasPricing
      ? {
          inputCostPerToken: Number.isFinite(promptPrice) ? promptPrice : 0,
          outputCostPerToken: Number.isFinite(completionPrice) ? completionPrice : 0,
        }
      : {}),
  };
}

async function fetchCatalog(source: CatalogSource): Promise<LLMModelProfile[]> {
  const key = process.env[source.keyEnv]?.trim();
  if (!key) return [];

  const res = await fetch(typeof source.url === "function" ? source.url() : source.url, {
    headers: source.headers?.() || {
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) throw new Error(`${source.provider} models failed: HTTP ${res.status}`);

  const json = await res.json();
  const rows = Array.isArray(json?.[source.dataPath || "data"]) ? json[source.dataPath || "data"] : [];

  return rows
    .map((item: any) => normalizeModel(source.provider, item))
    .filter((x: LLMModelProfile | null): x is LLMModelProfile => !!x)
    .filter((profile: LLMModelProfile) => source.modelFilter?.(profile) ?? true);
}

const catalogSources: CatalogSource[] = [
  {
    provider: "openai",
    keyEnv: "OPENAI_API_KEY",
    url: "https://api.openai.com/v1/models",
    modelFilter: (profile) => /^(gpt|o\d)/i.test(profile.model),
  },
  {
    provider: "openrouter",
    keyEnv: "OPENROUTER_API_KEY",
    url: "https://openrouter.ai/api/v1/models",
  },
  {
    provider: "anthropic",
    keyEnv: "ANTHROPIC_API_KEY",
    url: "https://api.anthropic.com/v1/models",
    headers: () => ({
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    }),
    modelFilter: (profile) => /^claude/i.test(profile.model),
  },
  {
    provider: "gemini",
    keyEnv: "GEMINI_API_KEY",
    url: () => {
      const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
      url.searchParams.set("key", process.env.GEMINI_API_KEY || "");
      return url.toString();
    },
    dataPath: "models",
    headers: () => ({}),
    modelFilter: (profile) => /^gemini/i.test(profile.model),
  },
  {
    provider: "mistral",
    keyEnv: "MISTRAL_API_KEY",
    url: "https://api.mistral.ai/v1/models",
    modelFilter: (profile) => /mistral|ministral|codestral/i.test(profile.model),
  },
  {
    provider: "xai",
    keyEnv: "XAI_API_KEY",
    url: "https://api.x.ai/v1/models",
    modelFilter: (profile) => /^grok/i.test(profile.model),
  },
  {
    provider: "deepseek",
    keyEnv: "DEEPSEEK_API_KEY",
    url: "https://api.deepseek.com/v1/models",
    modelFilter: (profile) => /^deepseek/i.test(profile.model),
  },
];

export async function syncModelCatalog(): Promise<SyncResult> {
  const errors: SyncResult["errors"] = [];
  const batches = await Promise.all(
    catalogSources.map((source) =>
      fetchCatalog(source).catch((err) => {
        errors.push({ provider: source.provider, error: String(err?.message || err) });
        return [];
      })
    )
  );

  const seen = new Set<string>();
  const profiles = batches
    .flat()
    .filter((profile) => {
      const key = `${profile.provider}:${profile.model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  updateSyncedModelProfiles(profiles);

  const providers = profiles.reduce<Record<string, number>>((acc, profile) => {
    acc[String(profile.provider)] = (acc[String(profile.provider)] || 0) + 1;
    return acc;
  }, {});

  return {
    ok: errors.length === 0,
    syncedAt: new Date().toISOString(),
    count: profiles.length,
    providers,
    errors,
  };
}
