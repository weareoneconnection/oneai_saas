import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.js";
import { redis } from "../../config/redis.js";

type RateLimitOptions = {
  windowMs?: number;            // default 60_000
  maxPerKeyPerWindow?: number;  // default 60
  maxPerIpPerWindow?: number;   // default 30
  prefix?: string;              // default "rl"
  failOpen?: boolean;           // default true (Redis挂了不拦截)
};

function getClientIp(req: Request) {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  return ip;
}

function bucketId(windowMs: number, now: number) {
  return Math.floor(now / windowMs);
}

// Lua：原子 INCR + 首次设置 PEXPIRE
const INCR_EXPIRE_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`;

async function hit(key: string, windowMs: number) {
  const count = (await redis.eval(INCR_EXPIRE_LUA, 1, key, String(windowMs))) as number;
  const ttl = await redis.pttl(key); // 剩余窗口时间（ms）
  const retryAfterSec = Math.max(1, Math.ceil(ttl / 1000));
  return { count: Number(count), retryAfterSec };
}

export function rateLimitRedisTcp(options?: RateLimitOptions) {
  const windowMs = options?.windowMs ?? 60_000;
  const maxPerKey = options?.maxPerKeyPerWindow ?? 60;
  const maxPerIp = options?.maxPerIpPerWindow ?? 30;
  const prefix = options?.prefix ?? "rl";
  const failOpen = options?.failOpen ?? true;

  return async function (req: Request, res: Response, next: NextFunction) {
    const r = req as AuthedRequest;

    try {
      const apiKey = String(req.header("x-api-key") || "").trim();
      const ip = getClientIp(req);
      const now = Date.now();
      const b = bucketId(windowMs, now);

      // 1) IP 限流（始终）
      {
        const k = `${prefix}:ip:${ip}:${b}`;
        const { count, retryAfterSec } = await hit(k, windowMs);
        if (count > maxPerIp) {
          res.setHeader("Retry-After", String(retryAfterSec));
          return res.status(429).json({
            success: false,
            error: "Rate limit exceeded (IP)",
            limit: maxPerIp,
            windowMs,
            retryAfterSec
          });
        }
      }

      // 2) API Key 限流（有 key 才做，虽然你有 requireApiKey）
      if (apiKey) {
        const k = `${prefix}:key:${apiKey}:${b}`;
        const { count, retryAfterSec } = await hit(k, windowMs);
        if (count > maxPerKey) {
          res.setHeader("Retry-After", String(retryAfterSec));
          return res.status(429).json({
            success: false,
            error: "Rate limit exceeded (API key)",
            limit: maxPerKey,
            windowMs,
            retryAfterSec
          });
        }
      }

      return next();
    } catch (e) {
      // Redis挂了：建议 fail-open（不中断服务）
      if (failOpen) return next();
      return res.status(503).json({ success: false, error: "Rate limiter unavailable" });
    }
  };
}