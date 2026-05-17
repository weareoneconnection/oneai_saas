import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export function oneAIBaseURL() {
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "https://oneai-saas-api-production.up.railway.app";
  return String(raw).replace(/\/$/, "");
}

export function oneAIBaseURLs() {
  const primary = oneAIBaseURL();
  const production = "https://oneai-saas-api-production.up.railway.app";
  return Array.from(new Set([primary, production].map((url) => url.replace(/\/$/, ""))));
}

export function oneAIAdminKey() {
  return String(
    process.env.ONEAI_ADMIN_API_KEY ||
      process.env.ONEAI_ADMIN_KEY ||
      process.env.ADMIN_API_KEY ||
      ""
  );
}

export async function getConsoleEmail() {
  const session = await getServerSession(authOptions).catch(() => null);
  const email = session?.user?.email || "";

  return String(email).trim().toLowerCase();
}

export async function requireConsoleEmail() {
  const email = await getConsoleEmail();
  if (!email) {
    return {
      ok: false as const,
      status: 401,
      error: "unauthorized",
      hint: "Sign in with Google or console password before using the OneAI console.",
    };
  }
  return { ok: true as const, email };
}

function operatorEmails() {
  return new Set(
    [
      process.env.ONEAI_OPERATOR_EMAILS || "",
      process.env.ONEAI_ADMIN_EMAIL || "",
      process.env.ONEAI_CONSOLE_USER_EMAIL || "",
    ]
      .join(",")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireConsoleOperator() {
  const identity = await requireConsoleEmail();
  if (!identity.ok) return identity;

  const allowed = operatorEmails();
  if (allowed.size > 0 && !allowed.has(identity.email)) {
    return {
      ok: false as const,
      status: 403,
      error: "forbidden",
      hint: "This operator view is limited to OneAI project owners.",
    };
  }

  return identity;
}
