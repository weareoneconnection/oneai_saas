import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

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
    return NextResponse.json(
      { success: false, error: "ONEAI_ADMIN_API_KEY missing", hint: "Set ONEAI_ADMIN_API_KEY for the web service." },
      { status: 500 }
    );
  }

  const url = `${oneAIBaseURL()}/v1/admin/team?userEmail=${encodeURIComponent(identity.email)}`;
  const res = await fetch(url, {
    headers: { "x-admin-key": key },
    cache: "no-store",
  }).catch((error) => {
    throw new Error(error?.message || "team_fetch_failed");
  });

  const json = await readJsonSafe(res);
  return NextResponse.json(json || { success: false, error: "empty_response" }, { status: res.status });
}
