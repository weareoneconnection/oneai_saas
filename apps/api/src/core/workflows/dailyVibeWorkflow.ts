import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { dailyVibeValidator } from "../validators/dailyVibeValidator.js";
import { registerWorkflow } from "./registry.js";

export type DailyVibeInput = {
  theme?: string;
  lang?: "en" | "zh";
};

export type DailyVibeData = {
  quote: string;
  shortVersion: string;
};

type Ctx = WorkflowContext<DailyVibeInput, DailyVibeData> & { templateVersion: number };

function checkConstraints(data: DailyVibeData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!(data?.quote ?? "").trim()) errors.push("quote required");
  if (!(data?.shortVersion ?? "").trim()) errors.push("shortVersion required");
  if ((data?.shortVersion ?? "").length > 140) errors.push("shortVersion too long (<= 140 chars)");
  return { ok: errors.length === 0, errors };
}

export const dailyVibeWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "daily_vibe_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<DailyVibeInput, DailyVibeData>({
      task: "daily_vibe",
      templateVersion: 1,
      variables: (input) => ({
        theme: input.theme ?? "connection, courage, and calm momentum",
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<DailyVibeInput, DailyVibeData>(),
    parseJsonStep<DailyVibeInput, DailyVibeData>(),

    validateSchemaStep<DailyVibeInput, DailyVibeData>(dailyVibeValidator),

    refineJsonStep<DailyVibeInput, DailyVibeData>({
      check: (ctx) => checkConstraints(ctx.data as any),
      extraInstruction:
        "Return ONLY JSON. shortVersion must be <= 140 characters. Keep tone warm and uplifting."
    }),

    parseJsonStep<DailyVibeInput, DailyVibeData>(),
    validateSchemaStep<DailyVibeInput, DailyVibeData>(dailyVibeValidator),

    async (ctx: Ctx) => {
      const r = checkConstraints(ctx.data as any);
      if (!r.ok) return { ok: false, error: r.errors };
      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "daily_vibe",
  def: dailyVibeWorkflowDef as any
});