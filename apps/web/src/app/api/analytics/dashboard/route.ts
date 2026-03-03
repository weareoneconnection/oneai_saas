// apps/web/src/app/api/analytics/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiBase() {
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "https://oneai-api-production.up.railway.app"; // ✅ 本地优先（你要测试本地 API）
  return String(raw).replace(/\/$/, "");
}

function adminKey() {
  return String(process.env.ONEAI_ADMIN_API_KEY || process.env.ONEAI_ADMIN_KEY || "");
}

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
    // 1) 必须登录（跟 /api/usage 一样）
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
    }

    // 2) range
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h";

    // 3) admin key
    const key = adminKey();
    if (!key) {
      return NextResponse.json(
        { success: false, error: "missing_admin_key" },
        { status: 500 }
      );
    }

    // 4) 透传到 API：/v1/admin/dashboard
    const url = `${apiBase()}/v1/admin/dashboard?range=${encodeURIComponent(range)}&userEmail=${encodeURIComponent(email)}`;

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