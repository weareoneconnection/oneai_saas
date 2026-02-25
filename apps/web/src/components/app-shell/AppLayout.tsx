// apps/web/src/components/app-shell/AppLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { TopNav } from "./TopNav";
import { SideNav } from "./SideNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Lock body scroll when drawer is open (mobile)
  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  // Close drawer on ESC
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="min-h-dvh bg-[#f5f4f1] text-[#111] overflow-x-hidden">
      {/* Background (clean + premium) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_15%_0%,rgba(16,163,127,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(99,102,241,0.08),transparent_55%),radial-gradient(900px_circle_at_60%_90%,rgba(236,72,153,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.55),rgba(245,244,241,0.85))]" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40">
        <div className="border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-7xl px-3 sm:px-4">
            <div className="flex h-14 items-center">
              <TopNav onMenuClick={() => setMobileNavOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (SideNav) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* overlay */}
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* drawer */}
          <div className="absolute left-0 top-0 h-full w-[86vw] max-w-[320px] bg-white/80 backdrop-blur border-r border-black/10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <div className="text-sm font-semibold">Menu</div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-black/70 hover:bg-black/5"
                onClick={() => setMobileNavOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="h-[calc(100dvh-52px)] overflow-auto p-2">
              <div className="rounded-2xl border border-black/10 bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <div className="p-2">
                  {/* ✅ 点击任意导航自动关闭抽屉 */}
                  <SideNav onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </div>

              <div className="mt-3 text-xs text-black/45">
                <div className="rounded-xl border border-black/10 bg-white/50 px-3 py-2">
                  Tip: Use <span className="font-medium text-black/70">⌘K</span>{" "}
                  for quick actions.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main shell */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-4 md:py-6">
          {/* Sidebar: desktop only */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-2">
            <div className="sticky top-[80px]">
              <div className="rounded-2xl border border-black/10 bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur">
                <div className="max-h-[calc(100dvh-120px)] overflow-auto p-2">
                  <SideNav />
                </div>
              </div>

              <div className="mt-3 hidden text-xs text-black/45 md:block">
                <div className="rounded-xl border border-black/10 bg-white/50 px-3 py-2">
                  Tip: Use <span className="font-medium text-black/70">⌘K</span>{" "}
                  for quick actions.
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 md:col-span-9 lg:col-span-10">
            <div className="rounded-2xl border border-black/10 bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur">
              <div className="border-b border-black/5 px-4 py-3 sm:px-5 sm:py-4 md:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold tracking-tight">
                    Workspace
                  </div>
                  <div className="text-xs text-black/45">
                    OneAI OS · Unified tools
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 md:p-6">{children}</div>
            </div>

            <div className="h-6 md:h-8" />
          </main>
        </div>
      </div>
    </div>
  );
}