import type { WorkflowContext, WorkflowStep } from "../types.js";

export function parseJsonStep<TInput, TData>(): WorkflowStep<
  WorkflowContext<TInput, TData>
> {
  return async (ctx) => {
    try {
      ctx.data = JSON.parse(ctx.rawText || "{}");
      return { ok: true };
    } catch {
      return { ok: false, error: "Invalid JSON format" };
    }
  };
}