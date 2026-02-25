import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { missionEnhancerValidator } from "../validators/missionEnhancerValidator.js";
import { registerWorkflow } from "./registry.js";

export type MissionEnhancerInput = {
  title: string;
  description: string;
  goal?: string;
  lang?: "en" | "zh";
};

export type MissionEnhancerData = {
  optimizedDescription: string;
  rewardSuggestion: string;
  viralTweet: {
    tweet_zh: string;
    tweet_en: string;
    hashtags: string[];
    cta: string;
  };
};

type Ctx = WorkflowContext<MissionEnhancerInput, MissionEnhancerData> & { templateVersion: number };

function checkConstraints(data: MissionEnhancerData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!(data?.optimizedDescription ?? "").trim()) errors.push("optimizedDescription required");
  if (!(data?.rewardSuggestion ?? "").trim()) errors.push("rewardSuggestion required");
  if (!(data?.viralTweet?.tweet_en ?? "").trim()) errors.push("viralTweet.tweet_en required");
  if (!(data?.viralTweet?.tweet_zh ?? "").trim()) errors.push("viralTweet.tweet_zh required");
  if (!Array.isArray(data?.viralTweet?.hashtags) || data.viralTweet.hashtags.length < 3)
    errors.push("viralTweet.hashtags must be 3-8");
  if (!(data?.viralTweet?.cta ?? "").trim()) errors.push("viralTweet.cta required");
  return { ok: errors.length === 0, errors };
}

export const missionEnhancerWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "mission_enhancer_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<MissionEnhancerInput, MissionEnhancerData>({
      task: "mission_enhancer",
      templateVersion: 1,
      variables: (input) => ({
        title: input.title,
        description: input.description,
        goal: input.goal ?? "",
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<MissionEnhancerInput, MissionEnhancerData>(),
    parseJsonStep<MissionEnhancerInput, MissionEnhancerData>(),

    validateSchemaStep<MissionEnhancerInput, MissionEnhancerData>(missionEnhancerValidator),

    refineJsonStep<MissionEnhancerInput, MissionEnhancerData>({
      check: (ctx) => checkConstraints(ctx.data as any),
      extraInstruction:
        "Return ONLY valid JSON with all required fields. viralTweet must include 3-6 hashtags and a short CTA."
    }),

    parseJsonStep<MissionEnhancerInput, MissionEnhancerData>(),
    validateSchemaStep<MissionEnhancerInput, MissionEnhancerData>(missionEnhancerValidator),

    async (ctx: Ctx) => {
      const r = checkConstraints(ctx.data as any);
      if (!r.ok) return { ok: false, error: r.errors };
      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "mission_enhancer",
  def: missionEnhancerWorkflowDef as any
});