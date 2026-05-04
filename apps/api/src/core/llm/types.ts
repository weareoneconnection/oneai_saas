export type LLMProvider =
  | "openai"
  | "openai-compatible"
  | "openrouter"
  | "anthropic"
  | "gemini"
  | "xai"
  | "deepseek"
  | "groq"
  | "mistral"
  | "perplexity"
  | "cohere"
  | "together"
  | "fireworks"
  | "cerebras"
  | "siliconflow"
  | "zhipu"
  | "minimax"
  | "qwen"
  | "moonshot"
  | "doubao"
  | "custom";

export type LLMRoutingMode = "cheap" | "balanced" | "premium" | "fast" | "auto";

export type LLMOverrides = {
  provider?: LLMProvider | string;
  model?: string;
  mode?: LLMRoutingMode;
  maxCostUsd?: number;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
  apiKeyEnv?: string;
  fallbacks?: LLMProviderConfig[];
};

export type LLMResolvedConfig = {
  provider: LLMProvider | string;
  model: string;
  mode?: LLMRoutingMode;
  maxCostUsd?: number;
  temperature: number;
  maxTokens?: number;
  baseURL?: string;
  apiKeyEnv?: string;
  fallbacks?: LLMProviderConfig[];
};

export type LLMProviderConfig = {
  provider: LLMProvider | string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
  apiKeyEnv?: string;
};

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMUsageRecord = {
  provider: string;
  model: string;
  mode?: LLMRoutingMode;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  estimatedCostUsd: number;
  createdAt: string;
  latencyMs?: number;
  fallbackUsed?: boolean;
  fallbackFrom?: string;
};

export type LLMGenerateRequest = LLMResolvedConfig & {
  messages: LLMMessage[];
};

export type LLMTraceAttempt = {
  provider: string;
  model: string;
  mode?: LLMRoutingMode;
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export type LLMTrace = {
  selectedProvider: string;
  selectedModel: string;
  mode?: LLMRoutingMode;
  fallbackUsed: boolean;
  fallbackFrom?: string;
  fallbackTo?: string;
  attempts: LLMTraceAttempt[];
  latencyMs: number;
};

export type LLMGenerateResult = {
  text: string;
  usage: LLMUsageRecord;
  finishReason?: string | null;
  fallbackUsed?: boolean;
  fallbackFrom?: string;
  trace: LLMTrace;
  raw?: unknown;
};
