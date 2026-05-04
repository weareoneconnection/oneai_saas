const PROVIDER_KEY_ENV: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  xai: "XAI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  cohere: "COHERE_API_KEY",
  together: "TOGETHER_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
  siliconflow: "SILICONFLOW_API_KEY",
  zhipu: "ZHIPU_API_KEY",
  minimax: "MINIMAX_API_KEY",
  qwen: "QWEN_API_KEY",
  moonshot: "MOONSHOT_API_KEY",
  doubao: "DOUBAO_API_KEY",
  custom: "ONEAI_LLM_API_KEY",
  "openai-compatible": "ONEAI_LLM_API_KEY",
};

export function providerApiKeyEnv(provider: string) {
  return PROVIDER_KEY_ENV[provider] || "ONEAI_LLM_API_KEY";
}

export function isProviderConfigured(provider: string) {
  const env = providerApiKeyEnv(provider);
  return !!process.env[env]?.trim();
}

export function configuredProviders() {
  return Object.fromEntries(
    Object.keys(PROVIDER_KEY_ENV).map((provider) => [
      provider,
      isProviderConfigured(provider),
    ])
  );
}

