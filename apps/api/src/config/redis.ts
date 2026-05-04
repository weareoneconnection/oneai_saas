import { Redis } from "ioredis";
import { config } from "./index.js";

export const redis = config.redisUrl
  ? new Redis(config.redisUrl, {
      // 生产建议开启：断线重连更稳
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    })
  : null;

redis?.on("connect", () => {
  console.log("✅ Redis connected");
});

redis?.on("error", (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("❌ Redis error:", msg);
});
