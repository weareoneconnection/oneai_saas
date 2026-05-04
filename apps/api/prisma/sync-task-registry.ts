import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import "../src/core/workflow/init.js";
import { getTaskCatalog } from "../src/core/tasks/catalog.js";

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

function normalizeTier(value: unknown) {
  const tier = String(value || "free").toLowerCase();

  if (["free", "pro", "team", "enterprise"].includes(tier)) {
    return tier;
  }

  return "free";
}

function normalizeMaturity(value: unknown) {
  const maturity = String(value || "BETA").toUpperCase();

  if (["ALPHA", "BETA", "STABLE", "DEPRECATED"].includes(maturity)) {
    return maturity as "ALPHA" | "BETA" | "STABLE" | "DEPRECATED";
  }

  return "BETA";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

async function main() {
  const catalog = getTaskCatalog() as any[];

  let count = 0;

  for (const item of catalog) {
    const task = String(item.task || item.type || item.id || item.name || "").trim();

    if (!task) {
      console.warn("Skipping task without task/type/id/name:", item);
      continue;
    }

    await prisma.taskRegistry.upsert({
      where: {
        task,
      },
      update: {
        displayName: String(item.displayName || item.title || item.name || task),
        description: item.description ? String(item.description) : null,
        category: item.category ? String(item.category) : null,
        tier: normalizeTier(item.tier || item.plan || item.requiredPlan),
        maturity: normalizeMaturity(item.maturity || item.status),
        enabled: item.enabled !== false,
        inputSchema: item.inputSchema ?? item.input_schema ?? null,
        outputSchema: item.outputSchema ?? item.output_schema ?? null,
        defaultProvider: item.defaultProvider ? String(item.defaultProvider) : null,
        defaultModel: item.defaultModel ? String(item.defaultModel) : null,
        defaultMode: item.defaultMode ? String(item.defaultMode) : null,
        allowedModels: asStringArray(item.allowedModels),
        allowedProviders: asStringArray(item.allowedProviders),
        exampleInput: item.exampleInput ?? item.example_input ?? null,
        exampleOutput: item.exampleOutput ?? item.example_output ?? null,
      },
      create: {
        task,
        displayName: String(item.displayName || item.title || item.name || task),
        description: item.description ? String(item.description) : null,
        category: item.category ? String(item.category) : null,
        tier: normalizeTier(item.tier || item.plan || item.requiredPlan),
        maturity: normalizeMaturity(item.maturity || item.status),
        enabled: item.enabled !== false,
        inputSchema: item.inputSchema ?? item.input_schema ?? null,
        outputSchema: item.outputSchema ?? item.output_schema ?? null,
        defaultProvider: item.defaultProvider ? String(item.defaultProvider) : null,
        defaultModel: item.defaultModel ? String(item.defaultModel) : null,
        defaultMode: item.defaultMode ? String(item.defaultMode) : null,
        allowedModels: asStringArray(item.allowedModels),
        allowedProviders: asStringArray(item.allowedProviders),
        exampleInput: item.exampleInput ?? item.example_input ?? null,
        exampleOutput: item.exampleOutput ?? item.example_output ?? null,
      },
    });

    count += 1;
  }

  console.log(`Synced ${count} task catalog items into TaskRegistry.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
