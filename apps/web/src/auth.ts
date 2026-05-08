// apps/web/src/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

const hasEmailProvider =
  !!process.env.EMAIL_SERVER && !!process.env.EMAIL_FROM;
const hasGoogleProvider =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const hasConsolePassword =
  !!process.env.ONEAI_CONSOLE_USER_EMAIL && !!process.env.ONEAI_CONSOLE_PASSWORD;

function oneAIBaseURL() {
  const raw =
    process.env.ONEAI_API_BASE_URL ||
    process.env.ONEAI_BASE_URL ||
    "https://oneai-saas-api-production.up.railway.app";
  return String(raw).replace(/\/$/, "");
}

function oneAIAdminKey() {
  return String(process.env.ONEAI_ADMIN_API_KEY || process.env.ONEAI_ADMIN_KEY || "");
}

async function writeConsoleAuditEvent(input: {
  userEmail?: string | null;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}) {
  const key = oneAIAdminKey();
  if (!key || !input.userEmail) return;

  try {
    await fetch(`${oneAIBaseURL()}/v1/admin/audit/event`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-key": key,
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[auth] failed to write audit event", err);
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    ...(hasGoogleProvider
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(hasEmailProvider
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER!,
            from: process.env.EMAIL_FROM!,
          }),
        ]
      : []),
    ...(hasConsolePassword
      ? [
          CredentialsProvider({
            name: "Console Password",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const email = String(credentials?.email || "").trim().toLowerCase();
              const password = String(credentials?.password || "");
              const allowedEmail = String(process.env.ONEAI_CONSOLE_USER_EMAIL || "").trim().toLowerCase();
              const allowedPassword = String(process.env.ONEAI_CONSOLE_PASSWORD || "");

              if (email === allowedEmail && password === allowedPassword) {
                return { id: email, email, name: "OneAI Console" };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login",
  },
  events: {
    async signIn(message) {
      await writeConsoleAuditEvent({
        userEmail: message.user?.email,
        action: "console.sign_in",
        target: message.user?.email || undefined,
        metadata: {
          provider: message.account?.provider || "unknown",
          accountType: message.account?.type || "unknown",
        },
      });
    },
  },
};
