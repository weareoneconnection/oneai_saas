import type { WorkflowContext, WorkflowStep } from "../types.js";
import { generateLLMText } from "../../llm/providerClient.js";
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

      console.log("[generateLLMStep] request", {
        provider: ctx.provider ?? "openai",
        model: ctx.model,
        temperature: ctx.temperature ?? 0.7,
        maxTokens: ctx.maxTokens,
        systemPromptLength: ctx.systemPrompt.length,
        userPromptLength: ctx.userPrompt.length,
      });

      const result = await generateLLMText({
        provider: ctx.provider ?? "openai",
        model: ctx.model,
        temperature: ctx.temperature ?? 0.7,
        ...(ctx.maxTokens ? { maxTokens: ctx.maxTokens } : {}),
        ...(ctx.baseURL ? { baseURL: ctx.baseURL } : {}),
        ...(ctx.apiKeyEnv ? { apiKeyEnv: ctx.apiKeyEnv } : {}),
        ...(ctx.fallbacks ? { fallbacks: ctx.fallbacks } : {}),
        messages: [
          { role: "system", content: ctx.systemPrompt },
          { role: "user", content: ctx.userPrompt },
        ],
      });

      ctx.usage = result.usage;
      addUsage(ctx, result.usage);
      ctx.llmTrace = result.trace;
      ctx.llmTraceSteps = ctx.llmTraceSteps ?? [];
      ctx.llmTraceSteps.push(result.trace);

      ctx.rawText = result.text;

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
          provider: ctx.provider ?? "openai",
          model: ctx.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUSD: 0,
          estimatedCostUsd: 0,
          createdAt: new Date().toISOString(),
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
