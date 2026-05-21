import { NextResponse } from "next/server";
import {
  oneAIAdminKey,
  oneAIBaseURLs,
  requireConsoleEmail,
} from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeRef(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

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
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const key = oneAIAdminKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "ONEAI_ADMIN_API_KEY is missing on web server" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const refCode = normalizeRef(String(body?.refCode || ""));
  if (!refCode) return NextResponse.json({ success: false, error: "refCode required" }, { status: 400 });

  const payload = {
    userEmail: identity.email,
    refCode,
    sourcePath: body?.sourcePath ? String(body.sourcePath).slice(0, 500) : null,
    landingPath: body?.landingPath ? String(body.landingPath).slice(0, 500) : null,
    metadata: {
      userAgent: req.headers.get("user-agent") || null,
      claimedFrom: "web",
    },
  };

  let lastStatus = 502;
  let lastJson: any = { success: false, error: "referral_claim_failed" };

  for (const baseURL of oneAIBaseURLs()) {
    const upstream = await fetch(`${baseURL}/v1/admin/referrals/claim`, {
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
