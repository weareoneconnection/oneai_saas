import { Router } from "express";
import { requireApiKey } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { getModelCatalogSyncState, listModelProfiles } from "../core/llm/modelRegistry.js";
import { syncModelCatalog } from "../core/llm/modelCatalogSync.js";

const router = Router();

router.use(requireApiKey);
router.use(rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }));

router.get("/", (_req, res) => {
  const now = Math.floor(Date.now() / 1000);

  return res.json({
    object: "list",
    oneai: {
      catalogSync: getModelCatalogSyncState(),
    },
    data: listModelProfiles().map((profile) => ({
      id: `${profile.provider}:${profile.model}`,
      object: "model",
      created: now,
      owned_by: String(profile.provider),
      provider: profile.provider,
      model: profile.model,
      modes: profile.modes,
      contextTokens: profile.contextTokens ?? null,
      supportsJson: profile.supportsJson ?? false,
      supportsTools: profile.supportsTools ?? false,
    })),
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

export default router;
