import { NextResponse } from "next/server";
import {
  oneAIAdminKey,
  oneAIBaseURL,
  requireConsoleEmail,
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "customer";
  const identity =
    scope === "operator" ? await requireConsoleOperator() : await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const key = oneAIAdminKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "ONEAI_ADMIN_API_KEY is missing on web server" },
      { status: 500 }
    );
  }

  const limit = searchParams.get("limit") || "50";
  const params = new URLSearchParams();
  params.set("limit", limit);
  if (scope !== "operator") params.set("userEmail", identity.email);

  for (const key of ["status", "executorType", "handoffId"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  const url = `${oneAIBaseURL()}/v1/admin/agent-executions?${params.toString()}`;

  const upstream = await fetch(url, {
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
  const handoffId = String(body?.handoffId || "").trim();
  if (!handoffId) {
    return NextResponse.json({ success: false, error: "handoffId required" }, { status: 400 });
  }

  const upstream = await fetch(
    `${oneAIBaseURL()}/v1/admin/agent-executions/${encodeURIComponent(handoffId)}/review-proof`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-admin-key": key,
      },
      body: JSON.stringify({
        reviewer: identity.email,
        reviewStatus: body?.reviewStatus,
        reviewNote: body?.reviewNote,
      }),
      cache: "no-store",
    }
  );

  const json = await readJsonSafe(upstream);
  return NextResponse.json(json || { success: false, error: "empty_response" }, {
    status: upstream.status,
  });
}
