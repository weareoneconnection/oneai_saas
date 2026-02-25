import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocBrainValidator } from "../validators/waocBrainValidator.js";
import { registerWorkflow } from "./registry.js";

/* =========================
   Types
========================= */

export type WaocBrainInput = {
  question: string;
  lang?: "en" | "zh";
};

export type WaocBrainData = {
  answer: string;
  links?: string[];
};

type Ctx = WorkflowContext<WaocBrainInput, WaocBrainData> & {
  templateVersion: number;
};

/* =========================
   Constraints
========================= */

function checkConstraints(data: WaocBrainData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!(data?.answer ?? "").trim()) {
    errors.push("answer required");
  }

  if (data?.links && data.links.length > 6) {
    errors.push("links max 6");
  }

  return { ok: errors.length === 0, errors };
}

/* =========================
   Workflow Definition
========================= */

export const waocBrainWorkflowDef: WorkflowDefinition<Ctx> = {
  name: "waoc_brain_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocBrainInput, WaocBrainData>({
      task: "waoc_brain",
      templateVersion: 1,
      variables: (input) => ({
        question: input.question,
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<WaocBrainInput, WaocBrainData>(),
    parseJsonStep<WaocBrainInput, WaocBrainData>(),

    validateSchemaStep<WaocBrainInput, WaocBrainData>(waocBrainValidator),

    refineJsonStep<WaocBrainInput, WaocBrainData>({
      check: (ctx) => checkConstraints(ctx.data as any),
      extraInstruction:
        "Return ONLY JSON. Provide a clear, practical answer. links field is optional."
    }),

    parseJsonStep<WaocBrainInput, WaocBrainData>(),
    validateSchemaStep<WaocBrainInput, WaocBrainData>(waocBrainValidator),

    /* =========================
       Final Step: Inject Official Links
    ========================== */

    async (ctx: Ctx) => {
      const r = checkConstraints(ctx.data as any);
      if (!r.ok) {
        return { ok: false, error: r.errors };
      }

      // 防止 TS 报 ctx.data undefined
      if (!ctx.data) {
        return { ok: false, error: ["internal: data undefined"] };
      }

      const {
        WAOC_SITE_URL,
        WAOC_COMMUNITY_URL,
        ONE_MISSION_URL,
        ONE_FIELD_URL
      } = process.env;

      const question = (ctx.input.question || "").toLowerCase();

      const officialLinks: string[] = [];

      // 根据问题语义简单判断
      if (question.includes("mission") && ONE_MISSION_URL) {
        officialLinks.push(ONE_MISSION_URL);
      }

      if (question.includes("field") && ONE_FIELD_URL) {
        officialLinks.push(ONE_FIELD_URL);
      }

      // 默认永远附带官网 + 社区
      if (WAOC_SITE_URL) officialLinks.push(WAOC_SITE_URL);
      if (WAOC_COMMUNITY_URL) officialLinks.push(WAOC_COMMUNITY_URL);

      // ✅ 完全覆盖模型生成的 links（不 merge）
      ctx.data.links = [...new Set(officialLinks)].slice(0, 3);

      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "waoc_brain",
  def: waocBrainWorkflowDef as any
});