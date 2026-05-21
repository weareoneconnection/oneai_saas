"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "info@weareoneconnection.com";
const CONTACT_HREF =
  `mailto:${CONTACT_EMAIL}?subject=OneAI%20Partner%20Network`;
const TELEGRAM_HREF = "https://t.me/waocfounder";
const X_HREF = "https://x.com/waoconnectone?s=21";

function Header() {
  const { isZh } = useI18n();

  return (
    <header className="border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 2xl:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-sm font-bold">
            OA
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold">OneAI API</div>
            <div className="truncate text-xs text-white/55">
              {isZh ? "合作伙伴计划" : "Partner Network"}
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/65 md:flex">
          <Link href="/pricing" className="hover:text-white">
            {isZh ? "价格" : "Pricing"}
          </Link>
          <Link href="/trust-center" className="hover:text-white">
            {isZh ? "信任中心" : "Trust"}
          </Link>
          <Link href="/docs" className="hover:text-white">
            {isZh ? "文档" : "Docs"}
          </Link>
          <Link href="/login" className="hover:text-white">
            {isZh ? "登录" : "Login"}
          </Link>
        </nav>
        <LanguageToggle compact />
      </div>
    </header>
  );
}

function Card({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-black text-white">{title}</div>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{body}</p>
    </div>
  );
}

function Tier({
  name,
  value,
  note,
  active,
}: {
  name: string;
  value: string;
  note: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-6",
        active ? "border-emerald-300 bg-emerald-300 text-black" : "border-white/10 bg-white/[0.04] text-white",
      ].join(" ")}
    >
      <div className={active ? "text-sm font-black text-black/60" : "text-sm font-black text-white/45"}>
        {name}
      </div>
      <div className="mt-4 text-4xl font-black tracking-tight">{value}</div>
      <p className={active ? "mt-4 text-sm leading-relaxed text-black/70" : "mt-4 text-sm leading-relaxed text-white/60"}>
        {note}
      </p>
    </div>
  );
}

export default function PartnersPage() {
  const { isZh } = useI18n();
  const c = (en: string, zh: string) => (isZh ? zh : en);

  const audience = [
    c("AI builders with founder or developer audiences", "拥有创始人或开发者受众的 AI 创作者"),
    c("SaaS consultants helping teams adopt AI APIs", "帮助团队接入 AI API 的 SaaS 顾问"),
    c("Communities, agencies, accelerators, and product studios", "社区、Agency、加速器和产品工作室"),
    c("Operators who can introduce custom Task Intelligence use cases", "能引入定制 Task Intelligence 场景的运营者"),
  ];

  const steps = [
    [
      c("Apply", "申请"),
      c("Tell us your audience, channel, and the kind of customers you can bring.", "说明你的受众、渠道以及可以带来的客户类型。"),
    ],
    [
      c("Get partner assets", "获得推广素材"),
      c("Use OneAI positioning, demo flows, product links, and approved claims.", "使用 OneAI 定位、演示流程、产品链接和官方文案。"),
    ],
    [
      c("Refer customers", "推荐客户"),
      c("Send teams to OneAI, or introduce qualified custom Task Intelligence deals.", "引导团队使用 OneAI，或推荐定制 Task Intelligence 商机。"),
    ],
    [
      c("Earn share", "获得分成"),
      c("Qualified referrals are reviewed manually first, then moved to tracked revenue share as the program matures.", "早期先人工确认有效推荐，成熟后升级为自动追踪分佣。"),
    ],
  ];

  return (
    <main className="min-h-dvh bg-[#05070d] text-white">
      <Header />

      <section className="mx-auto w-full max-w-[1760px] px-4 py-16 sm:px-6 lg:px-8 2xl:px-10 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-200">
              {c("OneAI Partner Network", "OneAI 合作伙伴网络")}
            </div>
            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              {c(
                "Refer teams to OneAI. Earn when they grow.",
                "推荐团队使用 OneAI，和客户增长一起获得收益。"
              )}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-white/65">
              {c(
                "OneAI is building the commercial AI brain for model routing, Task Intelligence, Agent OS handoff, cost control, and enterprise trust. Partners help the right customers find it faster.",
                "OneAI 正在构建面向商业场景的 AI 智能大脑，覆盖模型路由、Task Intelligence、Agent OS 交接、成本控制和企业信任。合作伙伴帮助合适的客户更快找到它。"
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={CONTACT_HREF}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-black hover:bg-emerald-100"
              >
                {c("Apply by email", "邮件申请")}
              </Link>
              <Link
                href={TELEGRAM_HREF}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-black text-white hover:bg-white/10"
              >
                Telegram
              </Link>
              <Link
                href={X_HREF}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-black text-white hover:bg-white/10"
              >
                X
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-emerald-500/10">
            <div className="text-sm font-black uppercase tracking-wide text-white/45">
              {c("Early partner economics", "早期合作收益模型")}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Tier
                name={c("Pro referrals", "Pro 推荐")}
                value="20%"
                note={c("Suggested first-month share for qualified self-serve paid users.", "建议对有效自助付费用户首月分成。")}
              />
              <Tier
                name={c("Team referrals", "Team 推荐")}
                value="15%"
                note={c("Suggested 3-month share for qualified team customers.", "建议对有效团队客户前三个月分成。")}
                active
              />
              <Tier
                name={c("Enterprise deals", "企业客户")}
                value="5-10%"
                note={c("Custom yearly share or fixed bounty after sales review.", "销售确认后采用年度分成或固定奖励。")}
              />
            </div>
            <p className="mt-5 text-xs leading-relaxed text-white/45">
              {c(
                "Final terms are confirmed case by case while OneAI is still moving from manual partner tracking to automated referral attribution.",
                "在 OneAI 从人工合作伙伴追踪升级到自动归因之前，最终条款会按推荐质量和客户类型逐单确认。"
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid w-full max-w-[1760px] gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8 2xl:px-10">
          <Card
            title={c("Clear product wedge", "清晰产品切入点")}
            body={c(
              "Gateway APIs are crowded. OneAI adds Task Intelligence, Agent OS handoff, usage control, and commercial operations.",
              "单纯模型网关竞争激烈，OneAI 增加 Task Intelligence、Agent OS 交接、用量控制和商业运营层。"
            )}
          />
          <Card
            title={c("High-value customers", "高价值客户")}
            body={c(
              "Partners can introduce SaaS teams, agencies, creators, and companies that need custom AI workflows.",
              "合作伙伴可以引入需要定制 AI 工作流的 SaaS 团队、Agency、创作者和企业。"
            )}
          />
          <Card
            title={c("Trust-first positioning", "信任优先定位")}
            body={c(
              "OneAI emphasizes server-side keys, execution boundaries, auditability, cost controls, and enterprise docs.",
              "OneAI 强调服务端 key、执行边界、审计、成本控制和企业文档。"
            )}
          />
          <Card
            title={c("Easy first action", "推广动作简单")}
            body={c(
              "Start with a demo, article, community post, or direct intro. We help qualify and close the lead.",
              "可以从演示、文章、社区帖子或直接介绍开始。OneAI 协助判断客户质量并推进成交。"
            )}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1760px] px-4 py-16 sm:px-6 lg:px-8 2xl:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-white/45">
              {c("Who should promote OneAI", "谁适合推广 OneAI")}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {c("Best for people who already influence builders and operators.", "最适合已经影响开发者和运营者的人。")}
            </h2>
            <div className="mt-6 space-y-3">
              {audience.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-black uppercase tracking-wide text-white/45">
              {c("Partner flow", "合作流程")}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {steps.map(([title, body], index) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-black">
                    {index + 1}
                  </div>
                  <div className="mt-5 text-lg font-black">{title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1760px] px-4 pb-16 sm:px-6 lg:px-8 2xl:px-10">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300 p-8 text-black md:p-10">
          <div className="max-w-4xl">
            <div className="text-xs font-black uppercase tracking-wide text-black/55">
              {c("Start with one qualified intro", "先从一个有效推荐开始")}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              {c(
                "If you can bring AI API customers, OneAI should make that valuable for you.",
                "如果你能带来 AI API 客户，OneAI 应该让这件事对你有价值。"
              )}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-black/70">
              {c(
                "Send us your channel, audience size, expected customer type, and whether you want to promote self-serve plans or custom Task Intelligence deals.",
                "把你的渠道、受众规模、客户类型，以及你想推广自助套餐还是定制 Task Intelligence 商机发给我们。"
              )}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={CONTACT_HREF}
                className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-4 text-sm font-black text-white hover:bg-neutral-900"
              >
                {CONTACT_EMAIL}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-black/15 px-6 py-4 text-sm font-black text-black hover:bg-black/5"
              >
                {c("Open console", "打开控制台")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
