import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";
import { registerWorkflow } from "./registry.js";
import { oneclawExecuteValidator } from "../validators/oneclawExecuteValidator.js";
import { checkOneClawExecuteConstraints } from "../constraints/oneclawExecuteConstraints.js";
import { executeOneClawStep } from "./steps/executeOneClawStep.js";

export type OneClawExecuteInput = {
  message: string;
  lang?: "en" | "zh" | "mixed";
  defaultChatId?: string;
  defaultScreenshotPath?: string;
};

export type OneClawExecuteData = {
  reply: string;
  shouldExecute: boolean;
  oneclawTask: {
    taskName: string;
    steps: Array<{
      id: string;
      action:
        | "api.request"
        | "browser.open"
        | "browser.screenshot"
        | "file.read"
        | "file.write"
        | "message.send"
        | "social.post";
      input: Record<string, unknown>;
      dependsOn?: string[];
    }>;
  } | null;
};

type OneClawExecuteCtx = WorkflowContext<OneClawExecuteInput, OneClawExecuteData> & {
  templateVersion: number;
  meta?: {
    oneclawResult?: unknown;
  };
};

export const oneclawExecuteWorkflowDef: WorkflowDefinition<OneClawExecuteCtx> = {
  name: "oneclaw_execute_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep<OneClawExecuteInput, OneClawExecuteData>({
      task: "oneclaw_execute",
      templateVersion: 1,
      variables: (input) => ({
        message: input.message,
        lang: input.lang ?? "mixed",
        defaultChatId: input.defaultChatId ?? "",
        defaultScreenshotPath: input.defaultScreenshotPath ?? "screenshot.png"
      })
    }),

    generateLLMStep<OneClawExecuteInput, OneClawExecuteData>(),
    parseJsonStep<OneClawExecuteInput, OneClawExecuteData>(),
    validateSchemaStep<OneClawExecuteInput, OneClawExecuteData>(oneclawExecuteValidator),

    refineJsonStep<OneClawExecuteInput, OneClawExecuteData>({
      check: (ctx) => checkOneClawExecuteConstraints(ctx.data as any),
      extraInstruction:
        "Return valid JSON only. When shouldExecute=false, oneclawTask must be null. When shouldExecute=true, oneclawTask must contain taskName and at least one valid step."
    }),

    parseJsonStep<OneClawExecuteInput, OneClawExecuteData>(),
    validateSchemaStep<OneClawExecuteInput, OneClawExecuteData>(oneclawExecuteValidator),

    async (ctx: OneClawExecuteCtx) => {
      const result = checkOneClawExecuteConstraints(ctx.data as any);
      if (!result.ok) {
        return { ok: false, error: result.errors };
      }
      return { ok: true };
    },

    executeOneClawStep<OneClawExecuteInput, OneClawExecuteData>(),

    async (ctx: OneClawExecuteCtx) => {
      if (!ctx.data) {
        return { ok: false, error: ["internal: data undefined"] };
      }

      if (ctx.data.shouldExecute && ctx.meta?.oneclawResult) {
        (ctx.data as any).execution = ctx.meta.oneclawResult;
      }

      return { ok: true };
    }
  ]
};

registerWorkflow({
  task: "oneclaw_execute",
  def: oneclawExecuteWorkflowDef as any
});