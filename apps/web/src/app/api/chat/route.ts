import { NextRequest, NextResponse } from "next/server";

const API_BASE_RAW =
  process.env.ONEAI_API_BASE_URL ||
  process.env.ONEAI_BASE_URL ||
  "https://oneai-saas-api-production.up.railway.app";
const API_BASE = API_BASE_RAW.replace(/\/$/, "");
const API_KEY =
  process.env.ONEAI_API_KEY ||
  process.env.ONEAI_ADMIN_API_KEY ||
  process.env.ONEAI_ADMIN_KEY ||
  "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!API_KEY) {
      return NextResponse.json(
        { error: { message: "Missing ONEAI_API_KEY on web server env" } },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err?.message || "Proxy error",
        },
      },
      { status: 500 }
    );
  }
}
