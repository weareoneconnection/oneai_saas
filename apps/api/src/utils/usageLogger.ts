import { estimateLLMCostUSD } from "../core/llm/pricing.js";

export type UsageRecord = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  createdAt: string;
};


export function logUsage(completion: any): UsageRecord {
  const usage = completion.usage;

  const record: UsageRecord = {
    model: completion.model,
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
    estimatedCostUSD: estimateLLMCostUSD({
      model: completion.model,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
    }),
    createdAt: new Date().toISOString()
  };

  console.log("📊 Token Usage:", record);

  return record;
}