// apps/web/src/app/security/page.tsx
"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

function Item({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="text-sm font-bold text-black">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-black/65">{desc}</div>
    </div>
  );
}

const riskRows = [
  ["Hidden model routing", "OneAI returns provider, model, requestId, usage, latency, fallback state, and estimated cost."],
  ["Cost drift", "Plans, maxCostUsd, rate limits, monthly request limits, and usage dashboards keep spend visible."],
  ["Leaked keys", "Customer API keys are created once, stored hashed, and can be revoked without exposing upstream provider secrets."],
  ["Unsafe execution", "OneAI generates intelligence and plans. Execution belongs to OneClaw, bots, customer tools, or human operators."],
];

const trustPillars = [
  ["Security", "Provider secrets stay server-side, customer keys are hashed, and production access should happen through customer backends."],
  ["Transparency", "Every commercial call is designed to expose requestId, provider, model, tokens, latency, cost, fallback, and ownership context."],
  ["Data boundary", "OneAI coordinates intelligence and records operational metadata. External executors perform actions outside the OneAI boundary."],
  ["Enterprise readiness", "SLA, DPA, Privacy, invoices, terms, audit logs, and team permissions are documented for procurement review."],
];

const commitments = [
  ["Provider keys stay server-side", "Customer-facing API keys never expose OpenAI, DeepSeek, OpenRouter, or other upstream provider secrets."],
  ["No blind relay positioning", "Every production response is designed to include ownership metadata: requestId, provider, model, usage, latency, cost, and fallback state where available."],
  ["No execution inside OneAI", "OneAI plans, coordinates, records, and verifies. External systems such as OneClaw, OpenClaw, bots, tools, or humans execute actions."],
  ["Customer keys are hashed", "OneAI stores customer API key hashes, not plaintext keys. Plaintext keys are shown once at creation."],
  ["Usage is auditable", "Requests, failed requests, API key events, billing events, and Agent OS execution records are logged for operational review."],
  ["Proof can be reviewed", "Agent OS proof can be marked verified, needs_review, or rejected by an operator before being trusted as completed evidence."],
];

const dataControls = [
  ["Payload storage", "Request input/output can be logged for debugging and support where enabled by product policy."],
  ["Deletion path", "Customer data deletion can be handled by operator request while self-serve deletion controls are expanded."],
  ["Training boundary", "OneAI does not position customer API traffic as training data for OneAI-owned models. Upstream provider handling depends on the provider selected and its terms."],
  ["Retention", "Operational logs are retained for billing, abuse prevention, debugging, and customer support until a formal retention window is configured."],
];

const executionBoundaryRows = [
  ["OneAI may do", "Plan, route, generate structured intelligence, create handoff contracts, record approvals, store proof/result metadata, and expose audit trails."],
  ["OneAI will not do", "Click buttons, log into customer tools, spend funds, post to social accounts, deploy code, move assets, or call external execution systems as the actor."],
  ["Executors do", "OneClaw, OpenClaw, bots, customer agents, or humans perform external actions and call back with proof and results."],
  ["Operators verify", "Admins review proof, failures, customer usage, cost, and audit events before trusting an execution as complete."],
];

export default function SecurityPage() {
  const { isZh } = useI18n();
  const localizedRiskRows = isZh
    ? [
        ["隐藏模型路由", "OneAI 返回 provider、model、requestId、usage、latency、fallback 状态和预估成本。"],
        ["成本漂移", "套餐、maxCostUsd、rate limits、月度请求限制和用量面板让花费保持可见。"],
        ["Key 泄露", "客户 API keys 只在创建时展示一次，以 hash 存储，可撤销且不会暴露上游 provider 密钥。"],
        ["不安全执行", "OneAI 生成智能和计划。执行属于 OneClaw、bot、客户工具或人工操作员。"],
      ]
    : riskRows;
  const localizedTrustPillars = isZh
    ? [
        ["安全", "Provider secrets 保持服务端，客户 keys 以 hash 存储，生产访问应通过客户后端。"],
        ["透明", "每次商业调用都设计为暴露 requestId、provider、model、tokens、latency、cost、fallback 和归属上下文。"],
        ["数据边界", "OneAI 协调智能并记录运营元数据。外部执行器在 OneAI 边界外执行动作。"],
        ["企业就绪", "SLA、DPA、隐私、发票、条款、审计日志和团队权限用于采购审核。"],
      ]
    : trustPillars;
  const localizedCommitments = isZh
    ? [
        ["Provider keys 保持服务端", "客户侧 API keys 不会暴露 OpenAI、DeepSeek、OpenRouter 或其他上游 provider secrets。"],
        ["不是黑盒中转站", "生产响应设计为尽可能包含 requestId、provider、model、usage、latency、cost 和 fallback 状态。"],
        ["OneAI 内部不执行外部动作", "OneAI 规划、协调、记录和验证。OneClaw、OpenClaw、bot、工具或人工执行动作。"],
        ["客户 keys hash 存储", "OneAI 存储客户 API key hash，不存明文。明文 key 只在创建时展示一次。"],
        ["用量可审计", "请求、失败请求、API key 事件、支付事件和 Agent OS 执行记录都会被记录用于运营复核。"],
        ["Proof 可复核", "Agent OS proof 可以被运营方标记为 verified、needs_review 或 rejected，再作为完成证据。"],
      ]
    : commitments;
  const localizedDataControls = isZh
    ? [
        ["Payload 存储", "在产品策略允许时，请求输入/输出可用于调试和支持。"],
        ["删除路径", "客户数据删除可通过运营方请求处理，同时继续扩展自助删除控制。"],
        ["训练边界", "OneAI 不把客户 API 流量定位为 OneAI 自有模型训练数据。上游 provider 的处理取决于所选 provider 条款。"],
        ["保留策略", "运营日志用于计费、滥用防护、调试和客户支持，直到正式保留窗口配置完成。"],
      ]
    : dataControls;
  const localizedExecutionBoundaryRows = isZh
    ? [
        ["OneAI 可以做", "规划、路由、生成结构化智能、创建 handoff 合约、记录审批、存储 proof/result 元数据并暴露审计轨迹。"],
        ["OneAI 不会做", "点击按钮、登录客户工具、花费资金、发布社交内容、部署代码、移动资产或作为执行主体调用外部系统。"],
        ["执行器负责", "OneClaw、OpenClaw、bot、客户 agent 或人工执行外部动作，并回传 proof 和 result。"],
        ["运营方验证", "管理员在信任执行完成前复核 proof、失败、客户用量、成本和审计事件。"],
      ]
    : executionBoundaryRows;

  return (
    <main className="bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-bold">
            OneAI API
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/docs" className="text-black/60 hover:text-black">
              {isZh ? "文档" : "Docs"}
            </Link>
            <Link href="/trust-center" className="text-black/60 hover:text-black">
              {isZh ? "信任中心" : "Trust Center"}
            </Link>
            <Link href="/pricing" className="text-black/60 hover:text-black">
              {isZh ? "价格" : "Pricing"}
            </Link>
            <Link href="/dashboard" className="text-black/60 hover:text-black">
              {isZh ? "控制台" : "Console"}
            </Link>
            <LanguageToggle compact />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            {isZh ? "信任中心" : "Trust Center"}
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {isZh ? "商业 AI 基础设施的信任控制。" : "Trust controls for commercial AI infrastructure."}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/65">
            {isZh
              ? "OneAI 面向需要销售、监控和治理 AI 功能的团队。系统把 provider access 保持在服务端，暴露请求级用量和成本，并将智能与执行分离。"
              : "OneAI is designed for teams that need to sell, monitor, and govern AI features. The system keeps provider access server-side, exposes request-level usage and cost, and separates intelligence from execution."}
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-black bg-black p-6 text-white">
          <div className="text-sm font-extrabold">{isZh ? "核心原则" : "Core principle"}</div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
            {isZh
              ? "OneAI 不应像黑盒中转站。每次生产调用都应能通过 requestId、provider、model、token usage、预估成本、路由策略和客户/API key 归属解释清楚。"
              : "OneAI should not behave like a blind relay. Every production call should be explainable by requestId, provider, model, token usage, estimated cost, route policy, and customer/API key ownership."}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {localizedTrustPillars.map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Item
            title={isZh ? "API key 安全习惯" : "API key hygiene"}
            desc={isZh ? "Keys 在 API 侧以 hash 存储。建议按环境创建不同 keys，泄露后立即撤销。" : "Keys are stored hashed on the API side. Create separate keys per environment and revoke leaked keys immediately."}
          />
          <Item
            title={isZh ? "用量和成本控制" : "Usage and cost controls"}
            desc={isZh ? "追踪 provider、model、token usage、预估成本、latency 和 requestId，支持客户排查。" : "Track provider, model, token usage, estimated cost, latency, and requestId for customer support."}
          />
          <Item
            title={isZh ? "Provider 策略" : "Provider policy"}
            desc={isZh ? "使用 provider/model allowlists、routing modes、fallbacks 和 maxCostUsd 控制生产调用。" : "Use provider/model allowlists, routing modes, fallbacks, and maxCostUsd to keep production calls controlled."}
          />
          <Item
            title={isZh ? "模型就绪度" : "Model readiness"}
            desc={isZh ? "模型注册表、目录同步、价格覆盖和单模型健康检测帮助运营方在客户流量前验证 provider。" : "Model registry, catalog sync, pricing coverage, and one-model-at-a-time health checks help operators verify providers before customer traffic."}
          />
          <Item
            title={isZh ? "请求可观测性" : "Request observability"}
            desc={isZh ? "每次商业调用都能关联到 requestId、provider、model、usage、latency、error state 和 API key。" : "Every commercial call can be tied back to requestId, provider, model, usage, latency, error state, and API key."}
          />
          <Item
            title={isZh ? "执行边界" : "Execution boundary"}
            desc={isZh ? "OneAI 返回计划、结构化决策和协调输出。直接执行保留在 OneAI API 边界之外。" : "OneAI returns plans, structured decisions, and coordination outputs. Direct execution stays outside the OneAI API boundary."}
          />
        </div>

        <div className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">{isZh ? "OneAI 旨在降低的 AI 中转风险" : "AI relay risks OneAI is built to reduce"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {isZh
                ? "客户最关心的不只是模型有没有响应，而是路由、花费、数据边界和运营归属是否足够可见，能否在生产中被信任。"
                : "The main customer concern is not only whether a model responds. It is whether routing, spend, data boundaries, and operational ownership are visible enough to trust in production."}
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                <tr>
                  <th className="px-4 py-3">{isZh ? "风险" : "Risk"}</th>
                  <th className="px-4 py-3">{isZh ? "OneAI 控制" : "OneAI control"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {localizedRiskRows.map(([risk, control]) => (
                  <tr key={risk}>
                    <td className="px-4 py-4 font-bold text-black">{risk}</td>
                    <td className="px-4 py-4 leading-relaxed text-black/65">{control}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">{isZh ? "信任承诺" : "Trust commitments"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {isZh
                ? "客户在把生产 AI 流量接入模型网关或 Task Intelligence API 前，应能期待这些运营控制。"
                : "These are the operational controls a customer should expect before running production AI traffic through a model gateway or Task Intelligence API."}
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {localizedCommitments.map(([title, desc]) => (
              <Item key={title} title={title} desc={desc} />
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-white p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            {isZh ? "数据处理" : "Data handling"}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            {isZh ? "客户数据与 provider 路由的清晰边界。" : "Clear boundaries for customer data and provider routing."}
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {localizedDataControls.map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                <div className="text-sm font-bold text-black">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">{isZh ? "执行边界" : "Execution Boundary"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {isZh
                ? "OneAI 是智能协调大脑。执行被有意保留在 OneAI 外部，让客户保留审批、责任归属和运营控制。"
                : "OneAI is the intelligent coordination brain. Execution remains intentionally outside OneAI so customers can preserve approval, accountability, and operational control."}
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
            <table className="min-w-[780px] w-full text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/45">
                <tr>
                  <th className="px-4 py-3">{isZh ? "边界" : "Boundary"}</th>
                  <th className="px-4 py-3">{isZh ? "含义" : "Meaning"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {localizedExecutionBoundaryRows.map(([title, desc]) => (
                  <tr key={title}>
                    <td className="px-4 py-4 font-bold text-black">{title}</td>
                    <td className="px-4 py-4 leading-relaxed text-black/65">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-black p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-wide text-white/45">
            {isZh ? "企业文档" : "Enterprise documents"}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            {isZh ? "采购就绪的信任材料包。" : "Procurement-ready trust package."}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
            {isZh
              ? "评估 OneAI 生产使用的客户，可以先查看服务边界、SLA 概览、DPA 概览、发票路径、条款和隐私/数据处理说明，再进入企业合同流程。"
              : "Customers evaluating OneAI for production can review the service boundary, SLA overview, DPA overview, invoice path, terms, and privacy/data handling notes before moving into an enterprise contract."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Contract", "/legal/enterprise-contract"],
              ["SLA", "/legal/sla"],
              ["DPA", "/legal/dpa"],
              ["Invoices", "/legal/invoices"],
              ["Terms", "/legal/terms"],
              ["Privacy", "/legal/privacy"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-6">
            <div className="text-sm font-bold">{isZh ? "运营建议" : "Operational recommendation"}</div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {isZh
                ? "保持 secrets 在服务端，通过你的后端转发请求，为重试设置 idempotency keys，并在提高客户限制前每日监控用量。"
                : "Keep secrets server-side, pass requests through your backend, set idempotency keys for retries, and monitor usage daily before increasing customer limits."}
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-6">
            <div className="text-sm font-bold">{isZh ? "生产清单" : "Production checklist"}</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black/60">
              <li>{isZh ? "区分生产和开发 API keys" : "Separate prod and dev API keys"}</li>
              <li>{isZh ? "设置月度预算和 maxCostUsd" : "Set monthly budgets and maxCostUsd"}</li>
              <li>{isZh ? "付费流量前启用 Stripe billing" : "Enable Stripe billing before paid traffic"}</li>
              <li>{isZh ? "查看 Usage 中的错误和成本尖峰" : "Review Usage for errors and cost spikes"}</li>
              <li>{isZh ? "新 provider 暴露给客户前先做健康检测" : "Health-check new providers before exposing them"}</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
