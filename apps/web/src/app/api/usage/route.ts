// apps/web/src/app/api/usage/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function apiBase() {
  return (process.env.ONEAI_API_BASE_URL || "https://oneai-api-production.up.railway.app").replace(/\/$/, "");
}
function adminKey() {
  return process.env.ONEAI_ADMIN_API_KEY || "";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";

  const r = await fetch(
    `${apiBase()}/v1/admin/usage?userEmail=${encodeURIComponent(email)}&range=${encodeURIComponent(range)}`,
    {
      headers: { "x-admin-key": adminKey() },
      cache: "no-store",
    }
  );

  const j = await r.json().catch(() => null);
  return NextResponse.json(j ?? { success: false, error: "bad response" }, { status: r.status });
}