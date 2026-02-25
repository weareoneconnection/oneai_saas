import { runTask } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocChatValidator } from "../validators/waocChatValidator.js";
import { registerWorkflow } from "./registry.js";

/* =========================
   Types
========================= */

export type WaocChatInput = {
  message: string;
  context?: "community" | "mission" | "philosophy" | "general";
  lang?: "en" | "zh";
};

export type WaocChatData = {
  reply: string;
  suggestedAction?: string;
};

type WaocChatCtx = WorkflowContext<WaocChatInput, WaocChatData> & {
  templateVersion: number;
};

/* =========================
   Constraints (must match refineJsonStep type)
========================= */

function checkWaocChatConstraints(data: WaocChatData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const reply = (data?.reply ?? "").trim();
  if (!reply) errors.push("reply must be non-empty");

  if (data?.suggestedAction && data.suggestedAction.length > 200) {
    errors.push("suggestedAction too long (max 200 chars)");
  }

  return { ok: errors.length === 0, errors };
}

/* =========================
   Workflow
========================= */

export const waocChatWorkflowDef: WorkflowDefinition<WaocChatCtx> = {
  name: "waoc_chat_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocChatInput, WaocChatData>({
      task: "waoc_chat",
      templateVersion: 1,
      variables: (input) => ({
        message: input.message,
        context: input.context ?? "general",
        lang: input.lang ?? "en"
      })
    }),

    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),

    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => checkWaocChatConstraints(ctx.data as any),
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."} reply must be non-empty. suggestedAction is optional and short.'
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    async (ctx: WaocChatCtx) => {
  const r = checkWaocChatConstraints(ctx.data as any);
  if (!r.ok) return { ok: false, error: r.errors };

  if (!ctx.data) {
    return { ok: false, error: ["internal: data is undefined"] };
  }

  const msg = (ctx.input.message || "").toLowerCase();

  const knowledgeTriggers = [
    "what is",
    "how does",
    "how do i",
    "explain",
    "guide",
    "tutorial",
    "mission",
    "start",
    "什么是",
    "如何",
    "怎么",
    "介绍",
    "原理"
  ];

  const looksLikeKnowledge = knowledgeTriggers.some((k) =>
    msg.includes(k)
  );

  if (looksLikeKnowledge) {
    const brainResult = await runTask(
      "waoc_brain",
      {
        question: ctx.input.message,
        lang: ctx.input.lang ?? "en"
      },
      { templateVersion: 1 }
    );

    if (brainResult.success) {
      ctx.data.reply = brainResult.data.answer;
      if (brainResult.data.links?.length) {
        ctx.data.suggestedAction =
          "Learn more: " + brainResult.data.links.join(" | ");
      }
    }
  }

  return { ok: true };
}
  ]
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any
});