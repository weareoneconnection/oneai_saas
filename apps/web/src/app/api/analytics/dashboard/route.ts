// apps/web/src/app/api/analytics/dashboard/route.ts
import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardPayload = {
  range: { fromISO: string; toISO: string };
  kpis: {
    requests24h: number;
    tokens24h: number;
    cost24hUSD: number;
    activeKeys: number;
    p95LatencyMs?: number;
    errorRatePct?: number;
  };
  timeseries24h: Array<{
    hour: string;
    requests: number;
    tokens: number;
    costUSD: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    provider?: string;
    tokens: number;
    requests: number;
    costUSD: number;
  }>;
  envSegmentation: Array<{
    env: "prod" | "dev" | "staging";
    requests: number;
    tokens: number;
    costUSD: number;
  }>;
  keyUsage: Array<{
    key: string;
    env: "prod" | "dev" | "staging";
    requests: number;
    tokens: number;
    costUSD: number;
    lastUsedISO?: string;
  }>;
  forecast7d: Array<{
    day: string;
    forecastCostUSD: number;
  }>;
};

function emptyDashboard(): DashboardPayload {
  const now = new Date();
  const toISO = now.toISOString();
  const fromISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  return {
    range: { fromISO, toISO },
    kpis: {
      requests24h: 0,
      tokens24h: 0,
      cost24hUSD: 0,
      activeKeys: 0,
      p95LatencyMs: undefined,
      errorRatePct: undefined,
    },
    timeseries24h: [],
    modelBreakdown: [],
    envSegmentation: [],
    keyUsage: [],
    forecast7d: [],
  };
}

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";

  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    return {
      success: false,
      error: "non_json_response",
      detail: text.slice(0, 500),
    };
  }

  return await res.json().catch(() => null);
}

export async function GET(req: Request) {
  try {
    const identity = await requireConsoleEmail();

    if (!identity.ok) {
      return NextResponse.json(identity, { status: identity.status });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h";

    const key = oneAIAdminKey();

    if (!key) {
      return NextResponse.json({
        success: true,
        source: "empty",
        warning: "missing_admin_key",
        data: emptyDashboard(),
      });
    }

    /**
     * API server mounts adminDashboardRouter at /v1/admin-dashboard,
     * and the router exposes /dashboard.
     */
    const url = `${oneAIBaseURL()}/v1/admin-dashboard/dashboard?range=${encodeURIComponent(
      range
    )}&userEmail=${encodeURIComponent(identity.email)}`;

    const r = await fetch(url, {
      headers: {
        "x-admin-key": key,
      },
      cache: "no-store",
    });

    const j = await safeJson(r);

    if (!r.ok) {
      console.warn("[/api/analytics/dashboard] upstream failed:", {
        status: r.status,
        body: j,
      });

      return NextResponse.json({
        success: true,
        source: "empty",
        warning: "upstream_dashboard_unavailable",
        upstreamStatus: r.status,
        upstreamError: j?.error || "unknown_upstream_error",
        data: emptyDashboard(),
      });
    }

    return NextResponse.json(j ?? {
      success: true,
      source: "empty",
      warning: "bad_upstream_response",
      data: emptyDashboard(),
    });
  } catch (e: any) {
    console.error("[/api/analytics/dashboard] error:", e?.message || e);

    return NextResponse.json({
      success: true,
      source: "empty",
      warning: "dashboard_route_failed",
      detail: String(e?.message || e),
      data: emptyDashboard(),
    });
  }
}
