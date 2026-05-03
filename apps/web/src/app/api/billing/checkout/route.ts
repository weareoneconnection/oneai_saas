import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function apiBase() {
  return (process.env.ONEAI_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}
function adminKey() {
  return process.env.ONEAI_ADMIN_API_KEY || "";
}

function isPlaceholder(value?: string | null) {
  return !value || /xxx|yyy|placeholder|replace|your_/i.test(String(value));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });

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
  if (!adminKey()) {
    return NextResponse.json(
      {
        success: false,
        error: "ONEAI_ADMIN_API_KEY is missing on web server",
        code: "ONEAI_ADMIN_KEY_MISSING",
      },
      { status: 500 }
    );
  }

  const r = await fetch(`${apiBase()}/v1/billing/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": adminKey(),
    },
    body: JSON.stringify({ userEmail: email, priceId }),
    cache: "no-store",
  });

  const j = await r.json().catch(() => null);
  return NextResponse.json(j ?? { success: false, error: "bad response" }, { status: r.status });
}
