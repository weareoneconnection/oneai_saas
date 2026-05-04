import { Router } from "express";
import { z } from "zod";
import { requireApiKey } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { findModelProfile, getModelCatalogSyncState, listModelProfiles } from "../core/llm/modelRegistry.js";
import { syncModelCatalog } from "../core/llm/modelCatalogSync.js";
import { isProviderConfigured } from "../core/llm/providerConfig.js";
import { estimateLLMCostUSD, hasLLMPricing, resolveLLMPricing } from "../core/llm/pricing.js";
import { getModelHealth, testModelHealth } from "../core/llm/modelHealth.js";

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

router.use(requireApiKey);
router.use(rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }));

router.get("/", (_req, res) => {
  const now = Math.floor(Date.now() / 1000);

  return res.json({
    object: "list",
    oneai: {
      catalogSync: getModelCatalogSyncState(),
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
