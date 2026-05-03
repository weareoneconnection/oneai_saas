import React from "react";
import AppLayout from "@/components/app-shell/AppLayout";
import SessionProvider from "@/components/auth/SessionProvider";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // ⬅️ 你项目里 authOptions 的真实路径

export const dynamic = "force-dynamic";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions).catch((err) => {
    console.error("Failed to load auth session:", err);
    return null;
  });

  return (
    <SessionProvider session={session}>
      <AppLayout>{children}</AppLayout>
    </SessionProvider>
  );
}
