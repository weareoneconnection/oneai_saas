import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocNarrativeValidator } from "../validators/waocNarrativeValidator.js";
import { registerWorkflow } from "./registry.js";

export type WaocNarrativeInput = {
  topic: string;
  depth?: "short" | "medium" | "long";
  lang?: "en" | "zh";
};

export type WaocNarrativeData = {
  content: string;
};

type Ctx = WorkflowContext<WaocNarrativeInput, WaocNarrativeData> & { templateVersion: number };

function checkConstraints(data: WaocNarrativeData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!(data?.content ?? "").trim()) errors.push("content required");
  return { ok: errors.length === 0, errors };
}

export const waocNarrativeWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "waoc_narrative_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocNarrativeInput, WaocNarrativeData>({
      task: "waoc_narrative",
      templateVersion: 1,
      variables: (input) => ({
        topic: input.topic,
        depth: input.depth ?? "medium",
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<WaocNarrativeInput, WaocNarrativeData>(),
    parseJsonStep<WaocNarrativeInput, WaocNarrativeData>(),

    validateSchemaStep<WaocNarrativeInput, WaocNarrativeData>(waocNarrativeValidator),

    refineJsonStep<WaocNarrativeInput, WaocNarrativeData>({
      check: (ctx) => checkConstraints(ctx.data as any),
      extraInstruction: "Return ONLY JSON with a non-empty content field."
    }),

    parseJsonStep<WaocNarrativeInput, WaocNarrativeData>(),
    validateSchemaStep<WaocNarrativeInput, WaocNarrativeData>(waocNarrativeValidator),

    async (ctx: Ctx) => {
      const r = checkConstraints(ctx.data as any);
      if (!r.ok) return { ok: false, error: r.errors };
      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "waoc_narrative",
  def: waocNarrativeWorkflowDef as any
});