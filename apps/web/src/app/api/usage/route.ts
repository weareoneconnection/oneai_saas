// apps/web/src/app/api/usage/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiBase() {
  // ✅ 兼容两个 env 名称，避免你在 Vercel 配了一个、代码读另一个
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "https://oneai-api-production.up.railway.app";

  return String(raw).replace(/\/$/, "");
}

function adminKey() {
  // ✅ 兼容两个 env 名称
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
    // 1) 必须登录
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // 2) 解析 range
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    // 3) 必须有 admin key（否则后端 /v1/admin/usage 会 403）
    const key = adminKey();
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
    const url = `${apiBase()}/v1/admin/usage?userEmail=${encodeURIComponent(
      email
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