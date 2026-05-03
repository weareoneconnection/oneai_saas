// apps/web/src/app/api/models/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiBase() {
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "http://localhost:4000";
  return raw.replace(/\/$/, "");
}

function registryKey() {
  return [
    process.env.ONEAI_ADMIN_API_KEY ||
      "",
    process.env.ONEAI_API_KEY || "",
    process.env.ONEAI_ADMIN_KEY || "",
  ].filter(Boolean);
}

async function readJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function fallbackRegistry(reason: string) {
  const configuredKeys = {
    openai: !!process.env.OPENAI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    qwen: !!process.env.QWEN_API_KEY,
    moonshot: !!process.env.MOONSHOT_API_KEY,
    doubao: !!process.env.DOUBAO_API_KEY,
    custom: !!process.env.ONEAI_LLM_API_KEY,
  };

  return {
    success: true,
    warning: reason,
    data: {
      config: {
        defaultProvider: process.env.ONEAI_DEFAULT_PROVIDER || "openai",
        defaultModel: process.env.ONEAI_DEFAULT_MODEL || "gpt-4o-mini",
        autoMode: process.env.ONEAI_LLM_AUTO_MODE === "1",
        autoFallbacks: process.env.ONEAI_LLM_AUTO_FALLBACKS === "1",
        configuredKeys,
      },
      models: [
        {
          provider: "openai",
          model: "gpt-4o-mini",
          modes: ["cheap", "balanced", "fast", "auto"],
          contextTokens: null,
          supportsJson: true,
          supportsTools: false,
          hasPricing: true,
        },
        {
          provider: "openai",
          model: "gpt-4o",
          modes: ["premium", "auto"],
          contextTokens: null,
          supportsJson: true,
          supportsTools: false,
          hasPricing: true,
        },
        {
          provider: "deepseek",
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          modes: ["cheap", "balanced", "auto"],
          contextTokens: null,
          supportsJson: true,
          supportsTools: false,
          hasPricing: false,
        },
      ],
    },
  };
}

export async function GET() {
  const keys = registryKey();
  if (!keys.length) {
    return NextResponse.json(
      fallbackRegistry("No API key configured for live model registry; showing local defaults."),
      { status: 200 }
    );
  }

  let lastJson: any = null;
  let lastStatus = 500;

  for (const key of keys) {
    const upstream = await fetch(`${apiBase()}/v1/generate/models`, {
      headers: { "x-api-key": key, accept: "application/json" },
      cache: "no-store",
    }).catch((err) => {
      lastJson = { success: false, error: err?.message || "fetch_failed" };
      lastStatus = 502;
      return null;
    });

    if (!upstream) continue;

    lastStatus = upstream.status;
    lastJson = await readJson(upstream).catch((err) => ({
      success: false,
      error: err?.message || "bad_response",
    }));

    if (upstream.ok && lastJson?.success) {
      return NextResponse.json(lastJson, { status: upstream.status });
    }

    if (![401, 403].includes(upstream.status)) break;
  }

  const reason =
    lastJson?.code === "DATABASE_SCHEMA_NOT_READY"
      ? "Database schema is not ready; showing local model defaults."
      : lastStatus === 401
        ? "Configured model-registry key is invalid; showing local model defaults."
        : lastStatus === 403
          ? "Current plan/key cannot access live model registry; showing local model defaults."
          : "Live model registry unavailable; showing local model defaults.";

  return NextResponse.json(fallbackRegistry(reason), { status: 200 });
}
