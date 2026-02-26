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
   Constraints
   (Keep minimal: ensure reply exists; avoid generic coaching openers)
========================= */

function checkWaocChatConstraints(data: WaocChatData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const reply = (data?.reply ?? "").trim();
  if (!reply) errors.push("reply must be non-empty");

  // ✅ prevent the most annoying non-human openers
  const lower = reply.toLowerCase();
  const bannedStarts = ["clarify", "focus on", "identify", "please clarify", "what specific area"];
  if (bannedStarts.some((s) => lower.startsWith(s))) {
    errors.push("reply too generic/coaching; answer directly like a normal person");
  }

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
        lang: input.lang ?? "en",
      }),
    }),

    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),

    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    // ✅ Keep refineJsonStep but change it to "soft clean-up" only
    // - no forcing questions
    // - no forcing CTAs
    // - just ensure valid JSON + non-empty reply + avoid banned generic openers
    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => checkWaocChatConstraints(ctx.data as any),
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."}.\n' +
        "- reply is required and must answer the user directly like a normal person (no coaching openers like 'Clarify' or 'Focus on').\n" +
        "- suggestedAction is optional and short.\n" +
        "- Do NOT force a follow-up question unless it truly helps.\n" +
        "- Keep it natural and WAOC-context aware.\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    async (ctx: WaocChatCtx) => {
      const r = checkWaocChatConstraints(ctx.data as any);
      if (!r.ok) return { ok: false, error: r.errors };

      if (!ctx.data) {
        return { ok: false, error: ["internal: data is undefined"] };
      }

      // ✅ IMPORTANT: disable "waoc_brain takeover" for chat naturalness.
      // This was making normal chat sound like a knowledge-base assistant.
      // Keep the code structure; just don't run it in chat mode.
      //
      // If you later want an explicit command to trigger waoc_brain,
      // do it via /brain or special prefix instead of auto-switching.

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});