import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleOperator } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: "bad_upstream_response", raw: text.slice(0, 1000) };
  }
}

export async function GET() {
  const identity = await requireConsoleOperator();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const key = oneAIAdminKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "ONEAI_ADMIN_API_KEY is missing on web server" },
      { status: 500 }
    );
  }

  const upstream = await fetch(`${oneAIBaseURL()}/v1/admin/customers`, {
    headers: {
      accept: "application/json",
      "x-admin-key": key,
    },
    cache: "no-store",
  });

  const json = await readJsonSafe(upstream);
  return NextResponse.json(json || { success: false, error: "empty_response" }, {
    status: upstream.status,
  });
}
