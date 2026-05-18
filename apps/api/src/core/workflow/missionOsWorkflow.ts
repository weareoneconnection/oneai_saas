import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { missionOsValidator } from "../validators/missionOsValidator.js";
import { registerWorkflow } from "./registry.js";
import { checkTweetConstraints } from "../constraints/tweetConstraints.js";

export type MissionOsInput = {
  goal: string;
  targetAudience: string;
  brand?: string;
  link?: string;
  lang?: "en" | "zh";

  missionType?: "growth" | "community" | "content" | "builder" | "referral";
  difficulty?: "easy" | "medium" | "hard";
};

type Ctx = WorkflowContext<MissionOsInput, any>;

function checkMissionOsConstraints(data: any, link?: string) {
  const errors: string[] = [];

  if (!data?.mission_title) errors.push("mission_title required");
  if (!data?.objective) errors.push("objective required");
  if (!data?.first_action) errors.push("first_action required");

  if (!Array.isArray(data?.steps) || data.steps.length < 3) {
    errors.push("steps must be 3-10");
  }

  if (!data?.execution?.platforms?.length) {
    errors.push("execution.platforms required");
  }

  if (!data?.review_policy?.reviewMode) {
    errors.push("review_policy required");
  }

  if (!data?.reward_structure?.budgetCap) {
    errors.push("budgetCap required");
  }

  // ===== 💰 Economic guard（严格版）=====
  const reward = data.reward_structure;
  const cap = reward.budgetCap;

  const participation = parseFloat(
    (reward.participation_reward ?? "0").replace(/[^\d.]/g, "")
  );

  const total = participation * cap.maxParticipants;

  if (!isNaN(total) && total > cap.maxTotalReward) {
    errors.push("budget overflow: participation_reward * maxParticipants exceeds maxTotalReward");
  }

  // ===== 🐦 tweet 检查 =====
  const tweet = data?.recommendedCopy;
  if (tweet) {
    const r = checkTweetConstraints(tweet, link);
    if (!r.ok) errors.push(...r.errors);
  } else {
    errors.push("recommendedCopy required");
  }

  return { ok: errors.length === 0, errors };
}

export const missionOsWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "mission_os_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep({
      task: "mission_os",
      templateVersion: 1,
      variables: (input) => ({
        goal: input.goal,
        targetAudience: input.targetAudience,
        brand: input.brand ?? "WAOC",
        link: input.link ?? "",
        lang: input.lang ?? "en",
        missionType: input.missionType ?? "growth",
        difficulty: input.difficulty ?? "easy"
      })
    }),

    generateLLMStep(),
    parseJsonStep(),
    validateSchemaStep(missionOsValidator),

    refineJsonStep({
      check: (ctx) => checkMissionOsConstraints(ctx.data, ctx.input.link),
      extraInstruction:
        "Fix all validation errors. Ensure economics is realistic. Return ONLY JSON."
    }),

    parseJsonStep(),
    validateSchemaStep(missionOsValidator),

    // ===== 🔗 CTA 修复 =====
    async (ctx) => {
      const link = (ctx.input.link ?? "").trim();
      const copy = ctx.data.recommendedCopy;

      const normalize = (s: string) => {
        const stripped = (s ?? "").replace(/https?:\/\/\S+/g, "").trim();
        return link ? `${stripped} ${link}`.trim() : stripped;
      };

      copy.tweet_en = normalize(copy.tweet_en);
      copy.tweet_zh = normalize(copy.tweet_zh);
      copy.cta = normalize(copy.cta || "Join WAOC.");

      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "mission_os",
  def: missionOsWorkflowDef as any
});
