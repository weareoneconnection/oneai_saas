import type { WorkflowContext } from "./types.js";
import { runWorkflow, type WorkflowDefinition } from "./engine.js";
import type { LLMOverrides } from "../llm/types.js";
import { applyTaskDifficultyRouting } from "../llm/taskDifficulty.js";

type AnyWorkflowDef = WorkflowDefinition<any>;
type AnyRunner = (
  input: any,
  options?: { templateVersion?: number; maxAttempts?: number; llm?: LLMOverrides }
) => Promise<any>;

const workflows = new Map<string, AnyRunner>();

/**
 * 注册一个任务 workflow
 */
export function registerWorkflow<TInput, TData>(params: {
  task: string;
  def: WorkflowDefinition<WorkflowContext<TInput, TData> & { templateVersion: number }>;
}) {
  const { task, def } = params;

  const runner: AnyRunner = async (
    input: any,
    options?: { templateVersion?: number; maxAttempts?: number; llm?: LLMOverrides }
  ) => {
    const ctx: any = {
      task,
      input,
      attempt: 0,
      maxAttempts: options?.maxAttempts ?? def.maxAttempts ?? 3,
      templateVersion: options?.templateVersion ?? 1,
      templateVersionOverride: options?.templateVersion,
      llm: applyTaskDifficultyRouting({
        task,
        input,
        overrides: options?.llm,
      })
    };

    const finalCtx = await runWorkflow(def as AnyWorkflowDef, ctx);

    const success = !!finalCtx.data && !finalCtx.lastError;

    return {
      success,
      attempts: finalCtx.attempt,
      usage: finalCtx.usage ?? null,                 // last call
      usageTotal: finalCtx.usageTotal ?? null,       // aggregated
      usageSteps: finalCtx.usageSteps ?? null,       // per-call (debug)
      llmTrace: finalCtx.llmTrace ?? null,
      llmTraceSteps: finalCtx.llmTraceSteps ?? null,
      data: finalCtx.data ?? null,
      error: success ? null : finalCtx.lastError
    };
  };

  workflows.set(task, runner);
}

/**
 * 执行某个任务
 */
export async function runTask<TInput>(
  task: string,
  input: TInput,
  options?: { templateVersion?: number; maxAttempts?: number; llm?: LLMOverrides }
) {
  const runner = workflows.get(task);
  if (!runner) {
    return {
      success: false,
      attempts: 0,
      usage: null,
      usageTotal: null,
      usageSteps: null,
      llmTrace: null,
      llmTraceSteps: null,
      data: null,
      error: `No workflow registered for task: ${task}`
    };
  }
  return runner(input, options);
}

/**
 * 调试：列出所有已注册任务
 */
export function listTasks() {
  return Array.from(workflows.keys());
}
