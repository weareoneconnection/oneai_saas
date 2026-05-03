import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export function oneAIBaseURL() {
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "https://oneai-saas-api-production.up.railway.app";
  return String(raw).replace(/\/$/, "");
}

export function oneAIAdminKey() {
  return String(process.env.ONEAI_ADMIN_API_KEY || process.env.ONEAI_ADMIN_KEY || "");
}

export async function getConsoleEmail() {
  const session = await getServerSession(authOptions).catch(() => null);
  const email =
    session?.user?.email ||
    process.env.ONEAI_CONSOLE_USER_EMAIL ||
    process.env.ONEAI_ADMIN_EMAIL ||
    "";

  return String(email).trim().toLowerCase();
}

export async function requireConsoleEmail() {
  const email = await getConsoleEmail();
  if (!email) {
    return {
      ok: false as const,
      status: 401,
      error: "unauthorized",
      hint: "Sign in or set ONEAI_CONSOLE_USER_EMAIL on the web service.",
    };
  }
  return { ok: true as const, email };
}

