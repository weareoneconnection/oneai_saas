import type { WorkflowContext, WorkflowStep } from "./types.js";

export type WorkflowDefinition<TCtx extends WorkflowContext = WorkflowContext> = {
  name: string;
  maxAttempts: number;
  steps: WorkflowStep<TCtx>[];
};

export async function runWorkflow<TCtx extends WorkflowContext>(
  def: WorkflowDefinition<TCtx>,
  ctx: TCtx
): Promise<TCtx> {
  ctx.maxAttempts = def.maxAttempts;

  for (let attempt = 1; attempt <= def.maxAttempts; attempt++) {
    ctx.attempt = attempt;
    ctx.lastError = null;

    let ok = true;

    for (const step of def.steps) {
      const r = await step(ctx);
      if (!r.ok) {
        ok = false;
        ctx.lastError = r.error;
        break;
      }
    }

    if (ok) return ctx;
    // 自动修复回合：继续下一次 attempt
  }

  // 所有 attempts 失败
  return ctx;
}