// apps/web/src/components/app-shell/SideNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string; desc?: string };

const builders: Item[] = [
  { label: "Studio", href: "/studio", desc: "Generate structured outputs" },
  { label: "Templates", href: "/templates", desc: "Reusable blueprints" },
  { label: "Projects", href: "/projects", desc: "Project spaces" },
  { label: "Workflows", href: "/workflows", desc: "Automation chains" },
];

const consoleItems: Item[] = [
  { label: "Dashboard", href: "/dashboard", desc: "Overview & status" },
  { label: "Keys", href: "/keys", desc: "API keys & access" },
  { label: "Usage", href: "/usage", desc: "Usage & cost" },
  { label: "Billing", href: "/billing", desc: "Plans & invoices" },
  { label: "Verify", href: "/verify", desc: "Requests & signatures" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Group({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: Item[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="p-3">
      <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-black/45">
        {title}
      </div>

      <div className="space-y-1">
        {items.map((it) => {
          const active = isActive(pathname, it.href);

          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => onNavigate?.()}
              className={[
                "block rounded-xl px-3 py-2 transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                active
                  ? "bg-black text-white shadow-sm"
                  : "text-black/80 hover:bg-black/5",
              ].join(" ")}
            >
              <div className="text-sm font-medium">{it.label}</div>
              {it.desc ? (
                <div
                  className={[
                    "text-xs",
                    active ? "text-white/70" : "text-black/45",
                  ].join(" ")}
                >
                  {it.desc}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="py-2">
      <Group title="Builders" items={builders} onNavigate={onNavigate} />
      <div className="mx-4 my-2 h-px bg-black/10" />
      <Group title="Console" items={consoleItems} onNavigate={onNavigate} />
      <div className="mx-4 my-2 h-px bg-black/10" />

      <div className="p-3">
        <Link
          href="/login"
          onClick={() => onNavigate?.()}
          className="block rounded-xl bg-black/5 px-3 py-2 text-sm font-medium text-black/70 hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Account / Login
        </Link>

        <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-3 text-xs text-black/55">
          Tip: define project voice once — reuse everywhere.
        </div>
      </div>
    </div>
  );
}