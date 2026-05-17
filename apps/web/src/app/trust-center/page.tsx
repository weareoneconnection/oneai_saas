"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

const trustAreas = [
  {
    title: "Security",
    desc: "Provider keys stay server-side, customer API keys are stored as hashes, and production access should go through customer backends.",
    href: "/security",
  },
  {
    title: "SLA",
    desc: "Enterprise availability, support response, incident classification, measurement, exclusions, and service-credit boundaries.",
    href: "/legal/sla",
  },
  {
    title: "DPA",
    desc: "Customer data categories, subprocessors, provider routing, deletion/export path, and enterprise data-processing terms.",
    href: "/legal/dpa",
  },
  {
    title: "Privacy",
    desc: "Account data, request data, operational logs, secrets, customer controls, and support requests.",
    href: "/legal/privacy",
  },
  {
    title: "Execution Boundary",
    desc: "OneAI plans, routes, records, approves, and verifies. OneClaw, OpenClaw, bots, customer agents, or humans execute.",
    href: "/docs/reference/agent-os",
  },
  {
    title: "Enterprise Contract",
    desc: "Order form, MSA, DPA, SLA, invoices, support expectations, and enterprise procurement package.",
    href: "/legal/enterprise-contract",
  },
];

const dataFlow = [
  ["Customer backend", "Sends API requests with a OneAI API key. Browser-side secrets are not recommended."],
  ["OneAI API", "Authenticates, applies policy, routes models/tasks, logs metadata, and records usage/cost."],
  ["Model provider", "Processes selected model requests according to the provider and model configuration."],
  ["Agent OS ledger", "Stores handoff contracts, approval state, proof callbacks, result callbacks, and review state."],
  ["Operator console", "Shows customers, keys, usage, failures, audit events, billing state, and execution records."],
];

const controls = [
  ["Key control", "Hashed customer keys, revocation, prefixes, allowed IPs, scopes, rate limits, and budgets."],
  ["Routing control", "Provider/model selection, allowlists, fallback policy, cost guards, and model health checks."],
  ["Cost control", "Token usage, estimated model cost, margin visibility, maxCostUsd, and monthly plan limits."],
  ["Audit control", "Login, key creation, billing changes, failed requests, Agent OS proof/result, and operator review events."],
  ["Execution control", "Approval policy, proof policy, result ledger, and no direct external action inside OneAI."],
  ["Contract control", "SLA, DPA, privacy, invoices, terms, enterprise order forms, and manual sales path."],
];

const enterprisePacket = [
  ["Security overview", "/security"],
  ["SLA overview", "/legal/sla"],
  ["DPA overview", "/legal/dpa"],
  ["Privacy / data handling", "/legal/privacy"],
  ["Execution boundary", "/docs/reference/agent-os"],
  ["Agent OS protocol versioning", "/docs/reference/agent-os/versioning"],
  ["Invoices", "/legal/invoices"],
  ["Enterprise contract pack", "/legal/enterprise-contract"],
  ["Terms", "/legal/terms"],
];

export default function TrustCenterPage() {
  const { isZh } = useI18n();
  const localizedTrustAreas = isZh
    ? [
        { title: "安全", desc: "Provider keys 保持服务端，客户 API keys 以 hash 存储，生产访问应通过客户后端完成。", href: "/security" },
        { title: "SLA", desc: "企业可用性、支持响应、事故分类、度量方式、排除项和服务补偿边界。", href: "/legal/sla" },
        { title: "DPA", desc: "客户数据类别、子处理方、provider 路由、删除/导出路径和企业数据处理条款。", href: "/legal/dpa" },
        { title: "隐私", desc: "账号数据、请求数据、运营日志、密钥、客户控制和支持请求。", href: "/legal/privacy" },
        { title: "执行边界", desc: "OneAI 负责规划、路由、记录、审批和验证。OneClaw、OpenClaw、bot、客户 agent 或人工负责执行。", href: "/docs/reference/agent-os" },
        { title: "企业合同", desc: "订单、MSA、DPA、SLA、发票、支持预期和企业采购材料。", href: "/legal/enterprise-contract" },
      ]
    : trustAreas;
  const localizedDataFlow = isZh
    ? [
        ["客户后端", "使用 OneAI API key 发送 API 请求。不建议在浏览器侧暴露密钥。"],
        ["OneAI API", "完成鉴权、策略、模型/task 路由、元数据日志和用量/成本记录。"],
        ["模型 Provider", "根据所选 provider 和模型配置处理请求。"],
        ["Agent OS Ledger", "保存 handoff 合约、审批状态、proof 回调、result 回调和复核状态。"],
        ["运营控制台", "展示客户、keys、用量、失败、审计事件、支付状态和执行记录。"],
      ]
    : dataFlow;
  const localizedControls = isZh
    ? [
        ["Key 控制", "客户 key hash 存储、撤销、前缀、IP 限制、scopes、rate limits 和预算。"],
        ["路由控制", "Provider/model 选择、allowlists、fallback 策略、成本保护和模型健康检测。"],
        ["成本控制", "Token 用量、预估模型成本、毛利可见性、maxCostUsd 和月度套餐限制。"],
        ["审计控制", "登录、key 创建、支付变化、失败请求、Agent OS proof/result 和运营复核事件。"],
        ["执行控制", "审批策略、proof 策略、结果账本，以及 OneAI 内部不直接执行外部动作。"],
        ["合同控制", "SLA、DPA、隐私、发票、条款、企业订单和人工销售路径。"],
      ]
    : controls;
  const localizedEnterprisePacket = isZh
    ? [
        ["安全概览", "/security"],
        ["SLA 概览", "/legal/sla"],
        ["DPA 概览", "/legal/dpa"],
        ["隐私 / 数据处理", "/legal/privacy"],
        ["执行边界", "/docs/reference/agent-os"],
        ["Agent OS 协议版本", "/docs/reference/agent-os/versioning"],
        ["发票", "/legal/invoices"],
        ["企业合同包", "/legal/enterprise-contract"],
        ["条款", "/legal/terms"],
      ]
    : enterprisePacket;

  return (
    <main className="bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-bold">OneAI API</Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/docs" className="text-black/60 hover:text-black">{isZh ? "文档" : "Docs"}</Link>
            <Link href="/pricing" className="text-black/60 hover:text-black">{isZh ? "价格" : "Pricing"}</Link>
            <Link href="/dashboard" className="text-black/60 hover:text-black">{isZh ? "控制台" : "Console"}</Link>
            <LanguageToggle compact />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">{isZh ? "信任中心" : "Trust Center"}</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {isZh ? "面向模型路由、Task Intelligence 和 Agent OS 的企业级信任体系。" : "Enterprise trust for model routing, Task Intelligence, and Agent OS."}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            {isZh
              ? "购买 AI 网关或智能协调大脑的客户，需要的不只是模型访问。他们需要清晰的数据边界、成本可见性、审计能力、法务文档，以及智能与执行之间的明确分离。"
              : "Customers buying an AI gateway or intelligent coordination brain need more than model access. They need data boundaries, cost visibility, auditability, legal documents, and a clear separation between intelligence and execution."}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {localizedTrustAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="text-base font-bold text-black">{area.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{area.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-black bg-black p-6 text-white">
          <div className="text-sm font-extrabold">{isZh ? "核心信任声明" : "Primary trust statement"}</div>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/70">
            {isZh
              ? "OneAI 不是黑盒 AI 中转站。商业产品设计目标是暴露请求归属、provider/model 路由、用量、预估成本、失败、审计事件和 Agent OS 执行记录，让客户能像运营基础设施一样运营 AI。"
              : "OneAI is not positioned as a blind AI relay. The commercial product is designed to expose request ownership, provider/model routing, usage, estimated cost, failures, audit events, and Agent OS execution records so customers can operate AI as infrastructure."}
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black/[0.02] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-black/45">{isZh ? "企业材料包" : "Enterprise packet"}</div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{isZh ? "可以直接发给采购和法务的材料。" : "Send this package to procurement."}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/60">
                {isZh
                  ? "当企业客户询问 OneAI 如何处理安全、数据、执行边界、发票、法务审核和 Agent OS 协议集成时，可以使用这套信任材料。"
                  : "Use this trust package when an enterprise customer asks how OneAI handles security, data, execution boundaries, invoices, legal review, and Agent OS protocol integration."}
              </p>
            </div>
            <a
              href="mailto:info@weareoneconnection.com?subject=OneAI%20Enterprise%20Trust%20Packet"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-neutral-900"
            >
              {isZh ? "联系企业销售" : "Contact enterprise"}
            </a>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {localizedEnterprisePacket.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-bold text-black transition hover:border-black/25 hover:bg-black/[0.02]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">{isZh ? "数据流概览" : "Data flow overview"}</h2>
          <div className="mt-5 overflow-x-auto rounded-lg border border-black/10">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                <tr>
                  <th className="px-4 py-3">{isZh ? "层级" : "Layer"}</th>
                  <th className="px-4 py-3">{isZh ? "职责" : "Responsibility"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {localizedDataFlow.map(([layer, responsibility]) => (
                  <tr key={layer}>
                    <td className="px-4 py-4 font-bold text-black">{layer}</td>
                    <td className="px-4 py-4 leading-relaxed text-black/65">{responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">{isZh ? "控制清单" : "Control checklist"}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {localizedControls.map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
                <div className="text-sm font-bold text-black">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
