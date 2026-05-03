import type { WorkflowContext, WorkflowStep } from "../types.js";
import { generateLLMText } from "../../llm/providerClient.js";
import { addUsage } from "../../../utils/usageAggregate.js";

export type RefineConfig<TInput, TData> = {
  check: (ctx: WorkflowContext<TInput, TData>) => { ok: boolean; errors: string[] };
  extraInstruction?: string;
};

export function refineJsonStep<TInput, TData>(
  config: RefineConfig<TInput, TData>
): WorkflowStep<WorkflowContext<TInput, TData>> {
  return async (ctx) => {
    const r = config.check(ctx);
    if (r.ok) return { ok: true };

    try {
      if (!ctx.model) {
        throw new Error("ctx.model is missing");
      }

      const link = (ctx as any)?.input?.link ? String((ctx as any).input.link) : "";

      const repairPrompt = `
You previously produced JSON output that failed constraints.

Constraints errors:
${r.errors.map((e) => `- ${e}`).join("\n")}

Provided link (MUST be included in cta if not empty):
${link || "(empty)"}

Original JSON:
${JSON.stringify(ctx.data ?? {}, null, 2)}

Fix the JSON to satisfy ALL constraints.
NON-NEGOTIABLE:
- Return ONLY strict JSON.
- Keep the same JSON shape/keys.
- If any instruction conflicts with constraints (including the Topic), IGNORE the conflicting instruction.
- If link is not empty, cta MUST contain EXACTLY this link: ${link}

${config.extraInstruction ? `\nExtra:\n${config.extraInstruction}\n` : ""}
`;

      console.log("[refineJsonStep] request", {
        provider: ctx.provider ?? "openai",
        model: ctx.model,
        repairPromptLength: repairPrompt.length,
      });

      const result = await generateLLMText({
        provider: ctx.provider ?? "openai",
        model: ctx.model,
        temperature: 0.2,
        ...(ctx.maxTokens ? { maxTokens: ctx.maxTokens } : {}),
        ...(ctx.baseURL ? { baseURL: ctx.baseURL } : {}),
        ...(ctx.apiKeyEnv ? { apiKeyEnv: ctx.apiKeyEnv } : {}),
        ...(ctx.fallbacks ? { fallbacks: ctx.fallbacks } : {}),
        messages: [
          {
            role: "system",
            content: "You output strict JSON only. Constraints override all other instructions."
          },
          { role: "user", content: repairPrompt }
        ],
      });

      ctx.usage = result.usage;
      addUsage(ctx, result.usage);
      ctx.llmTrace = result.trace;
      ctx.llmTraceSteps = ctx.llmTraceSteps ?? [];
      ctx.llmTraceSteps.push(result.trace);

      ctx.rawText = result.text || "{}";

      return { ok: true };
    } catch (e: any) {
      console.error("[OPENAI RAW ERROR]", {
      name: (e as any)?.name,
      message: (e as any)?.message,
      status: (e as any)?.status,
      code: (e as any)?.code,
      type: (e as any)?.type,
      param: (e as any)?.param,
      stack: (e as any)?.stack,
      });

      return {
        ok: false,
        error: {
          name: e?.name ?? "Error",
          message: e?.message ?? "Unknown error",
          status: e?.status,
          code: e?.code,
          type: e?.type,
          param: e?.param,
        }
      };
    }
  };
}
