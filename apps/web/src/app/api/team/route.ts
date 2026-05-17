import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURLs, requireConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: "bad_json_from_api", raw: text.slice(0, 1200) };
  }
}

export async function GET() {
  const identity = await requireConsoleEmail();
  if (!identity.ok) {
    return NextResponse.json({ success: false, error: identity.error, hint: identity.hint }, { status: identity.status });
  }

  const key = oneAIAdminKey();
  if (!key) {
    return NextResponse.json({
      success: true,
      warning: "Configure ONEAI_ADMIN_API_KEY to load live team data and enable member management.",
      data: null,
    });
  }

  let lastJson: any = null;
  let lastStatus = 502;
  for (const base of oneAIBaseURLs()) {
    const url = `${base}/v1/admin/team?userEmail=${encodeURIComponent(identity.email)}`;
    const res = await fetch(url, {
      headers: { "x-admin-key": key },
      cache: "no-store",
    }).catch((error) => {
      lastJson = { success: false, error: error?.message || "team_fetch_failed", base };
      lastStatus = 502;
      return null;
    });
    if (!res) continue;
    lastStatus = res.status;
    lastJson = await readJsonSafe(res);
    if (res.ok) return NextResponse.json(lastJson || { success: false, error: "empty_response" }, { status: res.status });
    if (![401, 403, 500, 502, 503, 504].includes(res.status)) break;
  }

  return NextResponse.json(lastJson || { success: false, error: "team_fetch_failed" }, { status: lastStatus });
}

export async function POST(req: Request) {
  const identity = await requireConsoleEmail();
  if (!identity.ok) {
    return NextResponse.json({ success: false, error: identity.error, hint: identity.hint }, { status: identity.status });
  }

  const key = oneAIAdminKey();
  if (!key) return NextResponse.json({ success: false, error: "ONEAI_ADMIN_API_KEY missing" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${oneAIBaseURLs()[0]}/v1/admin/team/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify({ ...body, userEmail: identity.email }),
  });
  const json = await readJsonSafe(res);
  return NextResponse.json(json || { success: false, error: "empty_response" }, { status: res.status });
}

export async function PATCH(req: Request) {
  const identity = await requireConsoleEmail();
  if (!identity.ok) {
    return NextResponse.json({ success: false, error: identity.error, hint: identity.hint }, { status: identity.status });
  }

  const key = oneAIAdminKey();
  if (!key) return NextResponse.json({ success: false, error: "ONEAI_ADMIN_API_KEY missing" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  if (!id) return NextResponse.json({ success: false, error: "member id required" }, { status: 400 });

  const res = await fetch(`${oneAIBaseURLs()[0]}/v1/admin/team/members/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify({ ...body, userEmail: identity.email }),
  });
  const json = await readJsonSafe(res);
  return NextResponse.json(json || { success: false, error: "empty_response" }, { status: res.status });
}

export async function DELETE(req: Request) {
  const identity = await requireConsoleEmail();
  if (!identity.ok) {
    return NextResponse.json({ success: false, error: identity.error, hint: identity.hint }, { status: identity.status });
  }

  const key = oneAIAdminKey();
  if (!key) return NextResponse.json({ success: false, error: "ONEAI_ADMIN_API_KEY missing" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ success: false, error: "member id required" }, { status: 400 });

  const upstream = new URL(`${oneAIBaseURLs()[0]}/v1/admin/team/members/${encodeURIComponent(id)}`);
  upstream.searchParams.set("userEmail", identity.email);
  const res = await fetch(upstream, {
    method: "DELETE",
    headers: { "x-admin-key": key },
  });
  const json = await readJsonSafe(res);
  return NextResponse.json(json || { success: false, error: "empty_response" }, { status: res.status });
}
