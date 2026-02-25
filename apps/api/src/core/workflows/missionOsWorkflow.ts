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
};

export type MissionOsData = any; // 为了避免过度 TS 嵌套错误

type Ctx = WorkflowContext<MissionOsInput, MissionOsData> & {
  templateVersion: number;
};

function checkMissionOsConstraints(data: any, link?: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!(data?.mission_title ?? "").trim()) errors.push("mission_title required");
  if (!(data?.objective ?? "").trim()) errors.push("objective required");
  if (!Array.isArray(data?.steps) || data.steps.length < 3) errors.push("steps must be 3-10");

  if (!data?.proof?.proofType) errors.push("proof.proofType required");
  if (!data?.reward_structure?.scoring?.length) errors.push("reward_structure.scoring required");
  if (!data?.reward_structure?.budgetCap) errors.push("reward_structure.budgetCap required");

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
    preparePromptStep<MissionOsInput, MissionOsData>({
      task: "mission_os",
      templateVersion: 1,
      variables: (input) => ({
        goal: input.goal,
        targetAudience: input.targetAudience,
        brand: input.brand ?? "WAOC",
        link: input.link ?? "",
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<MissionOsInput, MissionOsData>(),
    parseJsonStep<MissionOsInput, MissionOsData>(),
    validateSchemaStep<MissionOsInput, MissionOsData>(missionOsValidator),

    refineJsonStep<MissionOsInput, MissionOsData>({
      check: (ctx) => checkMissionOsConstraints(ctx.data as any, ctx.input.link),
      extraInstruction:
        "Return ONLY valid JSON with all required fields. Ensure economic logic is consistent."
    }),

    parseJsonStep<MissionOsInput, MissionOsData>(),
    validateSchemaStep<MissionOsInput, MissionOsData>(missionOsValidator),

    /* =========================
       Final Guard Step
    ========================== */

    async (ctx: Ctx) => {
      const r = checkMissionOsConstraints(ctx.data as any, ctx.input.link);
      if (!r.ok) return { ok: false, error: r.errors };

      // ✅ TS 安全保护
      if (!ctx.data) {
        return { ok: false, error: ["internal: data undefined"] };
      }

      const reward = ctx.data.reward_structure;
      const cap = reward.budgetCap;

      // ===== 🧮 Economic Guard =====
      const participationReward = parseFloat(
        (reward.participation_reward ?? "0").replace(/[^\d.]/g, "")
      );

      const maxParticipants = cap.maxParticipants ?? 0;

      const estimatedTotal = participationReward * maxParticipants;

      if (!isNaN(estimatedTotal) && estimatedTotal > cap.maxTotalReward) {
        cap.maxTotalReward = estimatedTotal;
      }
      // =============================

      // ===== 🔗 推荐文案链接修正 =====
      if (ctx.data.recommendedCopy) {
        const link = (ctx.input.link ?? "").trim();
        const copy = ctx.data.recommendedCopy;

        if (link) {
          const cleaned = (copy.cta ?? "").replace(/https?:\/\/\S+/g, "").trim();
          copy.cta = (cleaned ? cleaned + " " : "") + link;

          copy.tweet_en = (copy.tweet_en ?? "").replace(/https?:\/\/\S+/g, link);
          copy.tweet_zh = (copy.tweet_zh ?? "").replace(/https?:\/\/\S+/g, link);
        } else {
          const strip = (s: string) => (s ?? "").replace(/https?:\/\/\S+/g, "").trim();
          copy.cta = strip(copy.cta) || "Join the WAOC community.";
          copy.tweet_en = strip(copy.tweet_en);
          copy.tweet_zh = strip(copy.tweet_zh);
        }
      }
      // =============================

      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "mission_os",
  def: missionOsWorkflowDef as any
});