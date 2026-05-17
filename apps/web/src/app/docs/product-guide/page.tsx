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

const apiSurfaces = [
  ["/v1/generate", "Task Intelligence", "调用商业任务，把业务输入转化为结构化策略、内容、研究、决策和执行计划。"],
  ["/v1/chat/completions", "模型网关", "OpenAI-compatible 大模型直连接口，适合已有 chat/completions 客户端。"],
  ["/v1/messages", "Messages API", "Anthropic-style Messages API，通过 OneAI 模型路由统一调用。"],
  ["/v1/models", "模型目录", "查看模型目录、provider、上下文、工具支持、价格覆盖和健康状态。"],
  ["/v1/handoff/contracts", "Agent OS 交接合同", "生成可交给 OneClaw、OpenClaw、Bot、人类或外部系统执行的标准 handoff contract。"],
  ["/v1/executions/{handoffId}/result", "执行结果回传", "外部 executor 回传 proof 和 result，OneAI 记录执行账本。"],
];

const consoleFeatures = [
  ["Dashboard", "查看 API 健康、成本、用量和上线状态。"],
  ["Playground", "测试 Task API、Chat API 和 Agent OS 预览。"],
  ["Models", "查看模型目录、Provider 配置、Ready 状态、价格和健康检测。"],
  ["Tasks", "查看对外商用任务列表，内部 workflow 可继续保留但不公开展示。"],
  ["API Keys", "创建、轮换、撤销 key，并设置预算、RPM、IP、任务和模型 allowlist。"],
  ["Usage", "查看请求量、token、模型成本、失败请求和 Agent OS 用量关联。"],
  ["Billing", "查看套餐、Stripe 自动化状态、发票、升级路径和企业文档。"],
  ["Team", "查看组织、成员、角色，并由 Owner 管理成员权限。"],
  ["Executions", "查看 Agent OS handoff、proof、result、审批和执行账本。"],
];

const teamRoles = [
  ["OWNER", "组织所有者，可管理成员、账单、API key 策略和 Agent OS proof 审核。"],
  ["ADMIN", "运营管理员，可管理 key、查看用量、处理模型策略和审计事件。"],
  ["MEMBER", "开发/业务成员，可使用已授权的 key、任务和模型进行构建。"],
  ["VIEWER", "只读角色，可查看用量、账单、执行记录和文档。"],
];

const legalDocs = [
  ["Enterprise Contract", "/legal/enterprise-contract", "企业合同包：订单、MSA、DPA、SLA、发票和支持条款。"],
  ["SLA", "/legal/sla", "服务等级、支持响应、排除项和企业 SLA 说明。"],
  ["DPA", "/legal/dpa", "客户数据、上游 provider、删除/导出和数据处理边界。"],
  ["Invoices", "/legal/invoices", "Stripe 发票、手动发票、账单证据和套餐变化。"],
  ["Terms", "/legal/terms", "服务边界、可接受使用、输出责任和套餐限制。"],
  ["Privacy", "/legal/privacy", "账号数据、请求数据、密钥、日志和客户数据请求。"],
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
            ["统一模型网关", "通过一个 OneAI API 接入 OpenAI、DeepSeek、OpenRouter 等上游模型，并保留 provider/model/usage/cost 元数据。"],
            ["Task Intelligence", "把自然语言需求转化为结构化业务结果，而不是只返回普通聊天文本。"],
            ["Agent OS 控制平面", "生成 agent plan、handoff contract、proof/result 账本，但 OneAI 不直接执行外部动作。"],
            ["商业级控制", "提供 API key、usage、requestId、成本估算、权限策略、团队角色和运营可见性。"],
            ["企业采购准备", "提供 Billing、Team、Security、SLA、DPA、发票、合同包和审计记录入口。"],
            ["成本优先基础设施", "支持 cheap、balanced、premium、fast、auto 路由模式，并可设置 maxCostUsd 控制单次成本。"],
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
          desc="OneAI 当前已经形成三类 API：模型网关、Task Intelligence、Agent OS 交接与执行账本。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {apiSurfaces.map(([path, title, desc]) => (
            <div key={path} className="rounded-lg border border-black/10 bg-white p-5">
              <code className="text-sm font-extrabold text-black">{path}</code>
              <div className="mt-3 text-sm font-bold text-black">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/65">{desc}</p>
            </div>
          ))}
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
          title="控制台能力"
          desc="OneAI 不只是 API，还提供面向客户和运营方的商业控制台，用来管理 key、模型、任务、用量、账单、团队和 Agent OS 执行记录。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {consoleFeatures.map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-black/10 bg-white p-5">
              <div className="text-sm font-extrabold text-black">{title}</div>
              <p className="mt-3 text-sm leading-relaxed text-black/65">{desc}</p>
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
          管理端可以查看客户、API key、请求数、token、模型成本、失败请求和 Agent OS 执行关联。
        </p>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="模型基础设施"
          desc="OneAI 的模型层已经从单模型调用升级为模型目录、健康检测、价格估算、provider 配置和路由策略。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["模型目录", "通过 /v1/models 查看 OpenAI、OpenRouter、DeepSeek 等 provider 下的模型能力、配置状态和价格覆盖。"],
            ["健康检测", "运营方可以对单个模型进行健康检查，确认 provider key、模型名和调用链可用。"],
            ["价格估算", "通过 /v1/models/estimate 或请求 usage 字段计算 prompt/completion tokens 和 estimatedCostUSD。"],
            ["路由策略", "支持 cheap、balanced、premium、fast、auto，也支持显式 provider/model 选择。"],
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
          title="Agent OS 能力边界"
          desc="OneAI 是统一智能协调大脑，不直接执行外部动作。它负责计划、交接、审批、记录、验证；执行交给 OneClaw、OpenClaw、Bot、外部系统或人工。"
        />
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">阶段</th>
                <th className="px-4 py-3">OneAI 负责</th>
                <th className="px-4 py-3">外部 executor 负责</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {[
                ["Plan", "生成 agent plan、步骤、风险、proof 要求和预期结果。", "读取计划，准备执行。"],
                ["Handoff", "生成 handoff contract，定义 executor、审批策略和 proof policy。", "接收 contract，并按协议执行。"],
                ["Approval", "记录自动审批或人工审批状态。", "只在允许执行后开始动作。"],
                ["Proof", "接收 proof、记录证据、支持运营方审核。", "回传日志、截图、URL、交易、JSON 或文本证明。"],
                ["Result", "记录执行结果和最终状态。", "回传 SUCCEEDED、FAILED、CANCELED 等结果。"],
              ].map(([stage, oneai, executor]) => (
                <tr key={stage}>
                  <td className="px-4 py-4 font-bold text-black">{stage}</td>
                  <td className="px-4 py-4 leading-relaxed text-black/65">{oneai}</td>
                  <td className="px-4 py-4 leading-relaxed text-black/65">{executor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            ["执行边界", "OneAI 负责智能分析、任务规划和结构化输出；实际执行交给 OneClaw、OpenClaw、Bot 或客户系统。"],
            ["团队权限", "支持 Owner、Admin、Member、Viewer 角色，Owner 可管理成员和关键商业权限。"],
            ["审计记录", "登录、key、billing、失败请求、Agent OS proof/result 等关键事件可追踪。"],
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
          title="团队权限"
          desc="OneAI 支持组织级权限管理，适合企业客户把开发、运营、账单和只读观察权限分开。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {teamRoles.map(([role, desc]) => (
            <div key={role} className="rounded-lg border border-black/10 bg-white p-5">
              <code className="text-sm font-extrabold text-black">{role}</code>
              <p className="mt-3 text-sm leading-relaxed text-black/65">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="OneAI 与普通模型中转站的区别"
          desc="OneAI 包含模型网关能力，但核心目标不是只做请求转发，而是把模型能力产品化为可销售、可计量、可治理的业务智能。"
        />
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-black/[0.04] text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">维度</th>
                <th className="px-4 py-3">普通模型中转站</th>
                <th className="px-4 py-3">OneAI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {[
                ["核心价值", "统一调用多个模型", "统一模型调用 + Task Intelligence + 商业控制层"],
                ["输出形式", "主要返回聊天文本", "返回业务场景可用的结构化结果"],
                ["成本控制", "通常需要用户自己监控", "返回 token、模型、provider 和 estimatedCostUSD"],
                ["商业化", "偏开发者工具", "包含 API key、usage、plan policy、客户和运营视图"],
                ["安全边界", "容易被理解为黑盒转发", "OneAI 只做智能协调，执行交给 OneClaw/OpenClaw/Bot/客户系统"],
                ["企业采购", "通常缺少 SLA/DPA/发票/团队权限说明", "提供 Team、Billing、Security、SLA、DPA、Invoices、Enterprise Contract Pack"],
                ["Agent OS", "通常不包含执行协议", "提供 handoff contract、executor protocol、proof/result 回传和 execution ledger"],
              ].map(([dim, gateway, oneai]) => (
                <tr key={dim}>
                  <td className="px-4 py-4 font-bold text-black">{dim}</td>
                  <td className="px-4 py-4 leading-relaxed text-black/60">{gateway}</td>
                  <td className="px-4 py-4 leading-relaxed font-semibold text-black">{oneai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="商业使用方式"
          desc="OneAI 支持免费测试、API 付费套餐、团队权限、企业合同、DPA/SLA、发票和定制 Task Intelligence。"
        />
        <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-5">
          <div className="grid gap-3 md:grid-cols-3">
            {["API 调用", "模型网关", "Task Intelligence", "Agent OS handoff", "团队权限", "企业合同", "SLA / DPA", "Stripe 发票", "Contact Sales"].map((item) => (
              <div key={item} className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-black shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {legalDocs.map(([label, href, desc]) => (
            <Link key={href} href={href} className="rounded-lg border border-black/10 bg-white p-5 hover:border-black/25 hover:bg-black/[0.02]">
              <div className="text-sm font-extrabold text-black">{label}</div>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{desc}</p>
            </Link>
          ))}
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
