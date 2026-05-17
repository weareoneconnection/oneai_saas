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

export function listModelHealth() {
  return Array.from(healthByModel.entries()).map(([id, status]) => {
    const [provider, ...modelParts] = id.split(":");
    return {
      provider,
      model: modelParts.join(":"),
      ...status,
    };
  });
}

export function summarizeModelHealth(profiles: LLMModelProfile[]) {
  const configured = profiles.length;
  const statuses = profiles.map((profile) =>
    getModelHealth(String(profile.provider), profile.model)
  );
  const tested = statuses.filter(Boolean);
  const healthy = tested.filter((status) => status?.ok).length;
  const unhealthy = tested.filter((status) => status && !status.ok).length;
  const latencyValues = tested
    .map((status) => status?.latencyMs)
    .filter((value): value is number => typeof value === "number");

  return {
    configured,
    tested: tested.length,
    healthy,
    unhealthy,
    unknown: configured - tested.length,
    averageLatencyMs: latencyValues.length
      ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
      : null,
  };
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
