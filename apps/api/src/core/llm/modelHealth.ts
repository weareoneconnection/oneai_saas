import { generateLLMText } from "./providerClient.js";
import type { LLMModelProfile } from "./modelRegistry.js";

export type ModelHealthStatus = {
  ok: boolean;
  testedAt: string;
  latencyMs?: number;
  error?: string;
  responseModel?: string;
};

const healthByModel = new Map<string, ModelHealthStatus>();

function healthKey(provider: string, model: string) {
  return `${provider}:${model}`;
}

export function getModelHealth(provider: string, model: string) {
  return healthByModel.get(healthKey(provider, model)) || null;
}

export async function testModelHealth(profile: LLMModelProfile): Promise<ModelHealthStatus> {
  const startedAt = Date.now();
  const provider = String(profile.provider);

  try {
    const result = await generateLLMText({
      provider,
      model: profile.model,
      temperature: 0,
      maxTokens: 8,
      messages: [
        {
          role: "user",
          content: "Reply with only: ok",
        },
      ],
    });

    const status: ModelHealthStatus = {
      ok: true,
      testedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      responseModel: result.usage.model || profile.model,
    };
    healthByModel.set(healthKey(provider, profile.model), status);
    return status;
  } catch (error) {
    const status: ModelHealthStatus = {
      ok: false,
      testedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
    healthByModel.set(healthKey(provider, profile.model), status);
    return status;
  }
}
