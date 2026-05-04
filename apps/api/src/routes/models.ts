import { Router } from "express";
import { requireApiKey } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { listModelProfiles } from "../core/llm/modelRegistry.js";

const router = Router();

router.use(requireApiKey);
router.use(rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }));

router.get("/", (_req, res) => {
  const now = Math.floor(Date.now() / 1000);

  return res.json({
    object: "list",
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

export default router;
