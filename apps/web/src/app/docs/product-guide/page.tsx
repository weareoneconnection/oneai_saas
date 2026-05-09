import Link from "next/link";
import { DocShell, DocSectionTitle } from "../_components/DocShell";

const tasks = [
  ["business_strategy", "商业策略规划", "把业务目标转化为策略、里程碑、风险、下一步行动和成功指标。"],
  ["content_engine", "内容生成引擎", "生成 hooks、社交媒体内容、CTA、话题标签和发布变体。"],
  ["campaign_mission", "营销活动任务设计", "设计活动任务、证明方式、审核规则、奖励结构、增长循环和风险控制。"],
  ["support_brain", "客服与社区回复大脑", "生成客户回复、意图识别、置信度、建议动作和上下文更新。"],
  ["market_research", "市场研究简报", "根据产品、用户、竞品和目标生成结构化市场分析。"],
  ["decision_intelligence", "决策智能分析", "把问题、选项和上下文转化为建议、取舍、风险和下一步动作。"],
  ["execution_plan", "执行计划生成", "生成面向团队、外部工具或 OneClaw 的执行计划，OneAI 不直接执行。"],
  ["custom_task_designer", "定制任务智能设计", "为客户业务设计专属 Task Intelligence 的输入、输出、策略和上线方案。"],
];

const modes = [
  ["cheap", "优先低成本模型，适合大量、低风险、高频任务。"],
  ["balanced", "平衡质量、速度和成本，适合多数生产请求。"],
  ["premium", "优先高质量模型，适合重要策略、复杂分析和高价值任务。"],
  ["fast", "优先速度，适合实时体验和轻量交互。"],
  ["auto", "由 OneAI 根据任务和策略自动选择模型。"],
];

const contacts = [
  ["Email", "info@weareoneconnection.com", "mailto:info@weareoneconnection.com"],
  ["Telegram", "https://t.me/waocfounder", "https://t.me/waocfounder"],
  ["X", "https://x.com/waoconnectone?s=21", "https://x.com/waoconnectone?s=21"],
];

export default function ProductGuidePage() {
  return (
    <DocShell
      title="OneAI SaaS 产品使用说明"
      description="面向开发者、创业团队和企业的中文产品指南：了解 OneAI 的 API 能力、任务智能、模型路由、成本控制和商业使用方式。"
      pills={["中文指南", "Task Intelligence", "模型网关", "成本控制", "商业 API"]}
      prev={{ href: "/docs", label: "Docs Home" }}
      next={{ href: "/docs/quickstart", label: "Quickstart" }}
    >
      <section>
        <DocSectionTitle
          title="产品定位"
          desc="OneAI SaaS 是一个统一全模型调用、成本控制和任务智能生成的 AI 基础设施平台。它帮助开发者和企业快速构建自己的 AI 智能大脑。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["统一模型网关", "通过一个 OneAI API 接入 OpenAI、DeepSeek、OpenRouter 等上游模型。"],
            ["Task Intelligence", "把自然语言需求转化为结构化业务结果，而不是只返回普通聊天文本。"],
            ["商业级控制", "提供 API key、usage、requestId、成本估算、权限策略和运营可见性。"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-black/10 bg-white p-5">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-3 text-sm leading-relaxed text-black/65">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="核心 API"
          desc="OneAI 当前主要提供两类 API：模型网关 API 和智能任务 API。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <code className="text-sm font-extrabold text-black">/v1/chat/completions</code>
            <p className="mt-3 text-sm leading-relaxed text-black/65">
              直接调用大模型，兼容 OpenAI 风格。适合已有聊天、补全、模型网关场景。
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <code className="text-sm font-extrabold text-black">/v1/generate</code>
            <p className="mt-3 text-sm leading-relaxed text-black/65">
              调用 OneAI Task Intelligence，把业务输入转化为结构化结果，例如策略、内容、市场分析、决策建议和执行计划。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="适合哪些用户"
          desc="OneAI 面向需要快速接入 AI 能力、控制成本并沉淀业务智能的团队。"
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "SaaS 开发者",
            "AI 产品团队",
            "创业公司",
            "自动化工具团队",
            "内容和增长团队",
            "需要定制 AI Task Intelligence 的企业客户",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-sm font-semibold text-black/75">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="当前对外商业任务"
          desc="这些任务面向外部客户展示和售卖。内部历史 workflow 可以保留调用，但不作为公开任务列表展示。"
        />
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">用途</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {tasks.map(([task, name, desc]) => (
                <tr key={task}>
                  <td className="px-4 py-4 font-mono text-xs font-semibold text-black">{task}</td>
                  <td className="px-4 py-4 font-bold text-black">{name}</td>
                  <td className="px-4 py-4 leading-relaxed text-black/65">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="调用示例"
          desc="创建 OneAI API key 后，在请求头里传入 x-api-key 即可调用 Task Intelligence。"
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-[#0f1115] p-5 text-white">
          <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-white/75">
            <code>{`curl -s https://oneai-saas-api-production.up.railway.app/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_ONEAI_API_KEY" \\
  -d '{
    "type": "business_strategy",
    "input": {
      "goal": "Launch a B2B AI API product in 30 days",
      "audience": "SaaS builders and small teams",
      "constraints": ["Keep it practical", "Prioritize fast validation"]
    },
    "options": {
      "llm": {
        "mode": "cheap",
        "maxCostUsd": 0.03
      }
    }
  }'`}</code>
          </pre>
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="模型调用模式"
          desc="用户可以通过 mode 控制 OneAI 的模型路由偏好。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {modes.map(([mode, desc]) => (
            <div key={mode} className="rounded-lg border border-black/10 bg-white p-4">
              <code className="text-sm font-extrabold text-black">{mode}</code>
              <p className="mt-3 text-xs leading-relaxed text-black/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="成本控制与 Usage"
          desc="OneAI 每次请求都会返回模型、token、成本估算和 requestId，方便客户和运营方统计真实使用情况。"
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
          <pre className="overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-black/75">{`{
  "provider": "openrouter",
  "model": "openai/gpt-5.2-20251211",
  "promptTokens": 277,
  "completionTokens": 923,
  "totalTokens": 1200,
  "estimatedCostUSD": 0.01340675
}`}</pre>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-black/65">
          用户可以通过 <code className="rounded bg-black/[0.06] px-1 py-0.5">maxCostUsd</code> 控制单次请求最大成本。
          管理端可以查看客户、API key、请求数、token 和模型成本。
        </p>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="数据安全与边界"
          desc="OneAI 的信任基础来自透明路由、成本可见、密钥安全和清晰的执行边界。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["API key 安全", "API key 只在创建时显示一次，系统保存 hash，不保存明文 key。"],
            ["请求可追踪", "每次调用返回 requestId，可用于排查、审计和使用量统计。"],
            ["模型透明", "响应中返回 provider、model、token 和 estimatedCostUSD，避免黑盒中转。"],
            ["执行边界", "OneAI 负责智能分析、任务规划和结构化输出；实际执行交给 OneClaw、Bot 或客户系统。"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-black/10 bg-white p-5">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-3 text-sm leading-relaxed text-black/65">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="商业使用方式"
          desc="当前建议采用 API 调用 + 定制 Task Intelligence + 人工开通套餐的方式进入商业运营。"
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-5">
          <div className="grid gap-3 md:grid-cols-3">
            {["API 调用", "模型网关", "Task Intelligence", "企业定制任务", "私有化任务设计", "Contact Sales"].map((item) => (
              <div key={item} className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-black shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {contacts.map(([label, value, href]) => (
            <Link key={label} href={href} className="rounded-lg border border-black/10 bg-white p-5 hover:border-black/25 hover:bg-black/[0.02]">
              <div className="text-xs font-bold uppercase tracking-wide text-black/45">{label}</div>
              <div className="mt-2 break-words text-sm font-extrabold text-black">{value}</div>
            </Link>
          ))}
        </div>
      </section>
    </DocShell>
  );
}
