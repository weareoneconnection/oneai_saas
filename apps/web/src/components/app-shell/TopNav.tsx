// apps/web/src/components/app-shell/TopNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        active
          ? "bg-black text-white shadow-sm"
          : "text-black/70 hover:bg-black/5 hover:text-black",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="hidden items-center rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-black/60 backdrop-blur md:inline-flex">
      {children}
    </span>
  );
}

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data } = useSession();
  const email = data?.user?.email;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/70 shadow-sm hover:bg-black/5"
        >
          <span className="text-base leading-none">☰</span>
        </button>

        <Link href="/studio" className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm">
            <span className="text-sm font-semibold">OA</span>
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold truncate">OneAI OS</div>
            <div className="text-xs text-black/50 truncate">
              Intelligence for structured contribution
            </div>
            <div className="text-xs text-black/60 truncate">
              {email || "Not signed in"}
            </div>
          </div>
        </Link>

        <div className="ml-2 hidden h-6 w-px bg-black/10 md:block" />
        <Pill>⌘K Quick Start</Pill>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Desktop-only nav (avoid mobile overflow) */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/studio">Studio</NavLink>
          <NavLink href="/templates">Templates</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/workflows">Workflows</NavLink>
        </div>

        <div className="mx-2 hidden h-6 w-px bg-black/10 md:block" />

        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/keys">Keys</NavLink>
          <NavLink href="/usage">Usage</NavLink>
          <NavLink href="/billing">Billing</NavLink>
          <NavLink href="/verify">Verify</NavLink>
        </div>

        {/* Mobile quick entry */}
        <div className="md:hidden">
          <NavLink href="/studio">Studio</NavLink>
        </div>
      </div>
    </div>
  );
}