// apps/web/src/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";

const hasEmailProvider =
  !!process.env.EMAIL_SERVER && !!process.env.EMAIL_FROM;
const hasGoogleProvider =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

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
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login",
  },
};
