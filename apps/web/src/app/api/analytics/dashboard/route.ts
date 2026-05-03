// apps/web/src/app/api/analytics/dashboard/route.ts
import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    return { success: false, error: "non_json_response", detail: text.slice(0, 500) };
  }
  return await res.json().catch(() => null);
}

export async function GET(req: Request) {
  try {
    const identity = await requireConsoleEmail();
    if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

    // 2) range
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h";

    // 3) admin key
    const key = oneAIAdminKey();
    if (!key) {
      return NextResponse.json(
        { success: false, error: "missing_admin_key" },
        { status: 500 }
      );
    }

    // 4) 透传到 API：/v1/admin/dashboard
    const url = `${oneAIBaseURL()}/v1/admin/dashboard?range=${encodeURIComponent(range)}&userEmail=${encodeURIComponent(identity.email)}`;

    const r = await fetch(url, {
      headers: { "x-admin-key": key },
      cache: "no-store",
    });

    const j = await safeJson(r);
    return NextResponse.json(j ?? { success: false, error: "bad_response" }, { status: r.status });
  } catch (e: any) {
    console.error("[/api/analytics/dashboard] error:", e?.message || e);
    return NextResponse.json(
      { success: false, error: "dashboard_route_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
