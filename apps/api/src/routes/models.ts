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
          const pricing =
            item.hasPricing
              ? {
                  inputPricePer1mTokens: item.inputPricePer1mTokens,
                  outputPricePer1mTokens: item.outputPricePer1mTokens,
                }
              : resolveLLMPricing(provider, item.model);

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
            hasPricing: item.hasPricing,
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
      const pricing = resolveLLMPricing(provider, profile.model);

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
        hasPricing: hasLLMPricing(provider, profile.model),
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
  return res.json({ success: true, data: result });
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
        pricing: resolveLLMPricing(provider, profile.model),
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

  const pricing = resolveLLMPricing(parsed.data.provider, parsed.data.model);
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
