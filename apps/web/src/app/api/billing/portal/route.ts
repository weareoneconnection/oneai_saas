import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const r = await fetch(`${oneAIBaseURL()}/v1/billing/portal`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": oneAIAdminKey(),
    },
    body: JSON.stringify({ userEmail: identity.email }),
    cache: "no-store",
  });

  const j = await r.json().catch(() => null);
  return NextResponse.json(j ?? { success: false, error: "bad response" }, { status: r.status });
}
