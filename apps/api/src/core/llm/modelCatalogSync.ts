import { updateSyncedModelProfiles, type LLMModelProfile } from "./modelRegistry.js";

type SyncResult = {
  ok: boolean;
  syncedAt: string;
  count: number;
  providers: Record<string, number>;
  errors: Array<{ provider: string; error: string }>;
};

function hasEnv(name: string) {
  return !!process.env[name]?.trim();
}

function inferModes(provider: string, model: string): LLMModelProfile["modes"] {
  const id = model.toLowerCase();
  if (id.includes("nano") || id.includes("mini") || id.includes("flash") || id.includes("small")) {
    return ["cheap", "fast", "auto"];
  }
  if (id.includes("pro") || id.includes("opus") || id.includes("gpt-5") || id.includes("grok-4")) {
    return ["balanced", "premium", "auto"];
  }
  if (provider === "groq" || provider === "cerebras") return ["fast", "balanced", "auto"];
  return ["cheap", "balanced", "auto"];
}

function normalizeModel(provider: string, item: any): LLMModelProfile | null {
  const model = String(item?.id || item?.name || item?.model || "").trim();
  if (!model) return null;

  return {
    provider,
    model,
    modes: inferModes(provider, model),
    supportsJson: true,
    supportsTools: /gpt|claude|gemini|grok|mistral|glm/i.test(model),
  };
}

async function fetchOpenAIModels(): Promise<LLMModelProfile[]> {
  if (!hasEnv("OPENAI_API_KEY")) return [];

  const res = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  if (!res.ok) throw new Error(`OpenAI models failed: HTTP ${res.status}`);
  const json = await res.json();
  return (Array.isArray(json?.data) ? json.data : [])
    .map((item: any) => normalizeModel("openai", item))
    .filter((x: LLMModelProfile | null): x is LLMModelProfile => !!x)
    .filter((profile: LLMModelProfile) =>
      /^(gpt|o\d)/i.test(profile.model)
    );
}

async function fetchOpenRouterModels(): Promise<LLMModelProfile[]> {
  if (!hasEnv("OPENROUTER_API_KEY")) return [];

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  });

  if (!res.ok) throw new Error(`OpenRouter models failed: HTTP ${res.status}`);
  const json = await res.json();
  return (Array.isArray(json?.data) ? json.data : [])
    .map((item: any) => normalizeModel("openrouter", item))
    .filter((x: LLMModelProfile | null): x is LLMModelProfile => !!x);
}

export async function syncModelCatalog(): Promise<SyncResult> {
  const errors: SyncResult["errors"] = [];
  const batches = await Promise.all([
    fetchOpenAIModels().catch((err) => {
      errors.push({ provider: "openai", error: String(err?.message || err) });
      return [];
    }),
    fetchOpenRouterModels().catch((err) => {
      errors.push({ provider: "openrouter", error: String(err?.message || err) });
      return [];
    }),
  ]);

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

