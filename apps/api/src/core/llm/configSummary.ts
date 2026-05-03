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
    configuredKeys: {
      openai: hasEnv("OPENAI_API_KEY"),
      openrouter: hasEnv("OPENROUTER_API_KEY"),
      deepseek: hasEnv("DEEPSEEK_API_KEY"),
      groq: hasEnv("GROQ_API_KEY"),
      qwen: hasEnv("QWEN_API_KEY"),
      moonshot: hasEnv("MOONSHOT_API_KEY"),
      doubao: hasEnv("DOUBAO_API_KEY"),
      custom: hasEnv("ONEAI_LLM_API_KEY"),
    },
    configuredModels: {
      openrouter: process.env.OPENROUTER_MODEL || null,
      deepseek: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      groq: process.env.GROQ_MODEL || null,
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
