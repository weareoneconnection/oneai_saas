import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";
import { normalizeTweetStep } from "./steps/normalizeTweetStep.js";

import { waocSocialPostValidator } from "../validators/waocSocialPostValidator.js";
import { registerWorkflow } from "./registry.js";
import { checkTweetConstraints } from "../constraints/tweetConstraints.js";

export type WaocSocialPostInput = {
  topic: string;
  audience?: string;
  tone?: string;
  brand?: string;
  link?: string;
  mode?: "tweet" | "announcement" | "thread";
};

export type WaocSocialPostData = {
  tweet_zh: string;
  tweet_en: string;
  hashtags: string[];
  cta: string;
};

type Ctx = WorkflowContext<WaocSocialPostInput, WaocSocialPostData> & { templateVersion: number };

export const waocSocialPostWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "waoc_social_post_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocSocialPostInput, WaocSocialPostData>({
      task: "waoc_social_post",
      templateVersion: 1,
      variables: (input) => ({
        mode: input.mode ?? "tweet",
        topic: input.topic,
        audience: input.audience ?? "WAOC community / builders / creators",
        tone: input.tone ?? "visionary but practical",
        brand: input.brand ?? "WAOC",
        link: input.link ?? ""
      })
    }),

    generateLLMStep<WaocSocialPostInput, WaocSocialPostData>(),
    parseJsonStep<WaocSocialPostInput, WaocSocialPostData>(),

    // 复用 tweet 的兜底
    normalizeTweetStep<WaocSocialPostInput>(),

    validateSchemaStep<WaocSocialPostInput, WaocSocialPostData>(waocSocialPostValidator),

    refineJsonStep<WaocSocialPostInput, WaocSocialPostData>({
      check: (ctx) => checkTweetConstraints(ctx.data as any, ctx.input.link),
      extraInstruction:
        "Keep tweet_zh and tweet_en under 260 chars each. Keep hashtags 3-6. cta must include link if provided."
    }),

    parseJsonStep<WaocSocialPostInput, WaocSocialPostData>(),
    normalizeTweetStep<WaocSocialPostInput>(),
    validateSchemaStep<WaocSocialPostInput, WaocSocialPostData>(waocSocialPostValidator),

    async (ctx: Ctx) => {
      const r = checkTweetConstraints(ctx.data as any, ctx.input.link);
      if (!r.ok) return { ok: false, error: r.errors };
      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "waoc_social_post",
  def: waocSocialPostWorkflowDef as any
});