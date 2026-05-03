import { NextResponse } from "next/server";
import { oneAIAdminKey, oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlaceholder(value?: string | null) {
  return !value || /xxx|yyy|placeholder|replace|your_/i.test(String(value));
}

export async function POST(req: Request) {
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const body = await req.json().catch(() => null);
  const priceId = String(body?.priceId || "");
  if (!priceId) return NextResponse.json({ success: false, error: "priceId required" }, { status: 400 });
  if (isPlaceholder(priceId)) {
    return NextResponse.json(
      {
        success: false,
        error: "Stripe price id is not configured for this plan",
        code: "STRIPE_PRICE_MISSING",
      },
      { status: 500 }
    );
  }
  if (!oneAIAdminKey()) {
    return NextResponse.json(
      {
        success: false,
        error: "ONEAI_ADMIN_API_KEY is missing on web server",
        code: "ONEAI_ADMIN_KEY_MISSING",
      },
      { status: 500 }
    );
  }

  const r = await fetch(`${oneAIBaseURL()}/v1/billing/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": oneAIAdminKey(),
    },
    body: JSON.stringify({ userEmail: identity.email, priceId }),
    cache: "no-store",
  });

  const j = await r.json().catch(() => null);
  return NextResponse.json(j ?? { success: false, error: "bad response" }, { status: r.status });
}
