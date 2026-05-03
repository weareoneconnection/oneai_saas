// apps/web/src/app/api/keys/route.ts
import { NextResponse } from "next/server";
import { getConsoleEmail } from "@/lib/consoleIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = Record<string, any>;

function normalizeBase(raw?: string) {
  let v = String(raw || "https://oneai-saas-api-production.up.railway.app").trim();
  v = v.replace(/\/$/, "");

  // ✅ localhost 统一走 IPv4，避免某些环境解析到 ::1
  v = v.replace(/^http:\/\/localhost(?=:\d+|$)/, "http://127.0.0.1");
  v = v.replace(/^http:\/\/\[::1\](?=:\d+|$)/, "http://127.0.0.1");

  return v;
}

function env() {
  // ✅ 线上默认永远指向 production API（除非你显式配置）
  const base = normalizeBase(
    process.env.ONEAI_API_BASE_URL || process.env.ONEAI_BASE_URL || "https://oneai-saas-api-production.up.railway.app"
  );

  const key = String(process.env.ONEAI_ADMIN_API_KEY || "");
  if (!key) {
    return {
      ok: false as const,
      status: 500,
      error: "ONEAI_ADMIN_API_KEY missing",
      hint: "Set ONEAI_ADMIN_API_KEY in Vercel (Production) and redeploy.",
      base,
    };
  }

  return { ok: true as const, base, key };
}

async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");
  const trimmed = text?.trim?.() || "";

  // 空 body 也算正常（由上层决定怎么处理）
  if (!trimmed) return { ok: true as const, json: null as any, text: "" };

  // 优先按 JSON 解析
  const looksJson = ct.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksJson) {
    return { ok: false as const, json: null as any, text: trimmed };
  }

  try {
    return { ok: true as const, json: JSON.parse(trimmed), text: trimmed };
  } catch {
    return { ok: false as const, json: null as any, text: trimmed };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const timeoutMs = init.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _, ...rest } = init;
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function ok(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

function fail(payload: Json, status = 500) {
  return NextResponse.json({ success: false, ...payload }, { status });
}

async function requireEmail() {
  const email = await getConsoleEmail();
  if (!email) return { ok: false as const, status: 401, error: "unauthorized" };
  return { ok: true as const, email };
}

function safeRaw(raw: string, max = 1200) {
  const s = String(raw || "");
  return s.length > max ? s.slice(0, max) + "…(truncated)" : s;
}

export async function GET() {
  const auth = await requireEmail();
  if (!auth.ok) return fail({ error: auth.error }, auth.status);

  const e = env();
  if (!e.ok) return fail({ error: e.error, hint: e.hint, base: e.base }, e.status);

  const url = `${e.base}/v1/admin/keys?userEmail=${encodeURIComponent(auth.email)}`;

  try {
    const r = await fetchWithTimeout(url, {
      headers: { "x-admin-key": e.key },
      cache: "no-store",
      timeoutMs: 10_000,
    });

    const parsed = await readJsonSafe(r);
    if (!parsed.ok) {
      return fail(
        {
          error: "bad_json_from_api",
          url,
          base: e.base,
          status: r.status,
          raw: safeRaw(parsed.text),
        },
        r.status || 502
      );
    }

    return ok(parsed.json ?? { success: false, error: "empty_response", url }, r.status);
  } catch (err: any) {
    const isAbort = err?.name === "AbortError";
    return fail(
      {
        error: "fetch_failed",
        url,
        base: e.base,
        message: isAbort ? "timeout" : String(err?.message || err),
      },
      500
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireEmail();
  if (!auth.ok) return fail({ error: auth.error }, auth.status);

  const e = env();
  if (!e.ok) return fail({ error: e.error, hint: e.hint, base: e.base }, e.status);

  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = (body?.name || "default").toString().trim().slice(0, 64) || "default";

  const url = `${e.base}/v1/admin/keys`;

  try {
    const r = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": e.key,
      },
      body: JSON.stringify({ userEmail: auth.email, name }),
      timeoutMs: 10_000,
    });

    const parsed = await readJsonSafe(r);
    if (!parsed.ok) {
      return fail(
        {
          error: "bad_json_from_api",
          url,
          base: e.base,
          status: r.status,
          raw: safeRaw(parsed.text),
        },
        r.status || 502
      );
    }

    return ok(parsed.json ?? { success: false, error: "empty_response", url }, r.status);
  } catch (err: any) {
    const isAbort = err?.name === "AbortError";
    return fail(
      {
        error: "fetch_failed",
        url,
        base: e.base,
        message: isAbort ? "timeout" : String(err?.message || err),
      },
      500
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireEmail();
  if (!auth.ok) return fail({ error: auth.error }, auth.status);

  const e = env();
  if (!e.ok) return fail({ error: e.error, hint: e.hint, base: e.base }, e.status);

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = (body?.id || "").toString().trim();
  if (!id) return fail({ error: "missing_id" }, 400);

  const url = `${e.base}/v1/admin/keys/revoke`;

  try {
    const r = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": e.key,
      },
      body: JSON.stringify({ userEmail: auth.email, id }),
      timeoutMs: 10_000,
    });

    const parsed = await readJsonSafe(r);
    if (!parsed.ok) {
      return fail(
        {
          error: "bad_json_from_api",
          url,
          base: e.base,
          status: r.status,
          raw: safeRaw(parsed.text),
        },
        r.status || 502
      );
    }

    return ok(parsed.json ?? { success: false, error: "empty_response", url }, r.status);
  } catch (err: any) {
    const isAbort = err?.name === "AbortError";
    return fail(
      {
        error: "fetch_failed",
        url,
        base: e.base,
        message: isAbort ? "timeout" : String(err?.message || err),
      },
      500
    );
  }
}
