import { NextResponse } from "next/server";
import {
  oneAIAdminKey,
  oneAIBaseURLs,
  requireConsoleOperator,
} from "@/lib/consoleIdentity";

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

export async function POST(req: Request) {
  const identity = await requireConsoleOperator();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const key = oneAIAdminKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "ONEAI_ADMIN_API_KEY is missing on web server" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

  const payload = {
    plan: body?.plan || "team",
    revenueUsd: Number(body?.revenueUsd || 0),
    revenueSharePct: Number(body?.revenueSharePct || 0) || undefined,
    metadata: {
      convertedBy: identity.email,
      source: "sales_leads_console",
    },
  };

  let lastStatus = 502;
  let lastJson: any = { success: false, error: "referral_convert_failed" };

  for (const baseURL of oneAIBaseURLs()) {
    const upstream = await fetch(`${baseURL}/v1/admin/referrals/${encodeURIComponent(id)}/convert`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-key": key,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await readJsonSafe(upstream);
    lastStatus = upstream.status;
    lastJson = json || { success: false, error: "empty_response" };

    if (upstream.ok) return NextResponse.json(lastJson, { status: upstream.status });
  }

  return NextResponse.json(lastJson, { status: lastStatus });
}
