// apps/web/src/app/api/usage/route.ts
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

    // 2) 解析 range
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    // 3) 必须有 admin key（否则后端 /v1/admin/usage 会 403）
    const key = oneAIAdminKey();
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_admin_key",
          hint:
            "Set ONEAI_ADMIN_API_KEY (or ONEAI_ADMIN_KEY) in Vercel Production env, then redeploy.",
        },
        { status: 500 }
      );
    }

    // 4) 调后端
    const url = `${oneAIBaseURL()}/v1/admin/usage?userEmail=${encodeURIComponent(
      identity.email
    )}&range=${encodeURIComponent(range)}`;

    const r = await fetch(url, {
      headers: { "x-admin-key": key },
      cache: "no-store",
    });

    const j = await safeJson(r);

    // 5) 透传后端状态码 + body（但保证一定是 JSON）
    return NextResponse.json(
      j ?? { success: false, error: "bad_response" },
      { status: r.status }
    );
  } catch (e: any) {
    console.error("[/api/usage] error:", e?.message || e, e);
    return NextResponse.json(
      { success: false, error: "usage_route_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
