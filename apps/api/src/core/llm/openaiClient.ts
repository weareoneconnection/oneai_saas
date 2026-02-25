import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * 单例 OpenAI Client
 */
export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return client;
}