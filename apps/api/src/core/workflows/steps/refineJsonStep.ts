import type { WorkflowContext, WorkflowStep } from "../types.js";
import { getOpenAIClient } from "../../llm/openaiClient.js";
import { logUsage } from "../../../utils/usageLogger.js";
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
      const client = getOpenAIClient();

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

      const completion = await client.chat.completions.create({
        model: ctx.model!,
        messages: [
          { role: "system", content: "You output strict JSON only. Constraints override all other instructions." },
          { role: "user", content: repairPrompt }
        ],
        temperature: 0.2
      });

      const u = logUsage(completion);
      ctx.usage = u;
      addUsage(ctx, u);

      ctx.rawText = completion.choices[0].message.content ?? "{}";

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
}