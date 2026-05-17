"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { DocShell, DocSectionTitle } from "../_components/DocShell";

export default function Page() {
  const { isZh } = useI18n();
  const c = {
    title: isZh ? "快速开始" : "Quickstart",
    description: isZh
      ? "创建 key，运行一次免费的 Task Intelligence 请求，查看用量，然后在生产流量需要付费 workflow 时升级。"
      : "Create a key, run a free Task Intelligence request, check usage, then upgrade when production traffic needs paid workflows.",
    pills: isZh
      ? ["免费 task 测试", "POST /v1/generate", "用量 + 成本控制"]
      : ["Free task test", "POST /v1/generate", "Usage + cost controls"],
    docsHome: isZh ? "文档首页" : "Docs Home",
    apiBasics: isZh ? "API 基础" : "API Basics",
    createKeyTitle: isZh ? "1. 创建服务端 API key" : "1. Create a server-side API key",
    createKeyDesc: isZh
      ? "在 Console 创建 key。请把 key 放在服务端，并通过 x-api-key 传入。"
      : "Create a key in Console. Keep it on your server and pass it via x-api-key.",
    getKey: isZh ? "获取 API key" : "Get API key",
    generateRef: isZh ? "Generate 参考" : "Generate reference",
    chatRef: isZh ? "Chat 参考" : "Chat reference",
    readTitle: isZh ? "2. 读取响应" : "2. Read the response",
    readDesc: isZh
      ? "API 会返回结构化数据，并包含 requestId、用量、成本；开启 debug 后还会返回 trace metadata。"
      : "The API returns structured data plus requestId, usage, cost, and trace metadata when debug is enabled.",
    success: isZh ? "成功响应" : "Success",
    failure: isZh ? "失败响应" : "Failure",
    usageTitle: isZh ? "3. 扩大流量前检查用量" : "3. Check usage before scaling",
    usageDesc: isZh
      ? "第一次请求后，在 Usage 中确认请求数、tokens、模型成本、延迟和失败情况。"
      : "After the first request, confirm requests, tokens, model cost, latency, and failures in Usage.",
    cards: isZh
      ? [
          ["Keys", "创建、轮换、撤销 API keys，并设置预算。", "/keys"],
          ["Playground", "测试免费和付费 Task Intelligence 示例。", "/playground"],
          ["Usage", "追踪请求量、tokens、成本、延迟和失败。", "/usage"],
        ]
      : [
          ["Keys", "Create, rotate, revoke, and budget API keys.", "/keys"],
          ["Playground", "Test free and paid Task Intelligence examples.", "/playground"],
          ["Usage", "Track request volume, tokens, cost, latency, and failures.", "/usage"],
        ],
    gatewayTitle: isZh ? "4. 使用模型网关" : "4. Use the model gateway",
    gatewayDesc: isZh
      ? "如果要兼容 OpenAI 格式集成，请使用 Authorization: Bearer 调用 /v1/chat/completions。"
      : "For OpenAI-compatible integrations, call /v1/chat/completions with Authorization: Bearer.",
    upgradeTitle: isZh ? "真实场景跑通后再升级" : "Upgrade when the use case is real",
    upgradeDesc: isZh
      ? "Free 适合验证。Pro 解锁客户支持、市场、决策和活动智能。Team 解锁定制 task 合约、debug trace、模型控制和更高运营额度。"
      : "Free is for validation. Pro unlocks customer-facing support, market, decision, and campaign intelligence. Team unlocks custom task contracts, debug traces, model controls, and higher operating limits.",
    comparePlans: isZh ? "比较套餐" : "Compare plans",
    productionChecklist: isZh ? "生产检查清单" : "Production checklist",
  };

  return (
    <DocShell
      title={c.title}
      description={c.description}
      pills={c.pills}
      prev={{ href: "/docs", label: c.docsHome }}
      next={{ href: "/docs/api", label: c.apiBasics }}
    >
      <DocSectionTitle
        title={c.createKeyTitle}
        desc={c.createKeyDesc}
      />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-black/80">{`curl -X POST https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Idempotency-Key: first-free-test-001" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Validate OneAI API for my product",
      "audience": "SaaS builders",
      "constraints": ["Keep it practical", "Keep it short"]
    },
    "options": { "llm": { "mode": "cheap", "maxCostUsd": 0.03 } }
  }'`}</pre>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/keys" className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-white hover:bg-neutral-900">
            {c.getKey} →
          </Link>
          <Link href="/docs/reference/generate" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            {c.generateRef} →
          </Link>
          <Link href="/docs/reference/chat" className="rounded-lg border border-black/15 bg-white px-5 py-2 text-sm font-bold hover:bg-black/[0.04]">
            {c.chatRef} →
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title={c.readTitle}
          desc={c.readDesc}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-extrabold text-black">{c.success}</div>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-black/80">{`{
  "success": true,
  "requestId": "req_...",
  "data": { ...schema-valid output... },
  "usage": { "provider": "openai", "model": "gpt-4o-mini" },
  "attempts": 1
}`}</pre>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-extrabold text-black">{c.failure}</div>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-black/80">{`{
  "success": false,
  "error": "Failed to produce valid structured output",
  "details": { "code":"VALIDATION_FAILED", "issues":[...] }
}`}</pre>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title={c.usageTitle}
          desc={c.usageDesc}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {c.cards.map(([title, desc, href]) => (
            <Link key={title} href={href} className="rounded-lg border border-black/10 bg-black/[0.02] p-5 hover:bg-black/[0.04]">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <DocSectionTitle
          title={c.gatewayTitle}
          desc={c.gatewayDesc}
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-black/80">{`curl -s https://oneai-saas-api-production.up.railway.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{
    "model": "openai:gpt-5.2",
    "messages": [
      { "role": "user", "content": "Explain OneAI SaaS in one sentence." }
    ],
    "max_completion_tokens": 300
  }'`}</pre>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
        <div className="text-lg font-extrabold">{c.upgradeTitle}</div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          {c.upgradeDesc}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90">
            {c.comparePlans}
          </Link>
          <Link href="/docs/guides/production-checklist" className="rounded-lg border border-white/15 px-5 py-2 text-sm font-bold text-white hover:bg-white/10">
            {c.productionChecklist}
          </Link>
        </div>
      </div>
    </DocShell>
  );
}
