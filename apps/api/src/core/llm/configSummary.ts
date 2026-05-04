function boolFromEnv(name: string): boolean {
  return process.env[name] === "1" || process.env[name] === "true";
}

function listFromEnv(name: string): string[] {
  return String(process.env[name] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasEnv(name: string): boolean {
  return !!process.env[name]?.trim();
}

export function getLLMConfigSummary() {
  return {
    defaultProvider: process.env.ONEAI_DEFAULT_PROVIDER || "openai",
    defaultModel: process.env.ONEAI_DEFAULT_MODEL || "gpt-4o-mini",
    autoMode: boolFromEnv("ONEAI_LLM_AUTO_MODE"),
    autoFallbacks: boolFromEnv("ONEAI_LLM_AUTO_FALLBACKS"),
    autoFallbackLimit: Number(process.env.ONEAI_LLM_AUTO_FALLBACK_LIMIT || 2),
    configuredFallbacks: listFromEnv("ONEAI_LLM_FALLBACKS").map((item) => {
      const [provider, ...modelParts] = item.split(":");
      return {
        provider,
        model: modelParts.join(":"),
      };
    }),
    allowlist: {
      providers: listFromEnv("ONEAI_ALLOWED_LLM_PROVIDERS"),
      models: listFromEnv("ONEAI_ALLOWED_LLM_MODELS"),
    },
    configuredKeys: configuredProviders(),
    configuredModels: {
      openrouter: process.env.OPENROUTER_MODEL || null,
      anthropic: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      gemini: process.env.GEMINI_MODEL || "gemini-3-pro-preview",
      xai: process.env.XAI_MODEL || "grok-4.20",
      deepseek: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      groq: process.env.GROQ_MODEL || null,
      mistral: process.env.MISTRAL_MODEL || "mistral-large-2512",
      perplexity: process.env.PERPLEXITY_MODEL || "sonar-pro",
      cohere: process.env.COHERE_MODEL || "command-a-03-2025",
      together: process.env.TOGETHER_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      fireworks: process.env.FIREWORKS_MODEL || "accounts/fireworks/models/llama-v3p3-70b-instruct",
      cerebras: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
      siliconflow: process.env.SILICONFLOW_MODEL || "Qwen/Qwen2.5-72B-Instruct",
      zhipu: process.env.ZHIPU_MODEL || "glm-4.5",
      minimax: process.env.MINIMAX_MODEL || "MiniMax-M1",
      qwen: process.env.QWEN_MODEL || null,
      moonshot: process.env.MOONSHOT_MODEL || null,
      doubao: process.env.DOUBAO_MODEL || null,
    },
    customProvider: {
      provider: process.env.ONEAI_LLM_PROVIDER || "openai-compatible",
      hasBaseURL: hasEnv("ONEAI_LLM_BASE_URL"),
      model: process.env.ONEAI_LLM_MODEL || null,
    },
  };
}
import { configuredProviders, isProviderConfigured } from "./providerConfig.js";
