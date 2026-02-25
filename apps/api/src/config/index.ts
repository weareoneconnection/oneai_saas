import { loadEnv } from "./env.js";

export const env = loadEnv();

export const config = {
  port: env.PORT,
  openaiApiKey: env.OPENAI_API_KEY,

  apiKeys: env.API_KEYS.split(",").map((s) => s.trim()).filter(Boolean),
  adminApiKey: env.ADMIN_API_KEY,

  redisUrl: env.REDIS_URL
};