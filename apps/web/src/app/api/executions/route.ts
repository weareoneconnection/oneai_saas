import { NextResponse } from "next/server";
import {
  oneAIAdminKey,
  oneAIBaseURLs,
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

function consoleKeys() {
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

function summarize(records: any[]) {
  return records.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === "SUCCEEDED") acc.succeeded += 1;
      if (row.status === "FAILED") acc.failed += 1;
      if (row.status === "RUNNING") acc.running += 1;
      if (row.status === "PENDING_APPROVAL" || row.status === "APPROVED") acc.pending += 1;
      if (row.proofJson) acc.withProof += 1;
      if (row.resultJson) acc.withResult += 1;
      return acc;
    },
    { total: 0, succeeded: 0, failed: 0, running: 0, pending: 0, withProof: 0, withResult: 0, verifiedProof: 0, needsReview: 0 }
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "customer";
  const identity =
    scope === "operator" ? await requireConsoleOperator() : await requireConsoleEmail();
  if (!identity.ok) return NextResponse.json(identity, { status: identity.status });

  const adminKey = oneAIAdminKey();
  const keys = consoleKeys();
  if (!keys.length) {
    return NextResponse.json({
      success: true,
      warning: "Configure ONEAI_ADMIN_API_KEY or ONEAI_API_KEY to load execution data.",
      data: { summary: summarize([]), executions: [] },
    });
  }

  const limit = searchParams.get("limit") || "50";
  const params = new URLSearchParams();
  params.set("limit", limit);
  if (scope !== "operator") params.set("userEmail", identity.email);

  for (const key of ["status", "executorType", "handoffId"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  if (!adminKey && scope !== "operator") {
    let lastStatus = 500;
    let lastJson: any = null;
    for (const apiKey of keys) {
      const upstream = await fetch(`${oneAIBaseURLs()[0]}/v1/executions?limit=${encodeURIComponent(limit)}`, {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
        },
        cache: "no-store",
      }).catch(() => null);
      if (!upstream) continue;
      lastStatus = upstream.status;
      lastJson = await readJsonSafe(upstream);
      if (upstream.ok) {
        const executions = Array.isArray(lastJson?.data) ? lastJson.data : [];
        return NextResponse.json({
          success: true,
          warning: "Using customer API key fallback. Operator proof review requires ONEAI_ADMIN_API_KEY.",
          data: { summary: summarize(executions), executions },
        });
      }
      if (![401, 403].includes(upstream.status)) break;
    }
    return NextResponse.json({
      success: true,
      warning: lastJson?.error || "Execution ledger is not configured for this console.",
      data: { summary: summarize([]), executions: [] },
    }, { status: 200 });
  }

  let lastJson: any = null;
  let lastStatus = 502;
  for (const base of oneAIBaseURLs()) {
    const url = `${base}/v1/admin/agent-executions?${params.toString()}`;
    const upstream = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-admin-key": adminKey,
      },
      cache: "no-store",
    }).catch((error) => {
      lastJson = { success: false, error: error?.message || "execution_fetch_failed", base };
      lastStatus = 502;
      return null;
    });
    if (!upstream) continue;
    lastStatus = upstream.status;
    lastJson = await readJsonSafe(upstream);
    if (upstream.ok) {
      return NextResponse.json(lastJson || { success: false, error: "empty_response" }, { status: upstream.status });
    }
    if (![401, 403, 500, 502, 503, 504].includes(upstream.status)) break;
  }

  return NextResponse.json(lastJson || { success: false, error: "execution_fetch_failed" }, { status: lastStatus });
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
    `${oneAIBaseURLs()[0]}/v1/admin/agent-executions/${encodeURIComponent(handoffId)}/review-proof`,
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
