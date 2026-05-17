"use client";

// apps/web/src/app/docs/page.tsx
import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export default function DocsHomePage() {
  const { isZh } = useI18n();
  const c = (en: string, zh: string) => (isZh ? zh : en);
  const quick = [
    { title: c("Product Guide", "产品使用说明"), desc: c("Positioning, API surfaces, task list, cost controls, and commercial usage.", "中文版产品定位、API 能力、任务列表、成本控制和商业使用方式。"), href: "/docs/product-guide" },
    { title: "Trust Center", desc: c("Security, SLA, DPA, privacy, execution boundary, and enterprise trust controls.", "安全、SLA、DPA、隐私、执行边界和企业信任控制。"), href: "/trust-center" },
    { title: c("Use Cases", "使用场景"), desc: c("Customer-facing scenarios for strategy, content, support, market intelligence, and custom tasks.", "面向客户的 strategy、content、support、market intelligence 和 custom task 场景。"), href: "/use-cases" },
    { title: c("Production Checklist", "生产上线检查清单"), desc: c("Security, cost controls, idempotency, usage, and launch verification.", "安全、成本控制、幂等、用量和上线验证。"), href: "/docs/guides/production-checklist" },
    { title: c("Task Examples", "Task 示例"), desc: c("Copyable request and output examples for commercial tasks.", "可复制的商用 task 请求和输出示例。"), href: "/docs/examples" },
    { title: "Agent OS Preview", desc: c("Capabilities, agent plans, handoff preview, and context preview without execution.", "Capabilities、agent plans、handoff preview 和 context preview，不由 OneAI 执行外部动作。"), href: "/docs/reference/agent-os" },
    { title: "Agent OS Versioning", desc: c("Protocol versions, compatibility rules, executor checklist, and OneClaw/OpenClaw expectations.", "协议版本、兼容规则、执行器检查清单和 OneClaw/OpenClaw 接入要求。"), href: "/docs/reference/agent-os/versioning" },
    { title: "Quickstart", desc: c("Make the first /v1/generate call.", "完成第一次 /v1/generate 调用。"), href: "/docs/quickstart" },
    { title: c("API Basics", "API 基础"), desc: c("Auth, request shape, response metadata.", "鉴权、请求结构和响应 metadata。"), href: "/docs/api" },
    { title: c("Generate Reference", "Generate 参考"), desc: c("Task input, options, usage, trace.", "Task input、options、usage 和 trace。"), href: "/docs/reference/generate" },
    { title: "Chat Completions", desc: c("OpenAI-compatible model gateway calls.", "OpenAI-compatible 模型网关调用。"), href: "/docs/reference/chat" },
    { title: "Messages", desc: c("Anthropic-style Messages API through OneAI model routing.", "通过 OneAI 模型路由使用 Anthropic-style Messages API。"), href: "/docs/reference/messages" },
    { title: "Models", desc: c("Catalog, health checks, pricing coverage.", "模型目录、健康检查和价格覆盖。"), href: "/docs/reference/models" },
    { title: "SLA", desc: c("Enterprise service-level expectations and support boundary.", "企业服务等级预期和支持边界。"), href: "/legal/sla" },
    { title: "DPA", desc: c("Customer data processing, provider routing, and deletion/export path.", "客户数据处理、provider 路由和删除/导出路径。"), href: "/legal/dpa" },
    { title: c("Invoices", "发票"), desc: c("Stripe portal, manual invoices, billing evidence, and plan changes.", "Stripe portal、人工发票、账单凭证和套餐变化。"), href: "/legal/invoices" },
    { title: c("Enterprise Contract", "企业合同"), desc: c("Order form, MSA, DPA, SLA, billing, and support contract pack.", "Order form、MSA、DPA、SLA、账单和支持合同包。"), href: "/legal/enterprise-contract" },
    { title: c("Terms", "服务条款"), desc: c("Service boundary, acceptable use, API key responsibility, and plan limits.", "服务边界、可接受使用、API key 责任和套餐限制。"), href: "/legal/terms" },
    { title: c("Privacy", "隐私"), desc: c("Account data, request data, secrets, logs, and customer requests.", "账户数据、请求数据、密钥、日志和客户请求。"), href: "/legal/privacy" },
    { title: "Errors", desc: c("Retryable failures and customer-safe errors.", "可重试失败和客户安全错误。"), href: "/docs/reference/errors" },
    { title: c("Rate Limits", "限流"), desc: c("API key policy and production limits.", "API key 策略和生产限制。"), href: "/docs/reference/rate-limits" },
    { title: "Schemas", desc: c("Structured output contracts.", "结构化输出 contract。"), href: "/docs/reference/schemas" },
  ];

  return (
    <main className="bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-bold">
            OneAI API
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/pricing" className="text-black/60 hover:text-black">
              {c("Pricing", "价格")}
            </Link>
            <Link href="/security" className="text-black/60 hover:text-black">
              {c("Security", "安全")}
            </Link>
            <Link href="/dashboard" className="text-black/60 hover:text-black">
              {c("Console", "控制台")}
            </Link>
            <LanguageToggle compact />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            {c("Documentation", "文档")}
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {c("Build on the OneAI commercial API.", "基于 OneAI 商业 API 构建。")}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            {c(
              "OneAI is the model-routing and structured-intelligence layer. Use /v1/generate for task intelligence, /v1/chat/completions for OpenAI-compatible gateway calls, /v1/messages for Messages-style gateway calls, and /v1/models for catalog discovery.",
              "OneAI 是模型路由和结构化智能层。使用 /v1/generate 调用 Task Intelligence，使用 /v1/chat/completions 调用 OpenAI-compatible 网关，使用 /v1/messages 调用 Messages-style 网关，使用 /v1/models 查询模型目录。"
            )}
          </p>
          {isZh ? (
            <p className="mt-3 text-base leading-relaxed text-black/65">
              中文用户可以先阅读产品使用说明，了解 OneAI 如何作为统一全模型调用、
              成本控制和 Task Intelligence 的 AI 智能大脑基础设施。
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {quick.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-black/10 p-5 hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-sm font-bold">{item.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-[#0f1115] p-5 text-white">
          <div className="text-sm font-semibold">{c("Production request", "生产请求示例")}</div>
          <pre className="mt-4 overflow-auto text-xs leading-relaxed text-white/75">
            <code>{`curl https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ONEAI_API_KEY" \\
  -H "Idempotency-Key: business-strategy-001" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Create a launch plan for OneAI API",
      "audience": "SaaS builders",
      "constraints": ["Keep it practical"]
    },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.03 } }
  }'`}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}
