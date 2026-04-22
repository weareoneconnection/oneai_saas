import type { WorkflowContext, WorkflowStep } from "../types.js";
import { getOpenAIClient } from "../../llm/openaiClient.js";
import { logUsage } from "../../../utils/usageLogger.js";
import { addUsage } from "../../../utils/usageAggregate.js";

export function generateLLMStep<TInput, TData>(): WorkflowStep<
  WorkflowContext<TInput, TData>
> {
  return async (ctx) => {
    try {
      if (!ctx.model) {
        throw new Error("ctx.model is missing");
      }
      if (!ctx.systemPrompt) {
        throw new Error("ctx.systemPrompt is missing");
      }
      if (!ctx.userPrompt) {
        throw new Error("ctx.userPrompt is missing");
      }

      const client = getOpenAIClient();

      console.log("[generateLLMStep] request", {
        model: ctx.model,
        temperature: ctx.temperature ?? 0.7,
        systemPromptLength: ctx.systemPrompt.length,
        userPromptLength: ctx.userPrompt.length,
      });

      const completion = await client.chat.completions.create({
        model: ctx.model,
        messages: [
          { role: "system", content: ctx.systemPrompt },
          { role: "user", content: ctx.userPrompt }
        ],
        temperature: ctx.temperature ?? 0.7
      });

      const u = logUsage(completion);
      ctx.usage = u;
      addUsage(ctx, u);

      ctx.rawText = completion.choices[0]?.message?.content ?? "";

      return { ok: true };
    } catch (e: any) {
      console.error("[OPENAI RAW ERROR]", {
        name: e?.name,
        message: e?.message,
        status: e?.status,
        code: e?.code,
        type: e?.type,
        param: e?.param,
        stack: e?.stack,
      });

      const isLaunchMode = process.env.ONEAI_LAUNCH_MODE === "1";
      const message = String(e?.message ?? "");
      const lower = message.toLowerCase();

      const isQuotaError =
        lower.includes("compute time quota") ||
        lower.includes("exceeded the compute time") ||
        lower.includes("quota exhausted");

      if (isLaunchMode && isQuotaError) {
        console.warn("[generateLLMStep] launch mode quota bypass triggered");

        ctx.usage = {
          model: ctx.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
        } as any;

        ctx.rawText = JSON.stringify({
          reply: "OneAI is temporarily in launch mode fallback. Please try again shortly."
        });

        return { ok: true };
      }

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