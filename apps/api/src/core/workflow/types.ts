import type { LLMOverrides, LLMTrace } from "../llm/types.js";

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
  templateVersionOverride?: number;
  systemPrompt?: string;
  userPrompt?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
  apiKeyEnv?: string;
  fallbacks?: LLMOverrides["fallbacks"];
  llm?: LLMOverrides;

  // LLM result
  rawText?: string;
  data?: TData;

  // usage
  usage?: any;          // last call usage
  usageSteps?: any[];   // per-call usages
  usageTotal?: UsageTotal; // aggregated usage
  llmTrace?: LLMTrace;
  llmTraceSteps?: LLMTrace[];

  // debug
  lastError?: any;
};

export type WorkflowStep<TCtx extends WorkflowContext = WorkflowContext> = (
  ctx: TCtx
) => Promise<WorkflowStepResult>;
