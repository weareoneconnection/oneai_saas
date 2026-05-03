import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safeReadJson(r: Response) {
  // 204/205 -> 没 body
  if (r.status === 204 || r.status === 205) return null;

  const text = await r.text(); // ✅ 永远先读 text
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { __non_json: true, raw: text.slice(0, 2000) };
  }
}

export async function GET(req: Request) {
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const url = `${oneAIBaseURL()}/v1/billing/status?userEmail=${encodeURIComponent(identity.email)}`;

  let r: Response;
  try {
    r = await fetch(url, {
      headers: { "x-admin-key": oneAIAdminKey() },
      cache: "no-store",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: "upstream_fetch_failed", detail: e?.message || String(e) },
      { status: 502 }
    );
  }

  const parsed = await safeReadJson(r);

  // ✅ upstream 不是 JSON 或者空 body：给前端一个明确的错误结构
  if (!parsed || (parsed as any)?.__non_json) {
    return NextResponse.json(
      {
        success: false,
        error: "bad_upstream_response",
        upstreamStatus: r.status,
        upstreamContentType: r.headers.get("content-type"),
        upstreamBodyPreview: (parsed as any)?.raw || null,
      },
      { status: 502 }
    );
  }

  return NextResponse.json(parsed, { status: r.status });
}
