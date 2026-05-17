"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type SystemNode = {
  id: string;
  eyebrow: string;
  title: string;
  desc: string;
  position: string;
  tone: "cyan" | "blue" | "emerald" | "amber" | "violet";
};

const lifecycle = [
  ["01", "Authenticate key", "Validate API key, customer plan, and access scope."],
  ["02", "Choose surface", "Use Generate, Chat, Messages, or Agent OS preview based on the product need."],
  ["03", "Shape intelligence", "Convert product intent into a stable task, message, or handoff contract."],
  ["04", "Apply routing", "Select cheap, balanced, premium, or explicit model behavior."],
  ["05", "Enforce policy", "Apply cost guard, tier access, and request rules."],
  ["06", "Call model or handoff", "Route to a model provider or prepare a non-executing Agent OS handoff object."],
  ["07", "Track usage", "Record request, customer, usage, cost, and billing context."],
];

const systemNodes: SystemNode[] = [
  {
    id: "product",
    eyebrow: "Input",
    title: "Your Product",
    desc: "SaaS app · backend · agent · internal tool",
    position: "left-[3%] top-[41%]",
    tone: "cyan",
  },
  {
    id: "providers",
    eyebrow: "Models",
    title: "Model Providers",
    desc: "OpenAI · Anthropic · Google · xAI · DeepSeek · OpenRouter",
    position: "left-[32%] top-[5%]",
    tone: "blue",
  },
  {
    id: "tasks",
    eyebrow: "Workflow",
    title: "Task Intelligence",
    desc: "business_strategy · content_engine · support_brain",
    position: "right-[3%] top-[33%]",
    tone: "emerald",
  },
  {
    id: "agentos",
    eyebrow: "Handoff",
    title: "Agent OS Preview",
    desc: "agent plans · context packets · external execution boundary",
    position: "right-[3%] top-[8%]",
    tone: "cyan",
  },
  {
    id: "policy",
    eyebrow: "Governance",
    title: "Policy & Cost Guard",
    desc: "routing mode · maxCostUsd · plan gates",
    position: "left-[12%] bottom-[10%]",
    tone: "amber",
  },
  {
    id: "console",
    eyebrow: "Commercial",
    title: "Commercial Console",
    desc: "keys · usage · customers · billing · cost",
    position: "right-[11%] bottom-[10%]",
    tone: "violet",
  },
];

function ToneDot({ tone }: { tone: SystemNode["tone"] }) {
  const toneClass =
    tone === "cyan"
      ? "bg-cyan-300 shadow-cyan-300/50"
      : tone === "blue"
        ? "bg-blue-300 shadow-blue-300/50"
        : tone === "emerald"
          ? "bg-emerald-300 shadow-emerald-300/50"
          : tone === "amber"
            ? "bg-amber-300 shadow-amber-300/50"
            : "bg-violet-300 shadow-violet-300/50";

  return <span className={`h-2.5 w-2.5 rounded-full shadow-lg ${toneClass}`} />;
}

function Glass({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.7rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/30 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SystemNodeCard({ node }: { node: SystemNode }) {
  return (
    <div
      className={`absolute z-20 w-[220px] rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-xl shadow-black/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.1] ${node.position}`}
    >
      <div className="flex items-center justify-between gap-3">
        <ToneDot tone={node.tone} />
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/35">
          {node.eyebrow}
        </span>
      </div>

      <div className="mt-4 text-base font-black tracking-tight text-white">
        {node.title}
      </div>

      <div className="mt-2 text-xs leading-relaxed text-white/45">
        {node.desc}
      </div>
    </div>
  );
}

function MobileSystemPreview({ nodes }: { nodes: SystemNode[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ToneDot tone={node.tone} />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                {node.eyebrow}
              </span>
            </div>
            <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-black text-white/35">
              node
            </span>
          </div>
          <div className="mt-3 text-lg font-black text-white">{node.title}</div>
          <div className="mt-1 text-sm leading-relaxed text-white/48">{node.desc}</div>
        </div>
      ))}
    </div>
  );
}

function DesktopSystemMap({ nodes, copy }: { nodes: SystemNode[]; copy: { coreSubtitle: string; chips: string[]; preview: string; previewDesc: string } }) {
  return (
    <div className="hidden lg:block">
      <Glass className="relative overflow-hidden p-4">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative h-[620px] overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#060914]/95">
          <div className="oneai-system-scan pointer-events-none absolute left-0 right-0 top-0 z-10 h-28 bg-gradient-to-b from-emerald-300/0 via-emerald-300/10 to-emerald-300/0" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 760 560"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="oneaiMapLine" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
                <stop offset="50%" stopColor="rgba(52,211,153,0.42)" />
                <stop offset="100%" stopColor="rgba(167,139,250,0.18)" />
              </linearGradient>

              <filter id="oneaiMapGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <path id="flowProductCore" d="M 58 280 C 165 270, 255 270, 365 270" />
              <path id="flowCoreProviders" d="M 365 270 C 395 175, 435 105, 505 75" />
              <path id="flowCoreAgentOS" d="M 365 270 C 470 145, 575 90, 680 75" />
              <path id="flowCoreTasks" d="M 365 270 C 475 250, 565 230, 680 215" />
              <path id="flowCorePolicy" d="M 365 270 C 295 355, 225 420, 165 465" />
              <path id="flowCoreConsole" d="M 365 270 C 450 365, 520 425, 610 465" />
            </defs>

            <use href="#flowProductCore" stroke="url(#oneaiMapLine)" strokeWidth="2" fill="none" strokeDasharray="7 9" />
            <use href="#flowCoreProviders" stroke="url(#oneaiMapLine)" strokeWidth="2" fill="none" strokeDasharray="7 9" />
            <use href="#flowCoreAgentOS" stroke="url(#oneaiMapLine)" strokeWidth="2" fill="none" strokeDasharray="7 9" />
            <use href="#flowCoreTasks" stroke="url(#oneaiMapLine)" strokeWidth="2" fill="none" strokeDasharray="7 9" />
            <use href="#flowCorePolicy" stroke="url(#oneaiMapLine)" strokeWidth="2" fill="none" strokeDasharray="7 9" />
            <use href="#flowCoreConsole" stroke="url(#oneaiMapLine)" strokeWidth="2" fill="none" strokeDasharray="7 9" />

            <circle r="5" fill="rgb(34,211,238)" filter="url(#oneaiMapGlow)">
              <animateMotion dur="4.6s" repeatCount="indefinite">
                <mpath href="#flowProductCore" />
              </animateMotion>
            </circle>

            <circle r="5" fill="rgb(96,165,250)" filter="url(#oneaiMapGlow)">
              <animateMotion dur="5.2s" begin="0.6s" repeatCount="indefinite">
                <mpath href="#flowCoreProviders" />
              </animateMotion>
            </circle>

            <circle r="5" fill="rgb(34,211,238)" filter="url(#oneaiMapGlow)">
              <animateMotion dur="5.4s" begin="0.9s" repeatCount="indefinite">
                <mpath href="#flowCoreAgentOS" />
              </animateMotion>
            </circle>

            <circle r="5" fill="rgb(110,231,183)" filter="url(#oneaiMapGlow)">
              <animateMotion dur="5s" begin="1.1s" repeatCount="indefinite">
                <mpath href="#flowCoreTasks" />
              </animateMotion>
            </circle>

            <circle r="5" fill="rgb(251,191,36)" filter="url(#oneaiMapGlow)">
              <animateMotion dur="5.6s" begin="1.6s" repeatCount="indefinite">
                <mpath href="#flowCorePolicy" />
              </animateMotion>
            </circle>

            <circle r="5" fill="rgb(167,139,250)" filter="url(#oneaiMapGlow)">
              <animateMotion dur="5.9s" begin="2.1s" repeatCount="indefinite">
                <mpath href="#flowCoreConsole" />
              </animateMotion>
            </circle>
          </svg>

          <div className="absolute left-1/2 top-1/2 z-30 w-[246px] -translate-x-1/2 -translate-y-1/2 rounded-[1.8rem] border border-emerald-300/25 bg-[#07120f]/95 p-5 text-center shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
            <div className="oneai-core-halo pointer-events-none absolute inset-[-18px] rounded-[2.2rem] border border-emerald-300/20 bg-emerald-300/5" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-lg font-black text-emerald-100">
                OA
              </div>

              <div className="mt-4 text-xl font-black tracking-tight text-white">
                OneAI Core
              </div>

              <div className="mt-2 text-xs font-semibold leading-relaxed text-emerald-100/62">
                {copy.coreSubtitle}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {copy.chips.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] px-2 py-2 text-xs font-black text-emerald-100/75"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {nodes.map((node) => (
            <SystemNodeCard key={node.id} node={node} />
          ))}

          <div className="absolute bottom-4 left-4 right-4 z-40 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                  {copy.preview}
                </div>
                <div className="mt-1 text-sm font-bold text-white/70">
                  {copy.previewDesc}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {["auth", "surface", "shape", "route", "guard", "handoff", "track"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-black text-white/45"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Glass>
    </div>
  );
}

export function DynamicSystemMap() {
  const { isZh } = useI18n();
  const localizedLifecycle = isZh
    ? [
        ["01", "认证 key", "校验 API key、客户套餐和访问 scope。"],
        ["02", "选择 API surface", "根据产品需求选择 Generate、Chat、Messages 或 Agent OS 预览。"],
        ["03", "塑造智能输出", "把产品意图转换成稳定 task、message 或 handoff 合约。"],
        ["04", "应用路由", "选择低成本、均衡、高级或显式模型行为。"],
        ["05", "执行策略", "应用成本保护、套餐权限和请求规则。"],
        ["06", "调用模型或 handoff", "路由到模型 provider，或准备不执行动作的 Agent OS handoff 对象。"],
        ["07", "追踪用量", "记录请求、客户、用量、成本和支付上下文。"],
      ]
    : lifecycle;
  const localizedNodes = isZh
    ? [
        { ...systemNodes[0], eyebrow: "输入", title: "你的产品", desc: "SaaS app · backend · agent · internal tool" },
        { ...systemNodes[1], eyebrow: "模型", title: "模型 Providers", desc: "OpenAI · Anthropic · Google · xAI · DeepSeek · OpenRouter" },
        { ...systemNodes[2], eyebrow: "工作流", title: "Task Intelligence", desc: "business_strategy · content_engine · support_brain" },
        { ...systemNodes[3], eyebrow: "Handoff", title: "Agent OS 预览", desc: "agent plans · context packets · external execution boundary" },
        { ...systemNodes[4], eyebrow: "治理", title: "策略与成本保护", desc: "routing mode · maxCostUsd · plan gates" },
        { ...systemNodes[5], eyebrow: "商业", title: "商业控制台", desc: "keys · usage · customers · billing · cost" },
      ]
    : systemNodes;
  const copy = {
    eyebrow: isZh ? "系统图" : "System Map",
    title: isZh ? "一次请求，经过多层商业智能。" : "One request. Multiple layers of commercial intelligence.",
    desc: isZh
      ? "每一次 AI 请求都可以经过认证、任务结构化、模型路由、成本策略、供应商执行、用量记录和支付就绪可见性。"
      : "Every AI request can move through authentication, task shaping, routing, cost policy, provider execution, usage tracking, and billing-ready visibility.",
    zhLine: isZh
      ? "OneAI 把模型访问、Task Intelligence、Agent OS handoff 和商业控制统一成一个可运营的智能大脑。"
      : "OneAI unifies model access, Task Intelligence, Agent OS handoff, and commercial controls into one operable intelligence brain.",
    lifecycleTitle: isZh ? "请求生命周期" : "Request lifecycle",
    previewNote: isZh ? "系统预览 · 非生产实时数据" : "System preview · not live production data",
    preview: isZh ? "预览" : "preview",
    coreSubtitle: isZh ? "商业 AI 操作层" : "Commercial AI Operating Layer",
    chips: isZh ? ["路由", "塑形", "保护", "追踪"] : ["route", "shape", "guard", "track"],
    mapPreview: isZh ? "系统预览" : "System preview",
    mapPreviewDesc: isZh ? "请求路径仅用于产品解释。" : "Request path shown for product explanation only.",
  };
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#030712]">
      <style>{`
        @keyframes oneai-core-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.68;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes oneai-system-scan {
          0% {
            transform: translateY(-110%);
            opacity: 0;
          }
          20% {
            opacity: 0.48;
          }
          100% {
            transform: translateY(620%);
            opacity: 0;
          }
        }

        .oneai-core-halo {
          animation: oneai-core-pulse 3.8s ease-in-out infinite;
        }

        .oneai-system-scan {
          animation: oneai-system-scan 4.8s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_82%_35%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.12),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              {copy.eyebrow}
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              {copy.title}
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/58 md:text-lg">
              {copy.desc}
            </p>

            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-emerald-100/75 md:text-base">
              {copy.zhLine}
            </p>

            <Glass className="mt-8 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="text-sm font-black text-white">
                    {copy.lifecycleTitle}
                  </div>
                  <div className="mt-1 text-xs text-white/38">
                    {copy.previewNote}
                  </div>
                </div>

                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-200">
                  {copy.preview}
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {localizedLifecycle.map(([step, title, desc]) => (
                  <div
                    key={step}
                    className="group grid grid-cols-[42px_1fr] gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-emerald-300/25 hover:bg-white/[0.06]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-xs font-black text-emerald-200">
                      {step}
                    </div>

                    <div>
                      <div className="text-sm font-black text-white">
                        {title}
                      </div>
                      <div className="mt-1 text-xs leading-relaxed text-white/42">
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>

          <div className="relative">
            <DesktopSystemMap nodes={localizedNodes} copy={{ coreSubtitle: copy.coreSubtitle, chips: copy.chips, preview: copy.mapPreview, previewDesc: copy.mapPreviewDesc }} />
            <MobileSystemPreview nodes={localizedNodes} />

            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.4rem] bg-emerald-400/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DynamicSystemMap;
