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
};
