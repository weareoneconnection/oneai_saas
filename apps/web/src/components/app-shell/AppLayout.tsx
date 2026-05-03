// apps/web/src/components/app-shell/AppLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { TopNav } from "./TopNav";
import { SideNav } from "./SideNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f7f7f6] text-[#111]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex h-14 items-center">
            <TopNav onMenuClick={() => setMobileNavOpen(true)} />
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[86vw] max-w-[320px] border-r border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div className="text-sm font-semibold">OneAI Console</div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-black/70 hover:bg-black/5"
                onClick={() => setMobileNavOpen(false)}
              >
                x
              </button>
            </div>

            <div className="h-[calc(100dvh-52px)] overflow-auto p-2">
              <SideNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-12 md:gap-6 md:py-6">
          <aside className="hidden md:col-span-3 md:block lg:col-span-2">
            <div className="sticky top-[80px] rounded-lg border border-black/10 bg-white">
              <div className="max-h-[calc(100dvh-120px)] overflow-auto p-2">
                <SideNav />
              </div>
            </div>
          </aside>

          <main className="min-w-0 md:col-span-9 lg:col-span-10">
            <div className="rounded-lg border border-black/10 bg-white">
              <div className="border-b border-black/5 px-4 py-3 sm:px-5 sm:py-4 md:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold tracking-tight">
                    Developer Console
                  </div>
                  <div className="text-xs text-black/45">
                    Unified model routing API
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
