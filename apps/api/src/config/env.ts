// apps/api/src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

// ✅ 最早加载环境变量（确保在任何校验/读取前就注入）
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  API_KEYS: z.string().optional().default(""),      // legacy: comma separated dev keys
  ADMIN_API_KEY: z.string().optional().default(""), // legacy admin route key
  REDIS_URL: z.string().optional().default(""),     // optional; rate limiter fails open when missing
  // 如果你 TCP Redis 不用 token，就不要校验 REDIS_TOKEN
  PORT: z.coerce.number().optional(),
  ONEAI_API_BASE: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
