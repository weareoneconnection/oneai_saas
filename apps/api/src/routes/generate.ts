import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";

import { runTask } from "../core/workflows/registry.js";
import { requireApiKey, type AuthedRequest } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { prisma } from "../config/prisma.js";

const router = Router();

/**
 * 1️⃣ 安全中间件
 */
router.use(requireApiKey);
router.use(
  rateLimitRedisTcp({
    windowMs: 60_000,
    maxPerKeyPerWindow: 60,
    maxPerIpPerWindow: 30
  })
);

/**
 * 2️⃣ 请求结构校验
 */
const requestSchema = z.object({
  type: z.string(),
  input: z.any(),
  options: z
    .object({
      templateVersion: z.number().int().positive().optional(),
      maxAttempts: z.number().int().min(1).max(10).optional(),
      debug: z.boolean().optional()
    })
    .optional()
});

router.post("/", async (req, res) => {
  const startTime = Date.now();

  try {
    const parsed = requestSchema.parse(req.body);
    const r = req as AuthedRequest;

    // 3️⃣ debug 仅 admin 可用
    if (parsed.options?.debug && !r.auth?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "debug requires admin api key"
      });
    }

    const result = await runTask(parsed.type, parsed.input, parsed.options);

    /**
     * 4️⃣ 准备落库数据
     */
    const apiKey = String(req.header("x-api-key") || "");
    const ip = req.ip ?? "unknown";

    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const inputHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(parsed.input))
      .digest("hex");

    // ✅ FIX: 让 usage 聚合能按 orgId 查到数据
    // requireApiKey 通常会把 apiKey 记录/权限挂到 r.auth 上
    const orgId = (r as any).auth?.orgId || (r as any).auth?.apiKey?.orgId || null;
    const apiKeyId = (r as any).auth?.apiKeyId || (r as any).auth?.apiKey?.id || null;

    // ✅ FIX: 字段名兼容（你的 Request model 是 estimatedCostUsd）
    const estimatedCostUsd =
      (result as any)?.usage?.estimatedCostUsd ??
      (result as any)?.usage?.estimatedCostUSD ??
      null;

    const latencyMs = Date.now() - startTime;

    /**
     * 5️⃣ 失败情况
     */
    if (!result.success) {
      await prisma.request.create({
        data: {
          // ✅ FIX: 用 relation connect 写 org/apiKey，不直接写 orgId/apiKeyId
          ...(orgId
            ? {
                org: {
                  connect: { id: orgId }
                }
              }
            : {}),
          ...(apiKeyId
            ? {
                apiKey: {
                  connect: { id: apiKeyId }
                }
              }
            : {}),

          task: parsed.type,

          // ❌ Request model 不存在：apiKeyHash / ip / inputHash → 不写入
          // 但你仍然可以把输入保存到 inputJson（schema 支持）
          inputJson: parsed.input as any,

          success: false,
          attempts: result.attempts,

          // schema: model 是必填 String，所以给兜底值
          model: (result as any)?.usage?.model ?? "unknown",

          // schema 这些是 Int/Float 且有 default，但这里传也没问题（用 0 兜底）
          promptTokens: (result as any)?.usage?.promptTokens ?? 0,
          completionTokens: (result as any)?.usage?.completionTokens ?? 0,
          totalTokens: (result as any)?.usage?.totalTokens ?? 0,
          estimatedCostUsd: Number(estimatedCostUsd ?? 0),

          latencyMs,
          error: JSON.stringify(result.error ?? "Unknown error")
        } as any
      });

      return res.status(400).json({
        success: false,
        attempts: result.attempts,
        error: "Failed to produce valid structured output",
        details: result.error,
        usage: result.usage ?? null,
        usageTotal: result.usageTotal ?? null,
        ...(parsed.options?.debug ? { usageSteps: result.usageSteps ?? null } : {})
      });
    }

    /**
     * 6️⃣ 成功落库
     */
    await prisma.request.create({
      data: {
        // ✅ FIX: 用 relation connect 写 org/apiKey，不直接写 orgId/apiKeyId
        ...(orgId
          ? {
              org: {
                connect: { id: orgId }
              }
            }
          : {}),
        ...(apiKeyId
          ? {
              apiKey: {
                connect: { id: apiKeyId }
              }
            }
          : {}),

        task: parsed.type,

        // ❌ Request model 不存在：apiKeyHash / ip / inputHash → 不写入
        // ✅ 保留输入（可选）：你 schema 有 inputJson
        inputJson: parsed.input as any,

        success: true,
        attempts: result.attempts,

        // schema: model 是必填 String
        model: result.usage?.model ?? "unknown",

        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,

        // ✅ FIX: 这里必须是 estimatedCostUsd（不是 estimatedCostUSD）
        estimatedCostUsd: Number(estimatedCostUsd ?? 0),

        latencyMs
      } as any
    });

    /**
     * 7️⃣ 返回响应
     */
    return res.json({
      success: true,
      attempts: result.attempts,
      usage: result.usage ?? null,
      usageTotal: result.usageTotal ?? null,
      ...(parsed.options?.debug ? { usageSteps: result.usageSteps ?? null } : {}),
      data: result.data,
      latencyMs
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

export default router;