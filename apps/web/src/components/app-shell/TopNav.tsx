// apps/web/src/components/app-shell/TopNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={[
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        active
          ? "bg-black text-white"
          : "text-black/70 hover:bg-black/5 hover:text-black",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data } = useSession();
  const { isZh } = useI18n();
  const email = data?.user?.email;
  const nav = isZh
    ? {
        menu: "打开菜单",
        homeLabel: "返回 OneAI 首页",
        homeTitle: "返回首页",
        subtitle: email ? `首页 · ${email}` : "首页 · 商业智能控制台",
        test: "测试",
      }
    : {
        menu: "Open menu",
        homeLabel: "Back to OneAI home",
        homeTitle: "Back to home",
        subtitle: email ? `Home · ${email}` : "Home · Commercial intelligence console",
        test: "Test",
      };

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={nav.menu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white hover:bg-black/5 md:hidden"
        >
          <span className="text-base leading-none">☰</span>
        </button>

        <Link
          href="/"
          aria-label={nav.homeLabel}
          title={nav.homeTitle}
          className="flex min-w-0 items-center gap-3 rounded-xl transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white">
            <span className="text-sm font-semibold">OA</span>
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">OneAI API</div>
            <div className="truncate text-xs text-black/50">{nav.subtitle}</div>
          </div>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/playground">Playground</NavLink>
          <NavLink href="/models">Models</NavLink>
          <NavLink href="/tasks">Tasks</NavLink>
          <NavLink href="/executions">Executions</NavLink>
          <NavLink href="/keys">Keys</NavLink>
          <NavLink href="/team">Team</NavLink>
          <NavLink href="/usage">Usage</NavLink>
          <NavLink href="/billing">Billing</NavLink>
          <NavLink href="/sales-leads">Leads</NavLink>
        </div>

        <div className="mx-2 hidden h-6 w-px bg-black/10 md:block" />

        <div className="hidden items-center md:flex">
          <LanguageToggle compact />
        </div>

        <div className="mx-2 hidden h-6 w-px bg-black/10 md:block" />

        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/docs">Docs</NavLink>
        </div>

        <div className="md:hidden">
          <NavLink href="/playground">{nav.test}</NavLink>
        </div>
      </div>
    </div>
  );
}
