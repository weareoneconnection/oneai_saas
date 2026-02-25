export type WorkflowStepResult = {
  ok: boolean;
  error?: any;
};

export type UsageTotal = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
};

export type WorkflowContext<TInput = any, TData = any> = {
  task: string;
  input: TInput;

  // runtime
  attempt: number;
  maxAttempts: number;

  // prompt + model
  templateVersion: number;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string;
  temperature?: number;

  // LLM result
  rawText?: string;
  data?: TData;

  // usage
  usage?: any;          // last call usage
  usageSteps?: any[];   // per-call usages
  usageTotal?: UsageTotal; // aggregated usage

  // debug
  lastError?: any;
};

export type WorkflowStep<TCtx extends WorkflowContext = WorkflowContext> = (
  ctx: TCtx
) => Promise<WorkflowStepResult>;