import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURLs, requireConsoleOperator } from "@/lib/consoleIdentity";

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

  let lastStatus = 502;
  let lastJson: any = { success: false, error: "customers_route_failed" };

  for (const baseURL of oneAIBaseURLs()) {
    const upstream = await fetch(`${baseURL}/v1/admin/customers`, {
      headers: {
        accept: "application/json",
        "x-admin-key": key,
      },
      cache: "no-store",
    });

    const json = await readJsonSafe(upstream);
    lastStatus = upstream.status;
    lastJson = json || { success: false, error: "empty_response" };

    if (upstream.status === 401 || upstream.status === 403) {
      lastJson = {
        success: false,
        error: lastJson?.error || "admin_upstream_forbidden",
        hint:
          "Web is logged in as an operator, but the API admin request was rejected. Check ONEAI_ADMIN_API_KEY on the Web service and ADMIN_API_KEY / ONEAI_ADMIN_API_KEY on the API service.",
        upstreamStatus: upstream.status,
      };
    }

    if (upstream.ok) {
      return NextResponse.json(lastJson, { status: upstream.status });
    }
  }

  return NextResponse.json(lastJson, { status: lastStatus });
}
