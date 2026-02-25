export type UsageRecord = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  createdAt: string;
};

/**
 * 根据模型估算成本
 * 这里只是示例价格（可调整）
 */
function estimateCost(model: string, prompt: number, completion: number) {
  const pricing = {
    "gpt-4o-mini": {
      prompt: 0.00000015,
      completion: 0.0000006
    }
  };

  const modelKey = Object.keys(pricing).find((key) =>
    model.startsWith(key)
  );

  if (!modelKey) return 0;

  const price = pricing[modelKey as keyof typeof pricing];

  return (
    prompt * price.prompt +
    completion * price.completion
  );
}

export function logUsage(completion: any): UsageRecord {
  const usage = completion.usage;

  const record: UsageRecord = {
    model: completion.model,
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
    estimatedCostUSD: estimateCost(
      completion.model,
      usage?.prompt_tokens ?? 0,
      usage?.completion_tokens ?? 0
    ),
    createdAt: new Date().toISOString()
  };

  console.log("📊 Token Usage:", record);

  return record;
}