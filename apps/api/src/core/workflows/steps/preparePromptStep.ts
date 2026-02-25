import type { WorkflowContext, WorkflowStep } from "../types.js";
import { loadTemplate } from "../../prompts/registry.js";
import { compileTemplate } from "../../prompts/compiler.js";
import { resolveModel } from "../../llm/modelRouter.js";

export type PreparePromptConfig<TInput> = {
  task: string; // e.g. "mission"
  templateVersion?: number;
  variables: (input: TInput) => Record<string, string>;
};

export function preparePromptStep<TInput, TData>(
  config: PreparePromptConfig<TInput>
): WorkflowStep<WorkflowContext<TInput, TData> & { templateVersion: number }> {
  return async (ctx) => {
    try {
      const templateVersion = ctx.templateVersion ?? config.templateVersion ?? 1;
      const template = loadTemplate(config.task, templateVersion);

      ctx.systemPrompt = template.system;
      ctx.userPrompt = compileTemplate(template.userTemplate, config.variables(ctx.input));

      const { model, temperature } = resolveModel(config.task as any);
      ctx.model = model;
      ctx.temperature = temperature;

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
}