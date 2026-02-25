import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.js";

type Counter = {
  resetAt: number;
  count: number;
};

const store = new Map<string, Counter>();

function now() {
  return Date.now();
}

function getKey(req: AuthedRequest) {
  const apiKey = String(req.header("x-api-key") || "").trim();
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  return { apiKey, ip };
}

function hit(bucketKey: string, windowMs: number) {
  const t = now();
  let c = store.get(bucketKey);
  if (!c || t >= c.resetAt) {
    c = { resetAt: t + windowMs, count: 0 };
    store.set(bucketKey, c);
  }
  c.count += 1;
  return c;
}

// 定期清理（避免 map 无限长）
setInterval(() => {
  const t = now();
  for (const [k, v] of store.entries()) {
    if (t >= v.resetAt) store.delete(k);
  }
}, 30_000).unref();

export function rateLimit(options?: {
  windowMs?: number;
  maxPerKeyPerWindow?: number;
  maxPerIpPerWindow?: number;
}) {
  const windowMs = options?.windowMs ?? 60_000;
  const maxPerKey = options?.maxPerKeyPerWindow ?? 60;
  const maxPerIp = options?.maxPerIpPerWindow ?? 30;

  return function (req: Request, res: Response, next: NextFunction) {
    const r = req as AuthedRequest;
    const { apiKey, ip } = getKey(r);

    // IP bucket（总是限制）
    const ipBucket = hit(`ip:${ip}`, windowMs);
    if (ipBucket.count > maxPerIp) {
      const retryAfterSec = Math.ceil((ipBucket.resetAt - now()) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded (IP)",
        limit: maxPerIp,
        windowMs,
        retryAfterSec
      });
    }

    // Key bucket（有 key 才限制）
    if (apiKey) {
      const keyBucket = hit(`key:${apiKey}`, windowMs);
      if (keyBucket.count > maxPerKey) {
        const retryAfterSec = Math.ceil((keyBucket.resetAt - now()) / 1000);
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
  };
}