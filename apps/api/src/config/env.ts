// apps/api/src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

// ✅ 最早加载环境变量（确保在任何校验/读取前就注入）
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  API_KEYS: z.string().min(1),      // 逗号分隔：dev_key_1,dev_key_2
  ADMIN_API_KEY: z.string().min(1), // admin_key_1
  REDIS_URL: z.string().min(1),     // redis://127.0.0.1:6379
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