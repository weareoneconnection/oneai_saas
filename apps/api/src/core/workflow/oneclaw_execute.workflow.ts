// src/core/workflow/oneclawExecuteWorkflow.ts

import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { registerWorkflow } from "./registry.js";
import { oneclawExecuteValidator } from "../validators/oneclawExecuteValidator.js";

/**
 * Universal Execute V4 (Relaxed Planner)
 *
 * 设计目标：
 * - 最大化 AI 规划自由度
 * - 只保留最小结构与安全底线
 * - 不在 workflow 层过度限制 action / input
 * - 允许未来 worker / action 无缝扩展
 */

export type OneClawAction =
  | "content.generate"
  | "content.transform"
  | "api.request"
  | "browser.open"
  | "browser.screenshot"
  | "file.read"
  | "file.write"
  | "message.send"
  | "social.post"
  | "result.compose"
  | (string & {});

export type OneClawStep = {
  id: string;
  action: OneClawAction;
  input: Record<string, unknown>;
  dependsOn?: string[];
};

export type OneClawTask = {
  taskName: string;
  steps: OneClawStep[];
};

export type OneClawExecuteInput = {
  message: string;
  lang?: "en" | "zh" | "mixed";
  defaultChatId?: string;
  defaultScreenshotPath?: string;
};

export type OneClawExecuteData = {
  reply: string;
  shouldExecute: boolean;
  oneclawTask: OneClawTask | null;
};

type OneClawExecuteCtx = WorkflowContext<
  OneClawExecuteInput,
  OneClawExecuteData
> & {
  templateVersion: number;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeAction(value: unknown): OneClawAction {
  return String(value ?? "").trim() as OneClawAction;
}

function normalizeDependsOn(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v).trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function normalizeOneClawPlan(data: unknown): OneClawExecuteData {
  const raw = isObjectRecord(data) ? data : {};

  const reply = String(raw.reply ?? "").trim();
  const shouldExecute = Boolean(raw.shouldExecute);

  let oneclawTask: OneClawTask | null = null;

  if (shouldExecute && isObjectRecord(raw.oneclawTask)) {
    const rawTask = raw.oneclawTask;
    const rawSteps = Array.isArray(rawTask.steps) ? rawTask.steps : [];

    oneclawTask = {
      taskName:
        String(rawTask.taskName ?? "oneclaw_task").trim() || "oneclaw_task",
      steps: rawSteps.map((step, index) => {
        const s = isObjectRecord(step) ? step : {};

        return {
          id: String(s.id ?? `step_${index + 1}`).trim() || `step_${index + 1}`,
          action: normalizeAction(s.action),
          input: isObjectRecord(s.input) ? s.input : {},
          dependsOn: normalizeDependsOn(s.dependsOn),
        };
      }),
    };
  }

  return {
    reply: reply || (shouldExecute ? "Task planned." : "No execution needed."),
    shouldExecute,
    oneclawTask: shouldExecute ? oneclawTask : null,
  };
}

/**
 * Relaxed constraints:
 * - 不限制 action 白名单
 * - 不限制具体 input 字段
 * - 不强校验 dependsOn 是否存在
 * - 只防止最明显的结构错误
 */
export function checkOneClawExecuteConstraints(data: OneClawExecuteData) {
  const errors: string[] = [];

  if (!isNonEmptyString(data.reply)) {
    errors.push("reply is required.");
  }

  if (data.shouldExecute && !data.oneclawTask) {
    errors.push("oneclawTask is required when shouldExecute=true.");
  }

  if (!data.shouldExecute && data.oneclawTask !== null) {
    errors.push("oneclawTask must be null when shouldExecute=false.");
  }

  if (!data.oneclawTask) {
    return { ok: errors.length === 0, errors };
  }

  if (!isNonEmptyString(data.oneclawTask.taskName)) {
    errors.push("taskName is required.");
  }

  if (!Array.isArray(data.oneclawTask.steps) || data.oneclawTask.steps.length === 0) {
    errors.push("steps must contain at least one item.");
    return { ok: false, errors };
  }

  const ids = new Set<string>();

  for (const step of data.oneclawTask.steps) {
    if (!isNonEmptyString(step.id)) {
      errors.push("every step must have a non-empty id.");
      continue;
    }

    if (ids.has(step.id)) {
      errors.push(`duplicate step id: ${step.id}`);
    }
    ids.add(step.id);

    if (!isNonEmptyString(step.action)) {
      errors.push(`step ${step.id} action is required.`);
    }

    if (!isObjectRecord(step.input)) {
      errors.push(`step ${step.id} input must be an object.`);
    }

    for (const dep of step.dependsOn ?? []) {
      if (dep === step.id) {
        errors.push(`step ${step.id} cannot depend on itself`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export const oneclawExecuteWorkflowDef: WorkflowDefinition<OneClawExecuteCtx> = {
  name: "oneclaw_execute_workflow",
  maxAttempts: 3,

  steps: [
    preparePromptStep<OneClawExecuteInput, OneClawExecuteData>({
      task: "oneclaw_execute",
      templateVersion: 4,
      variables: (input) => ({
        message: input.message,
        lang: input.lang ?? "mixed",
        defaultChatId: input.defaultChatId ?? "",
        defaultScreenshotPath: input.defaultScreenshotPath ?? "screenshot.png",
      }),
    }),

    generateLLMStep<OneClawExecuteInput, OneClawExecuteData>(),

    parseJsonStep<OneClawExecuteInput, OneClawExecuteData>(),

    async (ctx: OneClawExecuteCtx) => {
      ctx.data = normalizeOneClawPlan(ctx.data);
      return { ok: true };
    },

    validateSchemaStep<OneClawExecuteInput, OneClawExecuteData>(
      oneclawExecuteValidator
    ),

    refineJsonStep<OneClawExecuteInput, OneClawExecuteData>({
      check: (ctx) =>
        checkOneClawExecuteConstraints(ctx.data as OneClawExecuteData),
      extraInstruction: [
        "Return valid JSON only.",
        "Do not add markdown or commentary.",
        "Keep reply useful and user-facing.",
        "If shouldExecute=false, oneclawTask must be null.",
        "If shouldExecute=true, oneclawTask must include taskName and at least one step.",
        "Keep steps executable and logically ordered.",
        "You may use any suitable action string if needed.",
        "You may use flexible input fields as long as the structure stays valid.",
        "Prefer rich multi-step planning when it improves the result.",
        "Do not collapse everything into one step unless the request is truly simple."
      ].join(" "),
    }),

    parseJsonStep<OneClawExecuteInput, OneClawExecuteData>(),

    async (ctx: OneClawExecuteCtx) => {
      ctx.data = normalizeOneClawPlan(ctx.data);
      return { ok: true };
    },

    validateSchemaStep<OneClawExecuteInput, OneClawExecuteData>(
      oneclawExecuteValidator
    ),

    async (ctx: OneClawExecuteCtx) => {
      const result = checkOneClawExecuteConstraints(
        ctx.data as OneClawExecuteData
      );

      if (!result.ok) {
        return { ok: false, error: result.errors };
      }

      if (!ctx.data) {
        return { ok: false, error: ["internal: data undefined"] };
      }

      // planning only: do not execute OneClaw here
      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "oneclaw_execute",
  def: oneclawExecuteWorkflowDef as any,
});