export function addUsage(ctx: any, usageRecord: any) {
  if (!usageRecord) return;

  ctx.usageSteps = ctx.usageSteps ?? [];
  ctx.usageSteps.push(usageRecord);

  const total = ctx.usageTotal ?? {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUSD: 0
  };

  total.promptTokens += usageRecord.promptTokens ?? 0;
  total.completionTokens += usageRecord.completionTokens ?? 0;
  total.totalTokens += usageRecord.totalTokens ?? 0;
  total.estimatedCostUSD += usageRecord.estimatedCostUSD ?? 0;

  ctx.usageTotal = total;
}