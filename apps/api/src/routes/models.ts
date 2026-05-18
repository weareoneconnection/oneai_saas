import { Router } from "express";
import { z } from "zod";
import { requireApiKey } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import {
  findModelProfile,
  getLLMRoutingStrategy,
  getModelCatalogSyncState,
  listModelProfiles,
  rankModelProfiles,
} from "../core/llm/modelRegistry.js";
import { syncModelCatalog } from "../core/llm/modelCatalogSync.js";
import { configuredProviders, isProviderConfigured } from "../core/llm/providerConfig.js";
import { estimateLLMCostUSD, hasLLMPricing, resolveLLMPricing } from "../core/llm/pricing.js";
import {
  getModelHealth,
  listModelHealth,
  summarizeModelHealth,
  testModelHealth,
} from "../core/llm/modelHealth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

function enrichPricing(
  pricing: any,
  params: {
    source?: "database" | "registry" | "built_in";
    updatedAt?: string | null;
  } = {}
) {
  if (!pricing) return null;

  const inputCostPerToken =
    Number(pricing.inputCostPerToken) ||
    Number(pricing.inputPricePer1mTokens) / 1_000_000 ||
    Number(pricing.inputCostPer1MTokens) / 1_000_000 ||
    0;
  const outputCostPerToken =
    Number(pricing.outputCostPerToken) ||
    Number(pricing.outputPricePer1mTokens) / 1_000_000 ||
    Number(pricing.outputCostPer1MTokens) / 1_000_000 ||
    0;
  const inputCostPer1MTokens =
    Number(pricing.inputCostPer1MTokens) ||
    Number(pricing.inputPricePer1mTokens) ||
    inputCostPerToken * 1_000_000;
  const outputCostPer1MTokens =
    Number(pricing.outputCostPer1MTokens) ||
    Number(pricing.outputPricePer1mTokens) ||
    outputCostPerToken * 1_000_000;
  const pricingSource = params.source || pricing.source || "registry";

  return {
    ...pricing,
    inputCostPerToken,
    outputCostPerToken,
    inputCostPer1MTokens,
    outputCostPer1MTokens,
    inputPricePer1mTokens: inputCostPer1MTokens,
    outputPricePer1mTokens: outputCostPer1MTokens,
    currency: "USD",
    source: pricingSource,
    pricingSource,
    updatedAt: params.updatedAt || pricing.updatedAt || null,
    per1MTokens: {
      input: inputCostPer1MTokens,
      output: outputCostPer1MTokens,
    },
  };
}

function getPricingPer1M(pricing: any, direction: "input" | "output") {
  if (!pricing) return null;

  const value =
    direction === "input"
      ? pricing.inputCostPer1MTokens ?? pricing.inputPricePer1mTokens ?? pricing.per1MTokens?.input
      : pricing.outputCostPer1MTokens ?? pricing.outputPricePer1mTokens ?? pricing.per1MTokens?.output;

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function persistModelProfilesToRegistry() {
  const profiles = listModelProfiles();
  let count = 0;

  for (let index = 0; index < profiles.length; index += 25) {
    const chunk = profiles.slice(index, index + 25);
    await Promise.all(
      chunk.map((profile) => {
        const provider = String(profile.provider);
        const model = String(profile.model);
        const configured = isProviderConfigured(provider);
        const pricing = enrichPricing(resolveLLMPricing(provider, model));
        const health: any = getModelHealth(provider, model);
        const data = {
          status: "ACTIVE" as const,
          displayName: `${provider}:${model}`,
          contextTokens: profile.contextTokens ?? null,
          supportsStreaming: true,
          supportsJson: profile.supportsJson ?? false,
          supportsTools: profile.supportsTools ?? false,
          configured,
          available: configured,
          hasPricing: !!pricing,
          inputPricePer1mTokens: getPricingPer1M(pricing, "input"),
          outputPricePer1mTokens: getPricingPer1M(pricing, "output"),
          healthStatus: health?.ok === true ? ("HEALTHY" as const) : health?.ok === false ? ("DOWN" as const) : ("UNKNOWN" as const),
          lastHealthCheckAt: health?.testedAt ? new Date(health.testedAt) : null,
          lastHealthMessage: health?.error ?? null,
          lastLatencyMs: typeof health?.latencyMs === "number" ? health.latencyMs : null,
        };

        return prisma.modelRegistry.upsert({
          where: {
            provider_model: {
              provider,
              model,
            },
          },
          update: data,
          create: {
            provider,
            model,
            ...data,
            description: null,
            supportsVision: false,
          },
        });
      })
    );

    count += chunk.length;
  }

  return count;
}

const healthSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
});

const estimateSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptTokens: z.number().int().min(0).max(10_000_000).default(0),
  completionTokens: z.number().int().min(0).max(10_000_000).default(0),
});

const healthBatchSchema = z.object({
  providers: z.array(z.string().min(1)).max(24).optional(),
  configuredOnly: z.boolean().default(true),
  limit: z.number().int().min(1).max(50).default(12),
});

const routePreviewSchema = z.object({
  provider: z.string().min(1).optional(),
  mode: z.enum(["cheap", "balanced", "premium", "fast", "auto"]).default("balanced"),
  strategy: z.enum(["balanced", "cost", "quality", "fast"]).optional(),
  limit: z.number().int().min(1).max(30).default(8),
});

router.use(requireApiKey);
router.use(rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }));

router.get("/", async (_req, res) => {
  const now = Math.floor(Date.now() / 1000);

  try {
    const registryModels = await prisma.modelRegistry.findMany({
      orderBy: [
        { provider: "asc" },
        { model: "asc" },
      ],
    });

    if (registryModels.length > 0) {
      return res.json({
        object: "list",
        oneai: {
          catalogSync: getModelCatalogSyncState(),
          source: "database",
        },
        data: registryModels.map((item) => {
          const provider = String(item.provider);
          const configured = item.configured || isProviderConfigured(provider);
          const rawPricing =
            item.hasPricing
              ? {
                  inputPricePer1mTokens: item.inputPricePer1mTokens,
                  outputPricePer1mTokens: item.outputPricePer1mTokens,
                }
              : resolveLLMPricing(provider, item.model);
          const pricing = enrichPricing(rawPricing, {
            source: item.hasPricing ? "database" : undefined,
            updatedAt: item.updatedAt.toISOString(),
          });

          return {
            id: `${item.provider}:${item.model}`,
            object: "model",
            created: Math.floor(item.createdAt.getTime() / 1000),
            owned_by: provider,

            provider: item.provider,
            model: item.model,
            displayName: item.displayName,
            description: item.description,

            modes: [],
            contextTokens: item.contextTokens ?? null,
            maxOutputTokens: item.maxOutputTokens ?? null,

            supportsStreaming: item.supportsStreaming,
            supportsJson: item.supportsJson,
            supportsTools: item.supportsTools,
            supportsVision: item.supportsVision,

            configured,
            available: item.available && configured,
            hasPricing: item.hasPricing || !!pricing,
            pricing,

            status: item.status,
            health: {
              status: item.healthStatus ?? "UNKNOWN",
              testedAt: item.lastHealthCheckAt?.toISOString() ?? null,
              error: item.lastHealthMessage ?? null,
              latencyMs: item.lastLatencyMs ?? null,
              runtime: getModelHealth(provider, item.model),
            },

            updatedAt: item.updatedAt.toISOString(),
          };
        }),
      });
    }
  } catch (error) {
    console.error("[models] Failed to read ModelRegistry, falling back to in-memory catalog:", error);
  }

  return res.json({
    object: "list",
    oneai: {
      catalogSync: getModelCatalogSyncState(),
      source: "memory_fallback",
    },
    data: listModelProfiles().map((profile) => {
      const provider = String(profile.provider);
      const pricing = enrichPricing(resolveLLMPricing(provider, profile.model));

      return {
        id: `${profile.provider}:${profile.model}`,
        object: "model",
        created: now,
        owned_by: provider,
        provider: profile.provider,
        model: profile.model,
        modes: profile.modes,
        contextTokens: profile.contextTokens ?? null,
        supportsJson: profile.supportsJson ?? false,
        supportsTools: profile.supportsTools ?? false,
        configured: isProviderConfigured(provider),
        available: isProviderConfigured(provider),
        hasPricing: hasLLMPricing(provider, profile.model) || !!pricing,
        pricing,
        health: getModelHealth(provider, profile.model),
      };
    }),
  });
});

router.post("/sync", async (req, res) => {
  const r = req as any;
  if (!r.auth?.isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Model catalog sync requires admin API key",
      code: "MODEL_SYNC_FORBIDDEN",
    });
  }

  const result = await syncModelCatalog();
  let registryCount: number | null = null;

  try {
    registryCount = await persistModelProfilesToRegistry();
  } catch (error) {
    console.error("[models] Failed to persist synced model catalog:", error);
  }

  return res.json({
    success: true,
    data: {
      ...result,
      registryCount,
    },
  });
});

router.get("/infrastructure", (_req, res) => {
  const profiles = listModelProfiles();
  const keys = configuredProviders();
  const configured = profiles.filter((profile) => isProviderConfigured(String(profile.provider)));
  const priced = profiles.filter((profile) => hasLLMPricing(String(profile.provider), profile.model));
  const providerNames = Array.from(new Set(profiles.map((profile) => String(profile.provider)))).sort();

  return res.json({
    success: true,
    data: {
      routing: {
        strategy: getLLMRoutingStrategy(),
        autoFallbacks: process.env.ONEAI_LLM_AUTO_FALLBACKS === "1",
        autoFallbackLimit: Number(process.env.ONEAI_LLM_AUTO_FALLBACK_LIMIT || 2),
      },
      providers: {
        total: providerNames.length,
        configured: Object.values(keys).filter(Boolean).length,
        keys,
      },
      catalog: {
        totalModels: profiles.length,
        pricedModels: priced.length,
        pricingCoveragePct: profiles.length ? Math.round((priced.length / profiles.length) * 100) : 0,
        synced: getModelCatalogSyncState(),
      },
      health: {
        summary: summarizeModelHealth(configured),
        runtime: listModelHealth(),
      },
      recommendedRoutes: {
        cheap: rankModelProfiles({ mode: "cheap", strategy: "cost" }).slice(0, 5),
        balanced: rankModelProfiles({ mode: "balanced", strategy: "balanced" }).slice(0, 5),
        premium: rankModelProfiles({ mode: "premium", strategy: "quality" }).slice(0, 5),
        fast: rankModelProfiles({ mode: "fast", strategy: "fast" }).slice(0, 5),
      },
    },
  });
});

router.post("/health", async (req, res) => {
  const r = req as any;
  if (!r.auth?.isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Model health check requires admin API key",
      code: "MODEL_HEALTH_FORBIDDEN",
    });
  }

  const parsed = healthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "provider and model are required",
      code: "MODEL_HEALTH_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const profile = findModelProfile(parsed.data.provider, parsed.data.model);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: "model not found",
      code: "MODEL_NOT_FOUND",
    });
  }

  if (!isProviderConfigured(String(profile.provider))) {
    const status = {
      ok: false,
      testedAt: new Date().toISOString(),
      error: `${profile.provider} API key is not configured`,
    };
    return res.json({ success: true, data: status });
  }

  const status = await testModelHealth(profile);
  return res.json({ success: true, data: status });
});

router.post("/health/batch", async (req, res) => {
  const r = req as any;
  if (!r.auth?.isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Batch model health checks require admin API key",
      code: "MODEL_HEALTH_FORBIDDEN",
    });
  }

  const parsed = healthBatchSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "invalid health batch request",
      code: "MODEL_HEALTH_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const providers = new Set(parsed.data.providers || []);
  const profiles = listModelProfiles()
    .filter((profile) => !providers.size || providers.has(String(profile.provider)))
    .filter((profile) => !parsed.data.configuredOnly || isProviderConfigured(String(profile.provider)))
    .slice(0, parsed.data.limit);

  const results = [];
  for (const profile of profiles) {
    const provider = String(profile.provider);
    if (!isProviderConfigured(provider)) {
      results.push({
        provider,
        model: profile.model,
        ok: false,
        testedAt: new Date().toISOString(),
        error: `${provider} API key is not configured`,
      });
      continue;
    }

    const status = await testModelHealth(profile);
    results.push({
      provider,
      model: profile.model,
      ...status,
    });
  }

  return res.json({
    success: true,
    data: {
      count: results.length,
      summary: summarizeModelHealth(profiles),
      results,
    },
  });
});

router.post("/route/preview", (req, res) => {
  const parsed = routePreviewSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "invalid route preview request",
      code: "MODEL_ROUTE_PREVIEW_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const candidates = rankModelProfiles({
    provider: parsed.data.provider,
    mode: parsed.data.mode,
    strategy: parsed.data.strategy || getLLMRoutingStrategy(),
  })
    .slice(0, parsed.data.limit)
    .map((profile) => {
      const provider = String(profile.provider);
      return {
        provider,
        model: profile.model,
        modes: profile.modes,
        configured: isProviderConfigured(provider),
        available: isProviderConfigured(provider),
        hasPricing: hasLLMPricing(provider, profile.model),
        pricing: enrichPricing(resolveLLMPricing(provider, profile.model)),
        health: getModelHealth(provider, profile.model),
      };
    });

  return res.json({
    success: true,
    data: {
      mode: parsed.data.mode,
      strategy: parsed.data.strategy || getLLMRoutingStrategy(),
      selected: candidates[0] || null,
      candidates,
    },
  });
});

router.post("/estimate", (req, res) => {
  const parsed = estimateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "provider, model, promptTokens and completionTokens are required",
      code: "MODEL_ESTIMATE_BAD_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  const profile = findModelProfile(parsed.data.provider, parsed.data.model);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: "model not found",
      code: "MODEL_NOT_FOUND",
    });
  }

  const pricing = enrichPricing(resolveLLMPricing(parsed.data.provider, parsed.data.model));
  const estimatedCostUsd = estimateLLMCostUSD({
    provider: parsed.data.provider,
    model: parsed.data.model,
    promptTokens: parsed.data.promptTokens,
    completionTokens: parsed.data.completionTokens,
  });

  return res.json({
    success: true,
    data: {
      provider: parsed.data.provider,
      model: parsed.data.model,
      promptTokens: parsed.data.promptTokens,
      completionTokens: parsed.data.completionTokens,
      totalTokens: parsed.data.promptTokens + parsed.data.completionTokens,
      canEstimate: !!pricing,
      pricing,
      estimatedCostUsd,
    },
  });
});

export default router;
