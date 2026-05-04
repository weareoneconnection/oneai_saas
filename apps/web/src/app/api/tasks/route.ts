// apps/web/src/app/api/tasks/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiBase() {
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "https://oneai-saas-api-production.up.railway.app";
  return raw.replace(/\/$/, "");
}

function apiKeys() {
  return [
    process.env.ONEAI_API_KEY || "",
    process.env.ONEAI_ADMIN_API_KEY || "",
    process.env.ONEAI_ADMIN_KEY || "",
  ].filter(Boolean);
}

async function readJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function fallbackTasks(reason: string) {
  return {
    success: true,
    warning: reason,
    data: [
      {
        type: "agent_plan",
        name: "Agent Plan",
        description:
          "Turn a goal into structured agent-ready strategy, missions, actions, and reasoning.",
        category: "core",
        tier: "free",
        route: "/v1/generate",
        executionBoundary: "intelligence_only",
        maturity: "stable",
        templateVersions: [1],
        defaultTemplateVersion: 1,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
      {
        type: "mission_os",
        name: "Mission OS",
        description:
          "Generate a complete mission with execution, proof, review, reward, growth, and risk design.",
        category: "core",
        tier: "free",
        route: "/v1/generate",
        executionBoundary: "intelligence_only",
        maturity: "stable",
        templateVersions: [1],
        defaultTemplateVersion: 1,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
      {
        type: "waoc_chat",
        name: "WAOC Chat",
        description:
          "Community-aware chat intelligence for WAOC and related ecosystems.",
        category: "community",
        tier: "free",
        route: "/v1/generate",
        executionBoundary: "intelligence_only",
        maturity: "stable",
        templateVersions: [4],
        defaultTemplateVersion: 4,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
      {
        type: "oneclaw_execute",
        name: "OneClaw Execute",
        description:
          "Plan OneClaw-compatible execution tasks without executing them inside OneAI.",
        category: "execution_planning",
        tier: "pro",
        route: "/v1/generate",
        executionBoundary: "plans_only",
        maturity: "stable",
        templateVersions: [1],
        defaultTemplateVersion: 1,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
      {
        type: "market_decision",
        name: "Market Decision",
        description: "Decision intelligence for market actions.",
        category: "market",
        tier: "pro",
        route: "/v1/generate",
        executionBoundary: "intelligence_only",
        maturity: "stable",
        templateVersions: [1],
        defaultTemplateVersion: 1,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
    ],
  };
}

export async function GET() {
  const keys = apiKeys();
  if (!keys.length) {
    return NextResponse.json(
      fallbackTasks("No API key configured for live task registry; showing local defaults."),
      { status: 200 }
    );
  }

  let lastStatus = 500;
  let lastJson: any = null;

  for (const key of keys) {
    const upstream = await fetch(`${apiBase()}/v1/tasks`, {
      headers: { "x-api-key": key, accept: "application/json" },
      cache: "no-store",
    }).catch((err) => {
      lastStatus = 502;
      lastJson = { success: false, error: err?.message || "fetch_failed" };
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
      ? "Database schema is not ready; showing local task defaults."
      : lastStatus === 401
        ? "Configured task-registry key is invalid; showing local task defaults."
        : lastStatus === 403
          ? "Current key cannot access live task registry; showing local task defaults."
          : "Live task registry unavailable; showing local task defaults.";

  return NextResponse.json(fallbackTasks(reason), { status: 200 });
}
