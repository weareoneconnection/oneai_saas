"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function isConsoleAccessNotice(message?: string | null) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("unauthorized") ||
    text.includes("sign in") ||
    text.includes("missing api key") ||
    text.includes("invalid api key") ||
    text.includes("forbidden")
  );
}

export function SignInRequired({ message }: { message?: string | null }) {
  const { isZh } = useI18n();
  const text = String(message || "");
  const isForbidden = text.toLowerCase().includes("forbidden");

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="text-sm font-black">
        {isForbidden
          ? isZh
            ? "需要运营方权限"
            : "Operator access required"
          : isZh
            ? "请先登录"
            : "Sign in required"}
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-900/80">
        {isForbidden
          ? isZh
            ? "这个页面包含运营数据，仅限 OneAI 项目方或授权管理员访问。请确认当前登录邮箱在运营方白名单中。"
            : "This page contains operator data and is limited to OneAI project owners or authorized admins. Confirm the signed-in email is on the operator allowlist."
          : isZh
            ? "这个页面需要先用 Google 邮箱或 Console Password 登录。登录后即可查看你的 keys、usage、team、billing 和运营数据。"
            : "This page requires Google or Console Password sign-in first. After signing in, you can view keys, usage, team, billing, and operator data."}
      </p>
      {text ? <div className="mt-2 text-xs text-amber-800/70">{text}</div> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/login"
          className="inline-flex h-9 items-center rounded-lg bg-black px-4 text-sm font-bold text-white hover:bg-neutral-900"
        >
          {isZh ? "去登录" : "Sign in"}
        </Link>
        <Link
          href="/docs/quickstart"
          className="inline-flex h-9 items-center rounded-lg border border-amber-300 bg-white/60 px-4 text-sm font-bold text-amber-950 hover:bg-white"
        >
          {isZh ? "查看快速开始" : "Open quickstart"}
        </Link>
      </div>
    </div>
  );
}
