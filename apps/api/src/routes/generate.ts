import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";

import { runTask } from "../core/workflow/registry.js";
import { requireApiKey, type AuthedRequest } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { prisma } from "../config/prisma.js";
import { resolveModel } from "../core/llm/modelRouter.js";
import type { LLMResolvedConfig } from "../core/llm/types.js";
import { assertLLMConfigured } from "../core/llm/providerClient.js";
import { assertLLMAllowed, assertLLMCostAllowed } from "../core/llm/policy.js";
import { listModelProfiles } from "../core/llm/modelRegistry.js";
import { applyTaskDifficultyRouting } from "../core/llm/taskDifficulty.js";
import { getLLMConfigSummary } from "../core/llm/configSummary.js";
import { getTaskCatalogItem } from "../core/tasks/catalog.js";
import { canUseTaskTier, getPlanPolicy } from "../core/billing/planPolicy.js";

const router = Router();

/**
 * 启动检查
 */
try {
  assertLLMConfigured(resolveModel("__startup_check__"));
} catch (err) {
  console.error("[OneAI][router] default LLM is not configured at startup", err);
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

function getProvider(result: any): string {
  return result?.usage?.provider ?? result?.usageTotal?.provider ?? "unknown";
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

async function getOrgPlan(orgId: string | null): Promise<string> {
  if (!orgId) return "free";

  const billing = await prisma.orgBilling.findUnique({
    where: { orgId },
    select: { plan: true, status: true },
  });

  if (!billing) return "free";
  if (!["active", "trialing"].includes(String(billing.status))) return "free";

  return billing.plan || "free";
}

async function assertPlanAllowsUsage(params: {
  orgId: string | null;
  apiKeyMonthlyBudgetUsd?: number | null;
  task: string;
  isAdmin?: boolean;
  debug?: boolean;
  llmOptions?: any;
  llmConfig?: LLMResolvedConfig;
}) {
  const plan = await getOrgPlan(params.orgId);
  const task = getTaskCatalogItem(params.task);
  const tier = task?.tier ?? "free";
  const enforcePlanPolicy = process.env.ONEAI_PLAN_POLICY_ENFORCE !== "0";
  const policy = getPlanPolicy(plan);

  if (!params.isAdmin && params.debug && !policy.allowDebug) {
    throw new Error(`Debug trace requires team plan`);
  }

  const requestedMode = params.llmOptions?.mode || params.llmConfig?.mode || "balanced";
  if (!params.isAdmin && requestedMode && !policy.allowedModes.includes(requestedMode)) {
    throw new Error(`LLM mode ${requestedMode} requires a higher plan`);
  }

  const explicitModelSelection = !!(params.llmOptions?.provider || params.llmOptions?.model);
  if (!params.isAdmin && explicitModelSelection && !policy.allowExplicitModelSelection) {
    throw new Error("Explicit provider/model selection requires team plan");
  }

  const requestedCost = Number(params.llmOptions?.maxCostUsd || 0);
  if (
    !params.isAdmin &&
    Number.isFinite(requestedCost) &&
    requestedCost > policy.maxCostPerRequestUsd
  ) {
    throw new Error(
      `maxCostUsd exceeds ${plan} plan per-request limit of ${policy.maxCostPerRequestUsd}`
    );
  }

  if (enforcePlanPolicy && !canUseTaskTier(plan, tier)) {
    throw new Error(`Task ${params.task} requires ${tier} plan`);
  }

  if (!params.orgId || (!enforcePlanPolicy && !params.apiKeyMonthlyBudgetUsd)) return;

  const from = new Date();
  from.setUTCDate(1);
  from.setUTCHours(0, 0, 0, 0);

  const aggregate = await prisma.request.aggregate({
    where: {
      orgId: params.orgId,
      createdAt: { gte: from },
    },
    _count: { _all: true },
    _sum: { estimatedCostUsd: true },
  });

  const requests = aggregate._count._all || 0;
  const costUsd = Number(aggregate._sum.estimatedCostUsd || 0);
  const budget = params.apiKeyMonthlyBudgetUsd ?? policy.monthlyCostLimitUsd;

  if (enforcePlanPolicy && requests >= policy.monthlyRequestLimit) {
    throw new Error(`Monthly request limit exceeded for ${plan} plan`);
  }

  if (costUsd >= budget) {
    throw new Error(`Monthly budget exceeded for API key or ${plan} plan`);
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
    maxPerKeyPerWindow: 120,
    maxPerIpPerWindow: 120,
  })
);

router.get("/models", async (req, res) => {
  const r = req as AuthedRequest;
  if (!r.auth?.isAdmin) {
    const plan = await getOrgPlan(getOrgId(r));
    const policy = getPlanPolicy(plan);
    if (!policy.allowModelRegistry) {
      return res.status(403).json({
        success: false,
        error: "models registry requires team plan",
        code: "MODELS_FORBIDDEN",
      });
    }
  }

  return res.json({
    success: true,
    data: {
      config: getLLMConfigSummary(),
      models: listModelProfiles().map((profile) => ({
        provider: profile.provider,
        model: profile.model,
        modes: profile.modes,
        contextTokens: profile.contextTokens ?? null,
        supportsJson: profile.supportsJson ?? false,
        supportsTools: profile.supportsTools ?? false,
        hasPricing:
          typeof profile.inputCostPerToken === "number" ||
          typeof profile.outputCostPerToken === "number",
      })),
    },
  });
});

const requestSchema = z.object({
  type: z.string().min(1).max(120),
  input: z.unknown(),
  options: z
    .object({
      templateVersion: z.number().int().positive().optional(),
      maxAttempts: z.number().int().min(1).max(5).optional(),
      debug: z.boolean().optional(),
      llm: z
        .object({
          provider: z.string().min(1).max(80).optional(),
          model: z.string().min(1).max(160).optional(),
          mode: z.enum(["cheap", "balanced", "premium", "fast", "auto"]).optional(),
          maxCostUsd: z.number().positive().max(100).optional(),
          temperature: z.number().min(0).max(2).optional(),
          maxTokens: z.number().int().positive().max(32000).optional(),
          baseURL: z.string().url().optional(),
          apiKeyEnv: z.string().min(1).max(120).optional(),
        })
        .optional(),
    })
    .optional(),
});

router.post("/", async (req, res) => {
  const startTime = Date.now();
  const r = req as AuthedRequest;
  const requestId = crypto.randomUUID();

  const apiKey = String(req.header("x-api-key") || "");
  const ip = req.ip ?? "unknown";
  const apiKeyHash = apiKey ? sha256(apiKey) : null;
  const idempotencyKey = String(req.header("idempotency-key") || "").trim() || null;

  try {
    console.log("🔥 /v1/generate BODY", {
      type: req.body?.type,
      hasInput: !!req.body?.input,
      hasOptions: !!req.body?.options,
    });

    const parsed = requestSchema.parse(req.body);

    if (
      !r.auth?.isAdmin &&
      (parsed.options?.llm?.baseURL || parsed.options?.llm?.apiKeyEnv)
    ) {
      return res.status(403).json({
        success: false,
        error: "llm baseURL/apiKeyEnv overrides require admin api key",
        code: "LLM_OVERRIDE_FORBIDDEN",
        retryable: false,
      });
    }

    let llmConfig: LLMResolvedConfig;
    try {
      const resolvedLlmOverrides = applyTaskDifficultyRouting({
        task: parsed.type,
        input: parsed.input,
        overrides: parsed.options?.llm,
      });
      llmConfig = resolveModel(parsed.type, resolvedLlmOverrides);
      if (!r.auth?.isAdmin) {
        assertLLMAllowed(llmConfig);
      }
      assertLLMCostAllowed(llmConfig, parsed.input);
      assertLLMConfigured(llmConfig);
    } catch (err) {
      const message = err instanceof Error ? err.message : "LLM not configured";
      const isPolicyError = message.includes("not allowed");
      console.error("[OneAI][router] LLM config missing at request time", {
        type: parsed.type,
        message,
      });

      return res.status(isPolicyError ? 403 : 503).json({
        success: false,
        error: isPolicyError ? "LLM provider/model not allowed" : "LLM provider not configured",
        code: isPolicyError ? "LLM_NOT_ALLOWED" : "UPSTREAM_CONFIG_ERROR",
        retryable: false,
        details: message,
      });
    }

    const orgId = getOrgId(r);
    const apiKeyId = getApiKeyId(r);
    const inputHash = sha256(safeJsonStringify(parsed.input));

    if (idempotencyKey && orgId) {
      const previous = await prisma.request.findFirst({
        where: { orgId, apiKeyId, idempotencyKey } as any,
        orderBy: { createdAt: "desc" },
      } as any);

      const previousAny = previous as any;
      if (previousAny?.outputJson) {
        res.setHeader("x-request-id", previousAny.requestId || previousAny.id);
        res.setHeader("x-idempotent-replay", "true");
        return res.json(previousAny.outputJson);
      }
    }

    try {
      await assertPlanAllowsUsage({
        orgId,
        apiKeyMonthlyBudgetUsd: r.auth?.apiKey?.monthlyBudgetUsd,
        task: parsed.type,
        isAdmin: !!r.auth?.isAdmin,
        debug: !!parsed.options?.debug,
        llmOptions: parsed.options?.llm,
        llmConfig,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plan policy denied";
      return res.status(402).json({
        success: false,
        requestId,
        error: message,
        code: "PLAN_LIMIT_EXCEEDED",
        retryable: false,
      });
    }

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
        requestId,
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
        provider: "unknown",
        idempotencyKey,
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

      const responseBody = {
        success: false,
        requestId,
        error: classified.publicMessage,
        code: classified.code,
        retryable: classified.retryable,
        details: classified.details,
      };

      return res.status(classified.statusCode).json(responseBody);
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
    const usageProvider = getProvider(result);

    if (!result?.success) {
      const classified = classifyError(result?.error);
      const responseBody = {
        success: false,
        requestId,
        attempts: result?.attempts ?? 1,
        error: classified.publicMessage,
        code: classified.code,
        retryable: classified.retryable,
        details: classified.details ?? result?.error ?? null,
        usage: result?.usage ?? null,
        usageTotal: result?.usageTotal ?? null,
        ...(parsed.options?.debug ? { usageSteps: result?.usageSteps ?? null } : {}),
        ...(parsed.options?.debug ? { llmTrace: result?.llmTrace ?? null } : {}),
        ...(parsed.options?.debug ? { llmTraceSteps: result?.llmTraceSteps ?? null } : {}),
      };

      await persistRequestSafe({
        requestId,
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
        provider: usageProvider,
        idempotencyKey,
        inputJson: parsed.input as any,
        outputJson: responseBody as any,
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

      res.setHeader("x-request-id", requestId);
      return res.status(classified.statusCode).json(responseBody);
    }

    const responseBody = {
      success: true,
      requestId,
      attempts: result?.attempts ?? 1,
      usage: result?.usage ?? null,
      usageTotal: result?.usageTotal ?? null,
      ...(parsed.options?.debug ? { usageSteps: result?.usageSteps ?? null } : {}),
      ...(parsed.options?.debug ? { llmTrace: result?.llmTrace ?? null } : {}),
      ...(parsed.options?.debug ? { llmTraceSteps: result?.llmTraceSteps ?? null } : {}),
      data: result?.data ?? null,
      latencyMs,
    };

    await persistRequestSafe({
      requestId,
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
      provider: usageProvider,
      idempotencyKey,
      inputJson: parsed.input as any,
      outputJson: responseBody as any,
      success: true,
      attempts: Number(result?.attempts ?? 1),
      model: usageModel,
      promptTokens: Number(result?.usage?.promptTokens ?? 0),
      completionTokens: Number(result?.usage?.completionTokens ?? 0),
      totalTokens: Number(result?.usage?.totalTokens ?? 0),
      estimatedCostUsd,
      latencyMs,
    } as any);

    res.setHeader("x-request-id", requestId);
    return res.json(responseBody);
  } catch (err) {
    const classified = classifyError(err);
    const latencyMs = Date.now() - startTime;

    console.error("[OneAI][router] request failed", err);

    return res.status(classified.statusCode).json({
      success: false,
      requestId,
      error: classified.publicMessage,
      code: classified.code,
      retryable: classified.retryable,
      details: classified.details,
      latencyMs,
    });
  }
});

export default router;
