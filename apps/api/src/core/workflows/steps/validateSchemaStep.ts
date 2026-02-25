import type { WorkflowContext, WorkflowStep } from "../types.js";

export type Validator = {
  validate: (data: any) => { ok: boolean; errors: any };
};

export function validateSchemaStep<TInput, TData>(
  validator: Validator
): WorkflowStep<WorkflowContext<TInput, TData>> {
  return async (ctx) => {
    const r = validator.validate(ctx.data);
    if (!r.ok) return { ok: false, error: r.errors ?? "Schema validation failed" };
    return { ok: true };
  };
}