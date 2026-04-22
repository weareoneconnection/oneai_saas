import OpenAI from "openai";

console.log("🔥 OPENAI CLIENT FILE LOADED");
let client: OpenAI | null = null;
let cachedKey: string | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  if (!client || cachedKey !== apiKey) {
    console.log("[OpenAI] init client", {
      hasKey: true,
      keyPrefix: apiKey.slice(0, 10),
      keySuffix: apiKey.slice(-6),
    });

    client = new OpenAI({ apiKey });
    cachedKey = apiKey;
  }

  return client;
}