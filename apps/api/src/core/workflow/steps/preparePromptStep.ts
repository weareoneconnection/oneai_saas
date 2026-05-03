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
      const templateVersion =
        ctx.templateVersionOverride ?? config.templateVersion ?? ctx.templateVersion ?? 1;
      const template = loadTemplate(config.task, templateVersion);

      ctx.systemPrompt = template.system;
      ctx.userPrompt = compileTemplate(template.userTemplate, config.variables(ctx.input));

      const { provider, model, temperature, maxTokens, baseURL, apiKeyEnv, fallbacks } =
        resolveModel(config.task, ctx.llm);
      ctx.provider = provider;
      ctx.model = model;
      ctx.temperature = temperature;
      ctx.maxTokens = maxTokens;
      ctx.baseURL = baseURL;
      ctx.apiKeyEnv = apiKeyEnv;
      ctx.fallbacks = fallbacks;

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
}
