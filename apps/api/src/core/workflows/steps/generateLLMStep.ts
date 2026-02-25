import type { WorkflowContext, WorkflowStep } from "../types.js";
import { getOpenAIClient } from "../../llm/openaiClient.js";
import { logUsage } from "../../../utils/usageLogger.js";
import { addUsage } from "../../../utils/usageAggregate.js";

export function generateLLMStep<TInput, TData>(): WorkflowStep<
  WorkflowContext<TInput, TData>
> {
  return async (ctx) => {
    try {
      const client = getOpenAIClient();

      const completion = await client.chat.completions.create({
        model: ctx.model!,
        messages: [
          { role: "system", content: ctx.systemPrompt! },
          { role: "user", content: ctx.userPrompt! }
        ],
        temperature: ctx.temperature ?? 0.7
      });

      const u = logUsage(completion);
      ctx.usage = u;      // last-call usage
      addUsage(ctx, u);   // aggregate usage

      ctx.rawText = completion.choices[0].message.content ?? "";

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
}