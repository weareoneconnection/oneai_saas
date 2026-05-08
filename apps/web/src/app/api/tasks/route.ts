// apps/web/src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { requireConsoleEmail } from "@/lib/consoleIdentity";

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
        type: "business_strategy",
        name: "Business Strategy · 商业策略",
        description:
          "Turn business goals into structured strategy, milestones, risks, next actions, and success metrics. 将业务目标转成结构化策略。",
        category: "business",
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
        type: "content_engine",
        name: "Content Engine · 内容引擎",
        description:
          "Generate hooks, posts, CTAs, hashtags, and content variants for product launches and campaigns. 生成发布和营销内容。",
        category: "marketing",
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
        type: "campaign_mission",
        name: "Campaign Mission · 活动任务",
        description:
          "Design campaign missions with steps, proof, review policy, rewards, growth loops, and risk controls. 设计可验证活动任务。",
        category: "growth",
        tier: "pro",
        route: "/v1/generate",
        executionBoundary: "intelligence_only",
        maturity: "stable",
        templateVersions: [1],
        defaultTemplateVersion: 1,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
      {
        type: "support_brain",
        name: "Support Brain · 客服智能",
        description:
          "Generate support or community replies with intent, confidence, suggested action, and memory update. 生成客服和社区回复。",
        category: "support",
        tier: "pro",
        route: "/v1/generate",
        executionBoundary: "intelligence_only",
        maturity: "stable",
        templateVersions: [1],
        defaultTemplateVersion: 1,
        supportsDebug: true,
        supportsLLMOptions: true,
      },
      {
        type: "execution_plan",
        name: "Execution Plan · 执行计划",
        description: "Create verifiable execution plans for teams, bots, or OneClaw. OneAI does not execute directly. 为外部执行系统生成计划。",
        category: "operations",
        tier: "pro",
        route: "/v1/generate",
        executionBoundary: "plans_only",
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
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

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
