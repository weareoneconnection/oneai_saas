import { NextRequest, NextResponse } from "next/server";
import { oneAIBaseURL, requireConsoleEmail } from "@/lib/consoleIdentity";

const allowedPostEndpoints = new Set([
  "/v1/agent-plans",
  "/v1/handoff/preview",
  "/v1/context/preview",
]);

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

function apiKeys() {
  return Array.from(
    new Set(
      [
        process.env.ONEAI_ADMIN_API_KEY || "",
        process.env.ONEAI_ADMIN_KEY || "",
        process.env.ONEAI_API_KEY || "",
      ]
        .map((key) => key.trim())
        .filter(Boolean)
    )
  );
}

function missingKey() {
  return NextResponse.json(
    {
      success: false,
      error: "Missing ONEAI_ADMIN_API_KEY or ONEAI_API_KEY on web server env",
    },
    { status: 500 }
  );
}

async function proxyAgentOS(path: string, init?: RequestInit) {
  const keys = apiKeys();
  if (!keys.length) return { missingKey: true as const };

  let lastStatus = 500;
  let lastJson: unknown = null;

  for (const key of keys) {
    const upstream = await fetch(`${oneAIBaseURL()}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        accept: "application/json",
        "x-api-key": key,
      },
      cache: "no-store",
    }).catch((err) => {
      lastStatus = 502;
      lastJson = {
        success: false,
        error: err?.message || "agent_os_upstream_unavailable",
      };
      return null;
    });

    if (!upstream) continue;

    lastStatus = upstream.status;
    lastJson = await readJsonSafe(upstream);

    if (upstream.ok) {
      return { status: upstream.status, json: lastJson };
    }

    if (![401, 403].includes(upstream.status)) {
      return { status: upstream.status, json: lastJson };
    }
  }

  return {
    status: lastStatus,
    json: lastJson || { success: false, error: "Invalid API key" },
  };
}

export async function GET() {
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const proxied = await proxyAgentOS("/v1/capabilities");
  if ("missingKey" in proxied) return missingKey();

  return NextResponse.json(proxied.json || { success: false, error: "empty_response" }, {
    status: proxied.status,
  });
}

export async function POST(req: NextRequest) {
  const identity = await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const body = await req.json().catch(() => ({}));
  const endpoint = String(body?.endpoint || "").trim();

  if (!allowedPostEndpoints.has(endpoint)) {
    return NextResponse.json(
      { success: false, error: "Unsupported Agent OS endpoint", code: "AGENT_OS_ENDPOINT_FORBIDDEN" },
      { status: 400 }
    );
  }

  const proxied = await proxyAgentOS(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body?.payload || {}),
  });
  if ("missingKey" in proxied) return missingKey();

  return NextResponse.json(proxied.json || { success: false, error: "empty_response" }, {
    status: proxied.status,
  });
}
