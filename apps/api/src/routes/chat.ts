import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { requireApiKey, type AuthedRequest } from "../core/security/auth.js";
import { rateLimitRedisTcp } from "../core/security/rateLimitRedis.js";
import { prisma } from "../config/prisma.js";
import { buildChatCompletionParams, generateLLMText, getLLMClient } from "../core/llm/providerClient.js";
import { assertLLMConfigured } from "../core/llm/providerClient.js";
import { assertLLMAllowed, assertLLMCostAllowed } from "../core/llm/policy.js";
import { findModelProfile, listModelProfiles } from "../core/llm/modelRegistry.js";
import type { LLMMessage, LLMResolvedConfig } from "../core/llm/types.js";

const router = Router();

const chatSchema = z.object({
  model: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.string().min(1),
      content: z.any(),
    })
  ).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(32000).optional(),
  max_completion_tokens: z.number().int().positive().max(32000).optional(),
  stream: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const messagesSchema = z.object({
  model: z.string().min(1),
  system: z.any().optional(),
  messages: z.array(
    z.object({
      role: z.string().min(1),
      content: z.any(),
    })
  ).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(32000).optional(),
  stream: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

function contentToText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return String(part.text || "");
        if (part?.text) return String(part.text);
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (content == null) return "";
  return String(content);
}

function normalizeRole(role: string): LLMMessage["role"] {
  if (role === "assistant") return "assistant";
  if (role === "system" || role === "developer") return "system";
  return "user";
}

function normalizeMessages(messages: Array<{ role: string; content: any }>): LLMMessage[] {
  return messages.map((message) => ({
    role: normalizeRole(message.role),
    content: contentToText(message.content),
  }));
}

function splitModelId(raw: string): { provider: string; model: string } {
  const profiles = listModelProfiles();
  const exact = profiles.find((profile) => profile.model === raw);
  if (exact) return { provider: String(exact.provider), model: exact.model };

  const colon = raw.indexOf(":");
  if (colon > 0) {
    return {
      provider: raw.slice(0, colon),
      model: raw.slice(colon + 1),
    };
  }

  return {
    provider: process.env.ONEAI_DEFAULT_PROVIDER || "openai",
    model: raw,
  };
}

function requestId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function writeSse(res: any, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getOrgId(req: AuthedRequest) {
  return req.auth?.orgId || null;
}

function getApiKeyId(req: AuthedRequest) {
  return req.auth?.apiKeyId || null;
}

async function persistChatRequest(params: {
  req: AuthedRequest;
  requestId: string;
  provider: string;
  model: string;
  inputJson: any;
  outputJson: any;
  success: boolean;
  error?: string | null;
  usage?: any;
  latencyMs: number;
}) {
  try {
    const usage = params.usage || {};
    await prisma.request.create({
      data: {
        requestId: params.requestId,
        ...(getOrgId(params.req) ? { org: { connect: { id: getOrgId(params.req)! } } } : {}),
        ...(getApiKeyId(params.req) ? { apiKey: { connect: { id: getApiKeyId(params.req)! } } } : {}),
        task: "chat_completion",
        provider: params.provider,
        inputJson: params.inputJson,
        outputJson: params.outputJson,
        success: params.success,
        attempts: 1,
        model: params.model,
        promptTokens: Number(usage.promptTokens || 0),
        completionTokens: Number(usage.completionTokens || 0),
        totalTokens: Number(usage.totalTokens || 0),
        estimatedCostUsd: Number(usage.estimatedCostUsd || usage.estimatedCostUSD || 0),
        latencyMs: params.latencyMs,
        error: params.error || null,
      } as any,
    });
  } catch (err) {
    console.error("[OneAI][chat] failed to persist request", err);
  }
}

function resolveConfig(params: {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}): LLMResolvedConfig {
  const profile = findModelProfile(params.provider, params.model);
  return {
    provider: params.provider,
    model: params.model,
    temperature: params.temperature ?? 0.7,
    ...(params.maxTokens ? { maxTokens: params.maxTokens } : {}),
    ...(profile ? {} : {}),
  };
}

router.use(requireApiKey);
router.use(rateLimitRedisTcp({ windowMs: 60_000, maxPerKeyPerWindow: 120, maxPerIpPerWindow: 120 }));

router.post("/completions", async (req, res) => {
  const start = Date.now();
  const id = requestId("chatcmpl");

  try {
    const parsed = chatSchema.parse(req.body);
    const { provider, model } = splitModelId(parsed.model);
    const config = resolveConfig({
      provider,
      model,
      temperature: parsed.temperature,
      maxTokens: parsed.max_completion_tokens ?? parsed.max_tokens,
    });

    if (!(req as AuthedRequest).auth?.isAdmin) assertLLMAllowed(config);
    assertLLMCostAllowed(config, req.body);
    assertLLMConfigured(config);

    if (parsed.stream) {
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const client = getLLMClient(config);
      const stream = await client.chat.completions.create({
        ...buildChatCompletionParams({
          ...config,
          messages: normalizeMessages(parsed.messages),
        }),
        stream: true,
      } as any);

      let modelName = model;
      let fullText = "";
      const created = Math.floor(Date.now() / 1000);

      for await (const chunk of stream as any) {
        modelName = chunk?.model || modelName;
        const delta = chunk?.choices?.[0]?.delta || {};
        const finishReason = chunk?.choices?.[0]?.finish_reason || null;
        const content = delta?.content || "";
        if (content) fullText += content;

        res.write(`data: ${JSON.stringify({
          id,
          object: "chat.completion.chunk",
          created,
          model: modelName,
          provider,
          choices: [
            {
              index: 0,
              delta,
              finish_reason: finishReason,
            },
          ],
        })}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();

      await persistChatRequest({
        req: req as AuthedRequest,
        requestId: id,
        provider,
        model: modelName,
        inputJson: req.body,
        outputJson: { id, stream: true, text: fullText },
        success: true,
        latencyMs: Date.now() - start,
      });
      return;
    }

    const result = await generateLLMText({
      ...config,
      messages: normalizeMessages(parsed.messages),
    });

    const created = Math.floor(Date.now() / 1000);
    const body = {
      id,
      object: "chat.completion",
      created,
      model: result.usage.model || model,
      provider: result.usage.provider || provider,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: result.text,
          },
          finish_reason: result.finishReason || "stop",
        },
      ],
      usage: {
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
        estimated_cost_usd: result.usage.estimatedCostUSD,
      },
      oneai: {
        requestId: id,
        trace: result.trace,
      },
    };

    await persistChatRequest({
      req: req as AuthedRequest,
      requestId: id,
      provider,
      model: result.usage.model || model,
      inputJson: req.body,
      outputJson: body,
      success: true,
      usage: result.usage,
      latencyMs: Date.now() - start,
    });

    return res.json(body);
  } catch (err: any) {
    const message = String(err?.message || err);
    const status = message.includes("missing") || message.includes("not configured") ? 503 : 400;
    const body = {
      error: {
        message,
        type: status === 503 ? "upstream_config_error" : "invalid_request_error",
        code: status === 503 ? "UPSTREAM_CONFIG_ERROR" : "CHAT_COMPLETION_FAILED",
      },
    };

    await persistChatRequest({
      req: req as AuthedRequest,
      requestId: id,
      provider: "unknown",
      model: "unknown",
      inputJson: req.body,
      outputJson: body,
      success: false,
      error: message,
      latencyMs: Date.now() - start,
    });

    return res.status(status).json(body);
  }
});

export const messagesHandler = async (req: any, res: any) => {
  const start = Date.now();
  const id = requestId("msg");

  try {
    const parsed = messagesSchema.parse(req.body);

    const { provider, model } = splitModelId(parsed.model);
    const config = resolveConfig({
      provider,
      model,
      temperature: parsed.temperature,
      maxTokens: parsed.max_tokens,
    });

    if (!req.auth?.isAdmin) assertLLMAllowed(config);
    assertLLMCostAllowed(config, req.body);
    assertLLMConfigured(config);

    const messages = normalizeMessages(parsed.messages);
    if (parsed.system) {
      messages.unshift({ role: "system", content: contentToText(parsed.system) });
    }

    if (parsed.stream) {
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const client = getLLMClient(config);
      const stream = await client.chat.completions.create({
        ...buildChatCompletionParams({
          ...config,
          messages,
        }),
        stream: true,
      } as any);

      let modelName = model;
      let fullText = "";
      let contentStarted = false;

      writeSse(res, "message_start", {
        type: "message_start",
        message: {
          id,
          type: "message",
          role: "assistant",
          model: modelName,
          content: [],
          stop_reason: null,
          usage: {
            input_tokens: 0,
            output_tokens: 0,
          },
        },
      });

      for await (const chunk of stream as any) {
        modelName = chunk?.model || modelName;
        const delta = chunk?.choices?.[0]?.delta || {};
        const finishReason = chunk?.choices?.[0]?.finish_reason || null;
        const content = delta?.content || "";

        if (content && !contentStarted) {
          contentStarted = true;
          writeSse(res, "content_block_start", {
            type: "content_block_start",
            index: 0,
            content_block: { type: "text", text: "" },
          });
        }

        if (content) {
          fullText += content;
          writeSse(res, "content_block_delta", {
            type: "content_block_delta",
            index: 0,
            delta: { type: "text_delta", text: content },
          });
        }

        if (finishReason) {
          if (contentStarted) {
            writeSse(res, "content_block_stop", {
              type: "content_block_stop",
              index: 0,
            });
          }

          writeSse(res, "message_delta", {
            type: "message_delta",
            delta: {
              stop_reason: finishReason === "stop" ? "end_turn" : finishReason,
              stop_sequence: null,
            },
            usage: {
              output_tokens: 0,
            },
          });
        }
      }

      writeSse(res, "message_stop", { type: "message_stop" });
      res.end();

      await persistChatRequest({
        req,
        requestId: id,
        provider,
        model: modelName,
        inputJson: req.body,
        outputJson: { id, type: "message", stream: true, text: fullText },
        success: true,
        latencyMs: Date.now() - start,
      });
      return;
    }

    const result = await generateLLMText({
      ...config,
      messages,
    });

    const body = {
      id,
      type: "message",
      role: "assistant",
      model: result.usage.model || model,
      provider: result.usage.provider || provider,
      content: [{ type: "text", text: result.text }],
      stop_reason: result.finishReason || "end_turn",
      usage: {
        input_tokens: result.usage.promptTokens,
        output_tokens: result.usage.completionTokens,
        estimated_cost_usd: result.usage.estimatedCostUSD,
      },
      oneai: {
        requestId: id,
        trace: result.trace,
      },
    };

    await persistChatRequest({
      req,
      requestId: id,
      provider,
      model: result.usage.model || model,
      inputJson: req.body,
      outputJson: body,
      success: true,
      usage: result.usage,
      latencyMs: Date.now() - start,
    });

    return res.json(body);
  } catch (err: any) {
    const message = String(err?.message || err);
    const body = {
      type: "error",
      error: {
        type: "invalid_request_error",
        message,
      },
    };

    await persistChatRequest({
      req,
      requestId: id,
      provider: "unknown",
      model: "unknown",
      inputJson: req.body,
      outputJson: body,
      success: false,
      error: message,
      latencyMs: Date.now() - start,
    });

    return res.status(400).json({
      ...body,
    });
  }
};

export default router;
