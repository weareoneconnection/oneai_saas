// apps/web/src/components/app-shell/SideNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string; desc?: string };

const consoleItems: Item[] = [
  { label: "Dashboard", href: "/dashboard", desc: "API health and cost · API 健康和成本" },
  { label: "Playground", href: "/playground", desc: "Test generate calls · 测试生成和模型调用" },
  { label: "API Keys", href: "/keys", desc: "Create and rotate access · 创建和轮换访问密钥" },
  { label: "Usage", href: "/usage", desc: "Requests, tokens, spend · 请求、tokens、花费" },
  { label: "Billing", href: "/billing", desc: "Plan and subscription · 套餐和订阅" },
];

const infrastructureItems: Item[] = [
  { label: "Models", href: "/models", desc: "Provider registry · Provider 和模型注册表" },
  { label: "Tasks", href: "/tasks", desc: "Commercial workflows · 对外商用 workflow" },
  { label: "Docs", href: "/docs", desc: "Quickstart and reference · 快速开始和 API 参考" },
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
      <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-black/45">
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
                "block rounded-lg px-3 py-2 transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                active
                  ? "bg-black text-white"
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
      <Group title="Console 控制台" items={consoleItems} onNavigate={onNavigate} />
      <div className="mx-4 my-2 h-px bg-black/10" />
      <Group
        title="Infrastructure 基础设施"
        items={infrastructureItems}
        onNavigate={onNavigate}
      />
      <div className="mx-4 my-2 h-px bg-black/10" />

      <div className="p-3">
        <Link
          href="/login"
          onClick={() => onNavigate?.()}
          className="block rounded-lg bg-black/5 px-3 py-2 text-sm font-medium text-black/70 hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Account / Login
        </Link>

        <div className="mt-3 rounded-lg border border-black/10 bg-white p-3 text-xs leading-relaxed text-black/55">
          OneAI handles model routing and structured intelligence. Execution
          stays with OneClaw and bots. OneAI 负责智能，外部系统负责执行。
        </div>
      </div>
    </div>
  );
}
