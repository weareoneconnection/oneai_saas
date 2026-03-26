import { executeOneClawTask } from "../../../clients/oneclawClient.js";

export function executeOneClawStep<TInput, TData extends {
  shouldExecute: boolean;
  oneclawTask: any;
}>() {
  return async (ctx: any) => {
    if (!ctx.data?.shouldExecute || !ctx.data?.oneclawTask) {
      return { ok: true };
    }

    try {
      const result = await executeOneClawTask(ctx.data.oneclawTask);
      ctx.meta = ctx.meta ?? {};
      ctx.meta.oneclawResult = result;
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown OneClaw execution error";
      return { ok: false, error: [message] };
    }
  };
}