// apps/web/src/components/app-shell/SideNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

type Item = { label: string; href: string; desc?: string };

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
  const { isZh } = useI18n();
  const consoleItems: Item[] = isZh
    ? [
        { label: "Dashboard", href: "/dashboard", desc: "API 健康、成本和准备状态" },
        { label: "Playground", href: "/playground", desc: "测试任务生成和模型调用" },
        { label: "API Keys", href: "/keys", desc: "创建和轮换访问密钥" },
        { label: "Team", href: "/team", desc: "团队角色和权限" },
        { label: "Usage", href: "/usage", desc: "请求、tokens 和花费" },
        { label: "Billing", href: "/billing", desc: "套餐和订阅" },
      ]
    : [
        { label: "Dashboard", href: "/dashboard", desc: "API health, cost, and readiness" },
        { label: "Playground", href: "/playground", desc: "Test task and model calls" },
        { label: "API Keys", href: "/keys", desc: "Create and rotate access" },
        { label: "Team", href: "/team", desc: "Roles and access" },
        { label: "Usage", href: "/usage", desc: "Requests, tokens, spend" },
        { label: "Billing", href: "/billing", desc: "Plan and subscription" },
      ];

  const infrastructureItems: Item[] = isZh
    ? [
        { label: "Models", href: "/models", desc: "Provider 和模型注册表" },
        { label: "Tasks", href: "/tasks", desc: "对外商用 workflow" },
        { label: "Agent OS", href: "/agent-os", desc: "规划、交接和上下文" },
        { label: "Executions", href: "/executions", desc: "Proof 和结果账本" },
        { label: "Docs", href: "/docs", desc: "快速开始和 API 参考" },
      ]
    : [
        { label: "Models", href: "/models", desc: "Provider and model registry" },
        { label: "Tasks", href: "/tasks", desc: "Commercial workflows" },
        { label: "Agent OS", href: "/agent-os", desc: "Plans, handoff, context" },
        { label: "Executions", href: "/executions", desc: "Proof and result ledger" },
        { label: "Docs", href: "/docs", desc: "Quickstart and API reference" },
      ];

  const operatorItems: Item[] = isZh
    ? [
        { label: "Customers", href: "/customers", desc: "登录、密钥和用量" },
        { label: "Sales Leads", href: "/sales-leads", desc: "付费转化线索" },
      ]
    : [
        { label: "Customers", href: "/customers", desc: "Logins, keys, usage" },
        { label: "Sales Leads", href: "/sales-leads", desc: "Upgrade signals" },
      ];

  return (
    <div className="py-2">
      <div className="px-6 py-3 md:hidden">
        <LanguageToggle />
      </div>
      <Group title={isZh ? "控制台" : "Console"} items={consoleItems} onNavigate={onNavigate} />
      <div className="mx-4 my-2 h-px bg-black/10" />
      <Group
        title={isZh ? "基础设施" : "Infrastructure"}
        items={infrastructureItems}
        onNavigate={onNavigate}
      />
      <div className="mx-4 my-2 h-px bg-black/10" />
      <Group
        title={isZh ? "运营" : "Operator"}
        items={operatorItems}
        onNavigate={onNavigate}
      />
      <div className="mx-4 my-2 h-px bg-black/10" />

      <div className="p-3">
        <Link
          href="/login"
          onClick={() => onNavigate?.()}
          className="block rounded-lg bg-black/5 px-3 py-2 text-sm font-medium text-black/70 hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {isZh ? "账户 / 登录" : "Account / Login"}
        </Link>

        <div className="mt-3 rounded-lg border border-black/10 bg-white p-3 text-xs leading-relaxed text-black/55">
          {isZh
            ? "OneAI 负责模型路由和结构化智能，执行交给 OneClaw、bot 或外部系统。"
            : "OneAI handles model routing and structured intelligence. Execution stays with OneClaw, bots, or external systems."}
        </div>
      </div>
    </div>
  );
}
