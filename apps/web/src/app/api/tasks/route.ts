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
        type: "business_strategy",
        name: "商业策略规划 · Business Strategy",
        description:
          "把业务目标转成结构化策略、里程碑、风险、下一步行动和成功指标。",
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
        name: "内容引擎 · Content Engine",
        description:
          "生成产品发布、营销活动和社媒传播所需的 hooks、posts、CTA 和变体。",
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
        name: "活动任务设计 · Campaign Mission",
        description:
          "设计带步骤、证明、审核、奖励、增长循环和风险控制的活动任务。",
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
        name: "客服智能大脑 · Support Brain",
        description:
          "为客服或社区场景生成回复、意图识别、建议动作和记忆更新。",
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
        name: "执行计划 · Execution Plan",
        description: "为外部团队、Bot 或 OneClaw 生成可验证执行计划，OneAI 不直接执行。",
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
