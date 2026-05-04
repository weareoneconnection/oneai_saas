import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { listModelProfiles } from "../src/core/llm/modelRegistry.js";
import { isProviderConfigured } from "../src/core/llm/providerConfig.js";
import { hasLLMPricing, resolveLLMPricing } from "../src/core/llm/pricing.js";
import { getModelHealth } from "../src/core/llm/modelHealth.js";

config({ path: ".env" });
config({ path: "../../.env", override: false });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add it to apps/api/.env or repo root .env.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

function getPricingValue(pricing: any, keys: string[]) {
  if (!pricing) return null;

  for (const key of keys) {
    const value = pricing[key];
    if (typeof value === "number") return value;
  }

  return null;
}

function mapHealthStatus(health: any) {
  if (!health) return "UNKNOWN";
  if (health.ok === true) return "HEALTHY";
  if (health.ok === false) return "DOWN";
  return "UNKNOWN";
}

async function main() {
  const profiles = listModelProfiles();

  let count = 0;

  for (const profile of profiles) {
    const provider = String(profile.provider);
    const model = String(profile.model);

    const configured = isProviderConfigured(provider);
    const hasPricing = hasLLMPricing(provider, model);
    const pricing: any = resolveLLMPricing(provider, model);
    const health: any = getModelHealth(provider, model);

    const inputPricePer1mTokens = getPricingValue(pricing, [
      "inputPricePer1mTokens",
      "inputPer1MTokensUsd",
      "inputUsdPer1M",
      "input",
    ]);

    const outputPricePer1mTokens = getPricingValue(pricing, [
      "outputPricePer1mTokens",
      "outputPer1MTokensUsd",
      "outputUsdPer1M",
      "output",
    ]);

    await prisma.modelRegistry.upsert({
      where: {
        provider_model: {
          provider,
          model,
        },
      },
      update: {
        status: "ACTIVE",
        contextTokens: profile.contextTokens ?? null,
        supportsJson: profile.supportsJson ?? false,
        supportsTools: profile.supportsTools ?? false,
        supportsStreaming: true,
        configured,
        available: configured,
        hasPricing,
        inputPricePer1mTokens,
        outputPricePer1mTokens,
        healthStatus: mapHealthStatus(health),
        lastHealthCheckAt: health?.testedAt ? new Date(health.testedAt) : null,
        lastHealthMessage: health?.error ?? null,
        lastLatencyMs: typeof health?.latencyMs === "number" ? health.latencyMs : null,
      },
      create: {
        provider,
        model,
        displayName: `${provider}:${model}`,
        description: null,
        status: "ACTIVE",
        contextTokens: profile.contextTokens ?? null,
        supportsJson: profile.supportsJson ?? false,
        supportsTools: profile.supportsTools ?? false,
        supportsStreaming: true,
        supportsVision: false,
        configured,
        available: configured,
        hasPricing,
        inputPricePer1mTokens,
        outputPricePer1mTokens,
        healthStatus: mapHealthStatus(health),
        lastHealthCheckAt: health?.testedAt ? new Date(health.testedAt) : null,
        lastHealthMessage: health?.error ?? null,
        lastLatencyMs: typeof health?.latencyMs === "number" ? health.latencyMs : null,
      },
    });

    count += 1;
  }

  console.log(`Synced ${count} model profiles into ModelRegistry.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
