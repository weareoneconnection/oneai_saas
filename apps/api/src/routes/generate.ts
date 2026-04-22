import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";

import { runTask } from "../core/workflow/registry.js";
import { requireApiKey, type AuthedRequest } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { prisma } from "../config/prisma.js";

const router = Router();

/**
 * 启动检查
 */
const hasOpenAIKey =
  typeof process.env.OPENAI_API_KEY === "string" &&
  process.env.OPENAI_API_KEY.trim().length > 0;

if (!hasOpenAIKey) {
  console.error("[OneAI][router] OPENAI_API_KEY is missing at startup");
}

/**
 * 安全 stringify，避免循环引用报错
 */
function safeJsonStringify(value: unknown): string {
  try {
    const seen = new WeakSet();

    return JSON.stringify(value, (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }

      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }

      return val;
    });
  } catch {
    return String(value);
  }
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeEstimatedCostUsd(result: any): number {
  const raw =
    result?.usage?.estimatedCostUsd ??
    result?.usage?.estimatedCostUSD ??
    result?.usageTotal?.estimatedCostUsd ??
    result?.usageTotal?.estimatedCostUSD ??
    0;

  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function getOrgId(r: AuthedRequest): string | null {
  return (r as any).auth?.orgId || (r as any).auth?.apiKey?.orgId || null;
}

function getApiKeyId(r: AuthedRequest): string | null {
  return (r as any).auth?.apiKeyId || (r as any).auth?.apiKey?.id || null;
}

/**
 * 关键：错误分类要把 quota 和 rate limit 分开
 */
function classifyError(err: unknown): {
  statusCode: number;
  publicMessage: string;
  code: string;
  details?: string;
  retryable: boolean;
} {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";

  const lower = String(message).toLowerCase();

  // 1) 配置问题：不能重试
  if (
    lower.includes("openai_api_key") ||
    lower.includes("missing api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    lower.includes("unauthorized")
  ) {
    return {
      statusCode: 503,
      publicMessage: "Upstream AI provider is not configured correctly",
      code: "UPSTREAM_CONFIG_ERROR",
      details: message,
      retryable: false,
    };
  }

  // 2) 真正的 quota / compute exhausted：不能重试
  if (
    lower.includes("compute time quota") ||
    lower.includes("exceeded the compute time") ||
    lower.includes("quota exhausted")
  ) {
    return {
      statusCode: 500,
      publicMessage: "AI quota exhausted",
      code: "UPSTREAM_QUOTA_EXHAUSTED",
      details: message,
      retryable: false,
    };
  }

  // 3) 真正的 rate limit：可以重试
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return {
      statusCode: 429,
      publicMessage: "AI provider rate limited",
      code: "UPSTREAM_RATE_LIMITED",
      details: message,
      retryable: true,
    };
  }

  // 4) 暂时性上游故障：可以重试
  if (
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("service unavailable") ||
    lower.includes("bad gateway")
  ) {
    return {
      statusCode: 503,
      publicMessage: "AI provider temporarily unavailable",
      code: "UPSTREAM_UNAVAILABLE",
      details: message,
      retryable: true,
    };
  }

  // 5) 请求参数问题：不能重试
  if (
    lower.includes("zod") ||
    lower.includes("validation") ||
    lower.includes("invalid request") ||
    lower.includes("invalid input")
  ) {
    return {
      statusCode: 400,
      publicMessage: "Invalid request payload",
      code: "INVALID_REQUEST",
      details: message,
      retryable: false,
    };
  }

  return {
    statusCode: 500,
    publicMessage: "Internal task failure",
    code: "INTERNAL_ERROR",
    details: message,
    retryable: false,
  };
}

async function persistRequestSafe(data: any) {
  try {
    await prisma.request.create({ data });
  } catch (err) {
    console.error("[OneAI][router] failed to persist request", err);
  }
}

/**
 * 调试：确认请求真的打进来了
 */
router.use((req, _res, next) => {
  console.log("🔥 ROUTER HIT", {
    method: req.method,
    path: req.path,
    hasApiKey: !!req.header("x-api-key"),
    time: new Date().toISOString(),
  });
  next();
});

/**
 * 安全中间件
 */
router.use(requireApiKey);
router.use(
  rateLimitRedisTcp({
    windowMs: 60_000,
    maxPerKeyPerWindow: 30,
    maxPerIpPerWindow: 20,
  })
);

const requestSchema = z.object({
  type: z.string().min(1).max(120),
  input: z.unknown(),
  options: z
    .object({
      templateVersion: z.number().int().positive().optional(),
      maxAttempts: z.number().int().min(1).max(5).optional(),
      debug: z.boolean().optional(),
    })
    .optional(),
});

router.post("/", async (req, res) => {
  const startTime = Date.now();
  const r = req as AuthedRequest;

  const apiKey = String(req.header("x-api-key") || "");
  const ip = req.ip ?? "unknown";
  const apiKeyHash = apiKey ? sha256(apiKey) : null;

  try {
    console.log("🔥 /v1/generate BODY", {
      type: req.body?.type,
      hasInput: !!req.body?.input,
      hasOptions: !!req.body?.options,
    });

    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      console.error("[OneAI][router] OPENAI_API_KEY missing at request time");

      return res.status(503).json({
        success: false,
        error: "OPENAI_API_KEY not configured",
        code: "UPSTREAM_CONFIG_ERROR",
        retryable: false,
      });
    }

    const parsed = requestSchema.parse(req.body);

    if (parsed.options?.debug && !r.auth?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "debug requires admin api key",
        code: "DEBUG_FORBIDDEN",
        retryable: false,
      });
    }

    const orgId = getOrgId(r);
    const apiKeyId = getApiKeyId(r);
    const inputHash = sha256(safeJsonStringify(parsed.input));

    console.log("🔥 BEFORE runTask", {
      type: parsed.type,
    });

    let result: any;

    try {
      result = await runTask(parsed.type, parsed.input, parsed.options);
    } catch (err) {
      const classified = classifyError(err);
      const latencyMs = Date.now() - startTime;

      console.error("🔥 runTask THROW", {
        type: parsed.type,
        code: classified.code,
        retryable: classified.retryable,
        details: classified.details,
      });

      await persistRequestSafe({
        ...(orgId
          ? {
              org: { connect: { id: orgId } },
            }
          : {}),
        ...(apiKeyId
          ? {
              apiKey: { connect: { id: apiKeyId } },
            }
          : {}),
        task: parsed.type,
        inputJson: parsed.input as any,
        success: false,
        attempts: 1,
        model: "unknown",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        latencyMs,
        error: safeJsonStringify({
          code: classified.code,
          message: classified.details ?? classified.publicMessage,
          apiKeyHash,
          ip,
          inputHash,
        }),
      } as any);

      return res.status(classified.statusCode).json({
        success: false,
        error: classified.publicMessage,
        code: classified.code,
        retryable: classified.retryable,
        details: classified.details,
      });
    }

    console.log("🔥 AFTER runTask", {
      type: parsed.type,
      success: result?.success,
      attempts: result?.attempts,
      hasError: !!result?.error,
    });

    const latencyMs = Date.now() - startTime;
    const estimatedCostUsd = normalizeEstimatedCostUsd(result);
    const usageModel = result?.usage?.model ?? result?.usageTotal?.model ?? "unknown";

    if (!result?.success) {
      const classified = classifyError(result?.error);

      await persistRequestSafe({
        ...(orgId
          ? {
              org: { connect: { id: orgId } },
            }
          : {}),
        ...(apiKeyId
          ? {
              apiKey: { connect: { id: apiKeyId } },
            }
          : {}),
        task: parsed.type,
        inputJson: parsed.input as any,
        success: false,
        attempts: Number(result?.attempts ?? 1),
        model: usageModel,
        promptTokens: Number(result?.usage?.promptTokens ?? 0),
        completionTokens: Number(result?.usage?.completionTokens ?? 0),
        totalTokens: Number(result?.usage?.totalTokens ?? 0),
        estimatedCostUsd,
        latencyMs,
        error: safeJsonStringify({
          error: result?.error ?? "Failed to produce valid structured output",
          code: classified.code,
          apiKeyHash,
          ip,
          inputHash,
        }),
      } as any);

      return res.status(classified.statusCode).json({
        success: false,
        attempts: result?.attempts ?? 1,
        error: classified.publicMessage,
        code: classified.code,
        retryable: classified.retryable,
        details: classified.details ?? result?.error ?? null,
        usage: result?.usage ?? null,
        usageTotal: result?.usageTotal ?? null,
        ...(parsed.options?.debug ? { usageSteps: result?.usageSteps ?? null } : {}),
      });
    }

    await persistRequestSafe({
      ...(orgId
        ? {
            org: { connect: { id: orgId } },
          }
        : {}),
      ...(apiKeyId
        ? {
            apiKey: { connect: { id: apiKeyId } },
          }
        : {}),
      task: parsed.type,
      inputJson: parsed.input as any,
      success: true,
      attempts: Number(result?.attempts ?? 1),
      model: usageModel,
      promptTokens: Number(result?.usage?.promptTokens ?? 0),
      completionTokens: Number(result?.usage?.completionTokens ?? 0),
      totalTokens: Number(result?.usage?.totalTokens ?? 0),
      estimatedCostUsd,
      latencyMs,
    } as any);

    return res.json({
      success: true,
      attempts: result?.attempts ?? 1,
      usage: result?.usage ?? null,
      usageTotal: result?.usageTotal ?? null,
      ...(parsed.options?.debug ? { usageSteps: result?.usageSteps ?? null } : {}),
      data: result?.data ?? null,
      latencyMs,
    });
  } catch (err) {
    const classified = classifyError(err);
    const latencyMs = Date.now() - startTime;

    console.error("[OneAI][router] request failed", err);

    return res.status(classified.statusCode).json({
      success: false,
      error: classified.publicMessage,
      code: classified.code,
      retryable: classified.retryable,
      details: classified.details,
      latencyMs,
    });
  }
});

export default router;