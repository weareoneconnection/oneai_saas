// apps/web/src/app/studio-lite/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

type PackKey = "quick" | "growth" | "launch" | "replies";
type AudienceKey = "founders" | "builders" | "web3" | "creators" | "developers";
type ToneKey = "contrarian" | "calm" | "funny" | "serious";
type LangKey = "en" | "zh";

type StudioLiteOutput = {
  schema_version?: "studio_lite_pack_v2";
  best_hook?: string;
  hooks?: string[];
  tweets?: string[];
  thread?: string[];
  cta?: string;
  replies?: string[];
  schedule?: Array<{
    day: number;
    content_type: string;
    description: string;
  }>;
  reply_strategy?: string[];
  meta?: {
    pack?: PackKey;
    audience?: AudienceKey;
    tone?: ToneKey;
    language?: LangKey;
    source?: "oneai" | "fallback";
    generated_at?: string;
    diagnostics?: {
      used_fallback?: boolean;
      failed_tasks?: string[];
      strategy_ok?: boolean;
      distribution_ok?: boolean;
      feedback_ok?: boolean;
    };
  };
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  title?: string;
  text: string;
  createdAt: string;
  actions?: ("copy" | "post")[];
  kind?: "normal" | "status" | "skeleton";
};

type UserMessage = {
  id: string;
  role: "user";
  text: string;
  createdAt: string;
};

type Message = UserMessage | AssistantMessage;

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  pack: PackKey;
  audience: AudienceKey;
  tone: ToneKey;
  language: LangKey;
  messages: Message[];
  lastOutput?: StudioLiteOutput | null;
  lastPrompt?: string | null;
};

type ScheduleItemType =
  | "best_hook"
  | "hook"
  | "tweet"
  | "thread"
  | "cta"
  | "reply"
  | "debate";

type ScheduleItem = {
  id: string;
  type: ScheduleItemType;
  label: string;
  text: string;
  suggested_at_iso: string;
  channel: "x";
};

type SchedulePlan = {
  schema_version: "schedule_plan_v1";
  generated_at_iso: string;
  timezone: string;
  start_at_iso: string;
  strategy: string;
  items: ScheduleItem[];
};

const GENERATION_COST = 1;

const PACKS: Record<PackKey, { label: string; includes: string[]; desc: string }> = {
  quick: {
    label: "Quick",
    includes: ["10 hooks", "1 thread", "3 tweets", "1 CTA"],
    desc: "Fastest pack",
  },
  growth: {
    label: "Growth",
    includes: ["10 hooks", "2 threads", "5 tweets", "5 replies"],
    desc: "Content + distribution",
  },
  launch: {
    label: "Launch",
    includes: ["10 hooks", "3 launch posts", "5 tweets", "1 CTA"],
    desc: "Conversion-first",
  },
  replies: {
    label: "Replies",
    includes: ["20 replies", "5 quote ideas", "5 debate starters"],
    desc: "Comment amplifier",
  },
};

const STORAGE_KEY = "oneai_studio_lite_sessions_p36_v2";
const CREDITS_KEY = "oneai_studio_lite_credits_v2";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function safeTrim(v: unknown) {
  return String(v ?? "").trim();
}
function makeId() {
  return Math.random().toString(36).slice(2) + "-" + Math.random().toString(36).slice(2);
}
function twitterComposeUrl(text: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text || "")}`;
}
function sortSessions(list: ChatSession[]) {
  return [...list].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
function isAlreadyNumberedThreadLine(s: string) {
  return /^\s*\d+\//.test(safeTrim(s));
}
function buildThreadText(thread?: string[]) {
  const t = (thread || []).map(String).map(safeTrim).filter(Boolean);
  if (!t.length) return "";
  return t
    .map((tweet, idx) => (isAlreadyNumberedThreadLine(tweet) ? tweet : `${idx + 1}/\n${tweet}`.trim()))
    .join("\n\n");
}
function canDirectPostToX(text: string) {
  return safeTrim(text).length > 0 && safeTrim(text).length <= 280;
}
function formatFailedTasks(tasks?: string[]) {
  const arr = (tasks || []).map(safeTrim).filter(Boolean);
  if (!arr.length) return "";
  return arr.slice(0, 4).join(", ");
}

function StudioLiteLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-xl"
      style={{ width: size, height: size }}
    >
      <Image
        src="/icons/icon-512.png"
        alt="Studio Lite"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}

async function copyToClipboard(text: string) {
  const t = text || "";
  if (!t) return false;
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = t;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

function buildSections(out: StudioLiteOutput) {
  const best = out.best_hook || out.hooks?.[0] || "";
  const sections: Array<{ title: string; text: string; actions?: ("copy" | "post")[] }> = [];

  if (out.meta?.source === "fallback" || out.meta?.diagnostics?.used_fallback) {
    const failed = formatFailedTasks(out.meta?.diagnostics?.failed_tasks);
    sections.push({
      title: "Generation Note",
      text: failed ? `Some sections used fallback logic.\nFailed tasks: ${failed}` : `Some sections used fallback logic.`,
      actions: ["copy"],
    });
  }

  if (best) sections.push({ title: "Best Hook", text: best, actions: ["copy", "post"] });

  if (out.hooks?.length) {
    sections.push({
      title: "Hooks",
      text: out.hooks.slice(0, 12).map((h, i) => `${i + 1}. ${h}`).join("\n\n"),
      actions: ["copy"],
    });
  }

  if (out.tweets?.length) {
    sections.push({
      title: "Tweets",
      text: out.tweets.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join("\n\n"),
      actions: ["copy"],
    });
  }

  if (out.thread?.length) {
    const threadText = buildThreadText(out.thread);
    sections.push({
      title: "Thread",
      text: threadText,
      actions: canDirectPostToX(threadText) ? ["copy", "post"] : ["copy"],
    });
  }

  if (out.cta) sections.push({ title: "CTA", text: out.cta, actions: ["copy"] });

  if (out.replies?.length) {
    sections.push({
      title: "Reply Pack",
      text: out.replies.slice(0, 14).map((r, i) => `${i + 1}. ${r}`).join("\n\n"),
      actions: ["copy"],
    });
  }

  if (out.reply_strategy?.length) {
    sections.push({
      title: "Reply Strategy",
      text: out.reply_strategy.slice(0, 8).map((r, i) => `${i + 1}. ${r}`).join("\n\n"),
      actions: ["copy"],
    });
  }

  if (!sections.length) sections.push({ title: "Output", text: "—" });
  return sections;
}

/* =========================
   Prompt Parser
   ========================= */
type ParsedPrefs = Partial<{
  pack: PackKey;
  audience: AudienceKey;
  tone: ToneKey;
  language: LangKey;
  goal: string;
  tags: string[];
}>;

function normalizeText(raw: string) {
  return (raw || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractGoal(text: string) {
  const m =
    text.match(/\bgoal\s*[:=]\s*([^.\n]+)\b/i) ||
    text.match(/目标\s*[:：]\s*([^。\n]+)\b/i);
  return m ? m[1].trim() : "";
}

function detectLanguageFromPrompt(text: string): LangKey | undefined {
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/\bchinese\b|\bzh\b|中文|汉语/i.test(text)) return "zh";
  if (/\benglish\b|\ben\b/i.test(text)) return "en";
  return undefined;
}

function parsePrefsFromPrompt(raw: string): ParsedPrefs {
  const text = normalizeText(raw);
  const out: ParsedPrefs = { tags: [] };

  const packRules: Array<[RegExp, PackKey, string]> = [
    [/\blaunch\s*pack\b|\blaunch\b|\bwaitlist\b|\bearly spots\b|\bopening \d+\b/i, "launch", "launch"],
    [/\bgrowth\s*pack\b|\bgrowth\b|\bdistribution\b|\btraffic\b/i, "growth", "growth"],
    [/\brepl(?:y|ies)\s*pack\b|\brepl(?:y|ies)\b|\bcomment\b|\bquote tweet\b|\bdebate\b/i, "replies", "replies"],
    [/\bquick\s*pack\b|\bquick\b|\bfast\b/i, "quick", "quick"],
  ];
  for (const [re, val, tag] of packRules) {
    if (re.test(text)) {
      out.pack = val;
      out.tags!.push(`pack:${tag}`);
      break;
    }
  }

  const audienceRules: Array<[RegExp, AudienceKey, string]> = [
    [/\bfounders?\b|\bentrepreneurs?\b|\bstartup\b|创业者/i, "founders", "founders"],
    [/\bbuilders?\b|\bindie\b|\bindie hacker\b|构建者|开发者社区/i, "builders", "builders"],
    [/\bweb3\b|\bcrypto\b|\bdefi\b|\bsolana\b|\bnft\b/i, "web3", "web3"],
    [/\bcreators?\b|\bcontent\b|\binfluencer\b|\bkol\b|创作者/i, "creators", "creators"],
    [/\bdevelopers?\b|\bdevs?\b|\bengineers?\b|开发者|程序员/i, "developers", "developers"],
  ];
  for (const [re, val, tag] of audienceRules) {
    if (re.test(text)) {
      out.audience = val;
      out.tags!.push(`aud:${tag}`);
      break;
    }
  }

  const toneRules: Array<[RegExp, ToneKey, string]> = [
    [/\bcontrarian\b|\bhot take\b|\bunpopular opinion\b|\bspicy\b|逆向观点|反常识/i, "contrarian", "contrarian"],
    [/\bfunny\b|\bwitty\b|\bhumor\b|\bmeme\b|搞笑|幽默/i, "funny", "funny"],
    [/\bserious\b|\bdirect\b|\bno fluff\b|严肃|直接/i, "serious", "serious"],
    [/\bcalm\b|\bclear\b|\beducational\b|\bexplain\b|平静|清晰|解释型/i, "calm", "calm"],
  ];
  for (const [re, val, tag] of toneRules) {
    if (re.test(text)) {
      out.tone = val;
      out.tags!.push(`tone:${tag}`);
      break;
    }
  }

  const detectedLang = detectLanguageFromPrompt(text);
  if (detectedLang) {
    out.language = detectedLang;
    out.tags!.push(`lang:${detectedLang}`);
  }

  const goal = extractGoal(text);
  if (goal) {
    out.goal = goal;
    out.tags!.push(`goal:${goal.slice(0, 18)}${goal.length > 18 ? "…" : ""}`);
  }

  return out;
}

/* =========================
   Export / Schedule / Storage
   ========================= */
function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimezoneLabel() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  } catch {
    return "local";
  }
}

function toMarkdown(session: ChatSession) {
  const head = [
    `# OneAI Studio Lite — Export`,
    ``,
    `- Title: ${session.title}`,
    `- Pack: ${session.pack}`,
    `- Audience: ${session.audience}`,
    `- Tone: ${session.tone}`,
    `- Language: ${session.language}`,
    `- Updated: ${new Date(session.updatedAt).toISOString()}`,
    ``,
  ].join("\n");

  const out = session.lastOutput;
  if (!out) return head + "\n_No outputs yet._\n";

  const sections = buildSections(out);
  const body = sections.map((s) => `## ${s.title}\n\n${s.text}\n`).join("\n");
  return head + body;
}

function buildExportSchema({
  session,
  schedulePlan,
}: {
  session: ChatSession;
  schedulePlan?: SchedulePlan | null;
}) {
  return {
    schema_version: "oneai_studio_lite_export_v1",
    generated_at_iso: new Date().toISOString(),
    timezone: getTimezoneLabel(),
    session: {
      id: session.id,
      title: session.title,
      created_at_iso: session.createdAt,
      updated_at_iso: session.updatedAt,
      pinned: !!session.pinned,
    },
    prefs: {
      pack: session.pack,
      audience: session.audience,
      tone: session.tone,
      language: session.language,
    },
    input: {
      prompt_raw: session.lastPrompt || "",
    },
    output: session.lastOutput || null,
    derived: {
      sections: session.lastOutput ? buildSections(session.lastOutput) : [],
      backend_schedule: session.lastOutput?.schedule || null,
      reply_strategy: session.lastOutput?.reply_strategy || [],
      schedule_plan: schedulePlan || null,
    },
  };
}

function setTimeLocal(base: Date, hour: number, minute: number) {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function nextDay(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function contentTypeToScheduleType(v: string): ScheduleItemType {
  const s = safeTrim(v).toLowerCase();
  if (s === "best_hook") return "best_hook";
  if (s === "hook") return "hook";
  if (s === "tweet") return "tweet";
  if (s === "thread") return "thread";
  if (s === "cta") return "cta";
  if (s === "reply") return "reply";
  if (s === "debate") return "debate";
  return "tweet";
}

function scheduleTypeDefaultText(out: StudioLiteOutput, type: ScheduleItemType) {
  if (type === "best_hook") return safeTrim(out.best_hook || out.hooks?.[0] || "");
  if (type === "hook") return safeTrim(out.hooks?.[1] || out.hooks?.[0] || "");
  if (type === "tweet") return safeTrim(out.tweets?.[0] || "");
  if (type === "thread") return safeTrim(buildThreadText(out.thread));
  if (type === "cta") return safeTrim(out.cta || "");
  if (type === "reply" || type === "debate") return safeTrim(out.replies?.[0] || "");
  return "";
}

function buildSchedulePlan(out: StudioLiteOutput, pack: PackKey): SchedulePlan {
  const tz = getTimezoneLabel();
  const now = new Date();

  if (out.schedule?.length) {
    const slotMap: Record<ScheduleItemType, { h: number; m: number }> = {
      best_hook: { h: 9, m: 30 },
      hook: { h: 9, m: 30 },
      tweet: { h: 13, m: 0 },
      thread: { h: 20, m: 30 },
      cta: { h: 20, m: 30 },
      reply: { h: 13, m: 0 },
      debate: { h: 20, m: 30 },
    };

    const items: ScheduleItem[] = out.schedule.slice(0, 12).map((s) => {
      const type = contentTypeToScheduleType(s.content_type);
      const hm = slotMap[type];
      const base = nextDay(now, Number(s.day || 0));
      const at = setTimeLocal(base, hm.h, hm.m);
      const fallbackText = scheduleTypeDefaultText(out, type);

      return {
        id: makeId(),
        type,
        label: safeTrim(s.description) || type,
        text: fallbackText || safeTrim(s.description) || type,
        suggested_at_iso: at.toISOString(),
        channel: "x",
      };
    });

    return {
      schema_version: "schedule_plan_v1",
      generated_at_iso: new Date().toISOString(),
      timezone: tz,
      start_at_iso: now.toISOString(),
      strategy: "Distribution plan generated from backend schedule.",
      items: items.filter((x) => safeTrim(x.text)),
    };
  }

  const slots = [
    { day: 0, h: 9, m: 30, label: "Morning slot" },
    { day: 0, h: 13, m: 0, label: "Midday slot" },
    { day: 0, h: 20, m: 30, label: "Evening slot" },
    { day: 1, h: 9, m: 30, label: "Morning slot" },
    { day: 1, h: 13, m: 0, label: "Midday slot" },
    { day: 1, h: 20, m: 30, label: "Evening slot" },
  ];

  const best = safeTrim(out.best_hook || out.hooks?.[0] || "");
  const hooks = (out.hooks || []).map(safeTrim).filter(Boolean);
  const tweets = (out.tweets || []).map(safeTrim).filter(Boolean);
  const replies = (out.replies || []).map(safeTrim).filter(Boolean);
  const thread = safeTrim(buildThreadText(out.thread));
  const cta = safeTrim(out.cta || "");

  const items: Array<{ type: ScheduleItemType; label: string; text: string }> = [];

  if (best) items.push({ type: "best_hook", label: "Best Hook", text: best });
  if (tweets[0]) items.push({ type: "tweet", label: "Tweet", text: tweets[0] });
  if (thread) items.push({ type: "thread", label: "Thread", text: thread });
  if (hooks[1]) items.push({ type: "hook", label: "Hook", text: hooks[1] });
  if (tweets[1]) items.push({ type: "tweet", label: "Tweet", text: tweets[1] });
  if (cta) items.push({ type: "cta", label: "CTA", text: cta });

  if (pack === "replies") {
    items.length = 0;
    const pick = replies.slice(0, 6);
    for (let i = 0; i < pick.length; i++) {
      items.push({ type: "reply", label: `Reply #${i + 1}`, text: pick[i] });
    }
  } else if (pack === "launch") {
    const reordered: typeof items = [];
    if (best) reordered.push({ type: "best_hook", label: "Best Hook", text: best });
    if (cta) reordered.push({ type: "cta", label: "CTA / Offer", text: cta });
    if (thread) reordered.push({ type: "thread", label: "Thread", text: thread });
    if (tweets[0]) reordered.push({ type: "tweet", label: "Tweet", text: tweets[0] });
    if (hooks[1]) reordered.push({ type: "hook", label: "Hook", text: hooks[1] });
    if (tweets[1]) reordered.push({ type: "tweet", label: "Tweet", text: tweets[1] });
    items.length = 0;
    items.push(...reordered);
  } else if (pack === "growth") {
    if (replies[0]) items.push({ type: "reply", label: "Reply", text: replies[0] });
    if (replies[1]) items.push({ type: "reply", label: "Reply", text: replies[1] });
  }

  const mapped: ScheduleItem[] = items.slice(0, slots.length).map((it, idx) => {
    const slot = slots[idx];
    const d0 = nextDay(now, slot.day);
    const at = setTimeLocal(d0, slot.h, slot.m);
    return {
      id: makeId(),
      type: it.type,
      label: `${it.label} — ${slot.label}`,
      text: it.text,
      suggested_at_iso: at.toISOString(),
      channel: "x",
    };
  });

  const strategy =
    pack === "replies"
      ? "Reply-first: use these in comment sections of large accounts. Aim for 6 high-signal replies across 2 days."
      : pack === "launch"
      ? "Launch cadence: hook → offer/CTA → thread → supporting tweets across 2 days."
      : pack === "growth"
      ? "Growth cadence: hook → tweet → thread → hook/tweet + replies for distribution."
      : "Quick cadence: 2-day mini-cycle to test hooks and one thread.";

  return {
    schema_version: "schedule_plan_v1",
    generated_at_iso: new Date().toISOString(),
    timezone: tz,
    start_at_iso: now.toISOString(),
    strategy,
    items: mapped,
  };
}

function scheduleToText(plan: SchedulePlan) {
  const lines: string[] = [];
  lines.push(`Schedule Plan (${plan.schema_version})`);
  lines.push(`Timezone: ${plan.timezone}`);
  lines.push(`Generated: ${plan.generated_at_iso}`);
  lines.push(`Strategy: ${plan.strategy}`);
  lines.push("");
  for (const it of plan.items) {
    const when = new Date(it.suggested_at_iso).toLocaleString();
    lines.push(`- ${when} — ${it.label}`);
    lines.push(`${it.text}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? sortSessions(parsed as ChatSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortSessions(sessions).slice(0, 120)));
  } catch {}
}

function loadCredits() {
  if (typeof window === "undefined") return 20;

  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    console.log("[Studio Lite] loadCredits raw =", raw);

    if (raw === null || raw === "" || !Number.isFinite(Number(raw))) {
      localStorage.setItem(CREDITS_KEY, "20");
      return 20;
    }

    return Math.max(0, Number(raw));
  } catch (e) {
    console.error("[Studio Lite] loadCredits error:", e);
    return 20;
  }
}

function saveCredits(n: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CREDITS_KEY, String(Math.max(0, n)));
  } catch {}
}

function formatDayGroup(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfThat) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays <= 7) return "Previous 7 days";
  return "Older";
}

/* =========================
   UI
   ========================= */
function CreditsBadge({
  credits,
  compact,
}: {
  credits: number;
  compact?: boolean;
}) {
  const low = credits <= 3 && credits > 0;
  const empty = credits <= 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        empty
          ? "border-red-200 bg-red-50 text-red-700"
          : low
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-black/10 bg-white text-black/75"
      )}
      title={empty ? "No credits left" : `${credits} credits remaining`}
    >
      <span className="text-[11px]">⚡</span>
      <span>
        {credits} {compact ? "credits" : credits === 1 ? "credit" : "credits"}
      </span>
    </div>
  );
}

function CreditsEmptyState({
  onUpgrade,
}: {
  onUpgrade?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="text-sm font-extrabold text-red-700">No credits left</div>
      <div className="mt-1 text-sm text-red-700/80 leading-relaxed">
        Upgrade to continue generating packs with Studio Lite.
      </div>
      <div className="mt-3">
        <button
          onClick={onUpgrade}
          className="rounded-full bg-black px-4 py-2 text-xs font-extrabold text-white hover:bg-neutral-900"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}

function SidebarRow({
  icon,
  label,
  onClick,
  active,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-black/5" : "hover:bg-black/[0.04]"
      )}
      title={collapsed ? label : undefined}
    >
      <span className="h-5 w-5 flex items-center justify-center text-black/70">{icon}</span>
      {collapsed ? null : <span className="text-black/80">{label}</span>}
    </button>
  );
}

function ChatListItem({
  title,
  subtitle,
  active,
  pinned,
  onClick,
  onDelete,
  onPin,
  onRename,
}: {
  title: string;
  subtitle: string;
  active?: boolean;
  pinned?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onRename?: () => void;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left rounded-xl px-3 py-2 transition",
          active ? "bg-black/5" : "hover:bg-black/[0.04]"
        )}
      >
        <div className="flex items-center gap-2">
          {pinned ? <span className="text-[12px]">📌</span> : null}
          <div className="text-sm font-semibold text-black truncate">{title}</div>
        </div>
        <div className="text-xs text-black/50 truncate">{subtitle}</div>
      </button>

      <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
        <button
          onClick={onPin}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-black/55 hover:bg-black/[0.04]"
          title="Pin"
        >
          📌
        </button>
        <button
          onClick={onRename}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-black/55 hover:bg-black/[0.04]"
          title="Rename"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-black/55 hover:bg-black/[0.04]"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function Msg({
  role,
  title,
  text,
  actions,
  kind,
  onCopy,
  onPost,
}: {
  role: "user" | "assistant";
  title?: string;
  text: string;
  actions?: ("copy" | "post")[];
  kind?: "normal" | "status" | "skeleton";
  onCopy?: () => void;
  onPost?: () => void;
}) {
  const isUser = role === "user";
  const isSkeleton = kind === "skeleton";

  return (
    <div className={cn("w-full flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("w-full max-w-[760px]", isUser ? "pl-6 sm:pl-10" : "pr-6 sm:pr-10")}>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-black/55">{isUser ? "You" : "OneAI"}</div>
              {title ? <div className="mt-1 text-sm font-extrabold text-black">{title}</div> : null}
            </div>

            {!isSkeleton && actions?.length ? (
              <div className="flex gap-2 shrink-0">
                {actions.includes("copy") ? (
                  <button
                    onClick={onCopy}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 hover:bg-black/[0.04]"
                  >
                    Copy
                  </button>
                ) : null}
                {actions.includes("post") ? (
                  <button
                    onClick={onPost}
                    className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-900"
                  >
                    Post
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {isSkeleton ? (
            <div className="mt-3 space-y-3">
              <div className="h-4 w-2/3 rounded bg-black/[0.06] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-black/[0.05] animate-pulse" />
              <div className="h-4 w-3/5 rounded bg-black/[0.05] animate-pulse" />
            </div>
          ) : (
            <div className="mt-3 whitespace-pre-wrap text-sm text-black/80 leading-relaxed">{text}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestChip({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/65 hover:bg-black/[0.04] transition"
      title={text}
    >
      {text}
    </button>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="shrink-0 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-black/70">
      {text}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-black/10 bg-white shadow-xl max-h-[88vh] overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <div className="text-sm font-extrabold">{title}</div>
            <button
              onClick={onClose}
              className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/[0.04]"
            >
              ×
            </button>
          </div>
          <div className="max-h-[calc(88vh-56px)] overflow-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65] md:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-white border-r border-black/10 shadow-xl overflow-auto">
        {children}
      </div>
    </div>
  );
}

function ActionMenu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[66] md:hidden">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute right-3 top-14 w-[220px] rounded-2xl border border-black/10 bg-white shadow-xl p-2">
        {children}
      </div>
    </div>
  );
}

function MenuAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl px-3 py-2 text-sm font-semibold",
        disabled ? "opacity-40 pointer-events-none" : "hover:bg-black/[0.04]"
      )}
    >
      {label}
    </button>
  );
}

/* =========================
   Page
   ========================= */
export default function StudioLitePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  const active = useMemo(() => sessions.find((s) => s.id === activeId) || null, [sessions, activeId]);

  const [pack, setPack] = useState<PackKey>("quick");
  const [audience, setAudience] = useState<AudienceKey>("builders");
  const [tone, setTone] = useState<ToneKey>("contrarian");
  const [language, setLanguage] = useState<LangKey>("en");

  const [sidebarTab, setSidebarTab] = useState<"chats" | "search" | "settings">("chats");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const [packsOpen, setPacksOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedulePlan, setSchedulePlan] = useState<SchedulePlan | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creditsLeft, setCreditsLeft] = useState(20);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
  setMounted(true);
}, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState("");

  const listBottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
  if (!mounted) return;

  const initial = loadSessions();
  const credits = loadCredits();

  console.log("[Studio Lite] initial credits =", credits);
  setCreditsLeft(credits);

  if (initial.length) {
    setSessions(initial);
    setActiveId(initial[0].id);
    setPack(initial[0].pack);
    setAudience(initial[0].audience);
    setTone(initial[0].tone);
    setLanguage(initial[0].language);
  } else {
    const now = new Date().toISOString();
    const s: ChatSession = {
      id: makeId(),
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      pack: "quick",
      audience: "builders",
      tone: "contrarian",
      language: "en",
      messages: [
        {
          id: makeId(),
          role: "assistant",
          title: "Hello! 👋",
          text:
            "Describe what you want in one sentence and press Enter.\n\nExamples:\n• Launch pack. Founders. Goal: 100 waitlist. Topic: AI workflows.\n• Reply pack for web3. Goal: get replies on big accounts.\n• 输入中文，我会直接用中文生成内容。\n\nStudio Lite will generate hooks, tweets, threads and replies automatically.",
          createdAt: now,
        },
      ],
      lastOutput: null,
      lastPrompt: null,
    };
    const next = sortSessions([s]);
    setSessions(next);
    setActiveId(s.id);
    saveSessions(next);
  }
}, [mounted]);

  useEffect(() => {
  console.log("[Studio Lite] saveCredits =", creditsLeft);
  saveCredits(creditsLeft);
}, [creditsLeft]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length, isGenerating]);

  function persist(next: ChatSession[]) {
    const sorted = sortSessions(next);
    setSessions(sorted);
    saveSessions(sorted);
  }

  function updateActive(updater: (s: ChatSession) => ChatSession) {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === activeId ? updater(s) : s));
      const sorted = sortSessions(next);
      saveSessions(sorted);
      return sorted;
    });
  }

  function newChat() {
    const now = new Date().toISOString();
    const s: ChatSession = {
      id: makeId(),
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      pack,
      audience,
      tone,
      language,
      messages: [
        {
          id: makeId(),
          role: "assistant",
          title: "Hello! 👋",
          text: 'Try:\n“Launch pack. Founders. Goal: 100 waitlist. Topic: AI workflows.”',
          createdAt: now,
        },
      ],
      lastOutput: null,
      lastPrompt: null,
    };

    setSessions((prev) => {
      const sorted = sortSessions([s, ...prev]);
      saveSessions(sorted);
      return sorted;
    });

    setActiveId(s.id);
    setPrompt("");
    setSidebarTab("chats");
    setToast("New chat");
    setMobileNavOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function selectChat(id: string) {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setActiveId(id);
    setPack(s.pack);
    setAudience(s.audience);
    setTone(s.tone);
    setLanguage(s.language);
    setSidebarTab("chats");
    setSchedulePlan(null);
    setMobileNavOpen(false);
  }

  function deleteChat(id: string) {
    const next = sessions.filter((x) => x.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id || "");
    setToast("Deleted");
  }

  function togglePin(id: string) {
    const next = sessions.map((s) =>
      s.id === id ? { ...s, pinned: !s.pinned, updatedAt: new Date().toISOString() } : s
    );
    persist(next);
    setToast("Updated");
  }

  function openRename(id: string) {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setActiveId(id);
    setRenameValue(s.title || "");
    setRenameOpen(true);
    setMobileNavOpen(false);
  }

  function applyRename() {
    const v = safeTrim(renameValue) || "Untitled";
    const next = sessions.map((s) =>
      s.id === activeId ? { ...s, title: v, updatedAt: new Date().toISOString() } : s
    );
    persist(next);
    setRenameOpen(false);
    setToast("Renamed");
  }

  const parsedLive = useMemo(() => parsePrefsFromPrompt(prompt), [prompt]);

  const canGenerate = useMemo(() => {
    if (isGenerating) return false;
    if (!safeTrim(prompt)) return false;
    if (creditsLeft < GENERATION_COST) return false;
    return true;
  }, [prompt, isGenerating, creditsLeft]);

  async function onCopy(text: string) {
    const ok = await copyToClipboard(text);
    setToast(ok ? "Copied" : "Copy failed");
  }

  async function exportMarkdown() {
    if (!active) return;
    const md = toMarkdown(active);
    downloadFile(`oneai-studio-lite-${active.id}.md`, md, "text/markdown");
    setToast("Exported MD");
    setMobileActionsOpen(false);
  }

  async function exportJsonSchema() {
    if (!active) return;
    const schema = buildExportSchema({ session: active, schedulePlan });
    downloadFile(`oneai-studio-lite-${active.id}.schema.json`, JSON.stringify(schema, null, 2), "application/json");
    setToast("Exported Schema");
    setMobileActionsOpen(false);
  }

  async function exportRawJson() {
    if (!active) return;
    const payload = {
      id: active.id,
      title: active.title,
      pack: active.pack,
      audience: active.audience,
      tone: active.tone,
      language: active.language,
      updatedAt: active.updatedAt,
      prompt: active.lastPrompt,
      output: active.lastOutput,
    };
    downloadFile(`oneai-studio-lite-${active.id}.json`, JSON.stringify(payload, null, 2), "application/json");
    setToast("Exported JSON");
    setMobileActionsOpen(false);
  }

  async function copyAll() {
    if (!active?.lastOutput) return setToast("No outputs");
    const sections = buildSections(active.lastOutput);
    const text = sections.map((s) => `${s.title}\n${s.text}`).join("\n\n---\n\n");
    const ok = await copyToClipboard(text);
    setToast(ok ? "Copied All" : "Copy failed");
    setMobileActionsOpen(false);
  }

  function openSchedulePlan() {
    if (!active?.lastOutput) return setToast("No outputs");
    const plan = buildSchedulePlan(active.lastOutput, active.pack);
    setSchedulePlan(plan);
    setScheduleOpen(true);
    setToast("Schedule ready");
    setMobileActionsOpen(false);
  }

  async function copySchedule() {
    if (!schedulePlan) return setToast("No schedule");
    const ok = await copyToClipboard(scheduleToText(schedulePlan));
    setToast(ok ? "Copied Schedule" : "Copy failed");
  }

  async function exportScheduleJson() {
    if (!schedulePlan) return setToast("No schedule");
    downloadFile(`oneai-schedule-${active?.id || "chat"}.json`, JSON.stringify(schedulePlan, null, 2), "application/json");
    setToast("Exported Schedule");
  }

  function onKeyDownComposer(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canGenerate) onGenerate();
    }
  }

  const groupedChats = useMemo(() => {
    const filtered = sessions.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.messages.some((m) => m.text.toLowerCase().includes(q));
    });

    const pinned = filtered.filter((s) => s.pinned);
    const rest = filtered.filter((s) => !s.pinned);

    const groups: Record<string, ChatSession[]> = { Today: [], "Previous 7 days": [], Older: [] };
    for (const s of rest) {
      const g = formatDayGroup(s.updatedAt || s.createdAt);
      groups[g] = groups[g] || [];
      groups[g].push(s);
    }

    return { pinned, groups };
  }, [sessions, searchQuery]);

  const packLine = `${PACKS[pack].label} • ${PACKS[pack].includes.join(" · ")}`;

  const suggestions = useMemo(
    () => [
      `Launch pack. Founders. Goal: 100 waitlist. Topic: AI workflows.`,
      `Reply pack for web3. Funny. Goal: get replies on big accounts.`,
      `Growth pack for builders. Calm. Topic: workflows beat prompts.`,
      `Quick pack. English. Hot take: SaaS tools are dying. Workflows replace them.`,
      `Quick pack. 创业者. 逆向观点. 主题：大多数AI产品其实只是包装好的API。`,
    ],
    []
  );

  async function onGenerate() {
    const raw = safeTrim(prompt);
    if (!raw) return setToast("Enter a prompt");
    if (!active) return;
    if (creditsLeft < GENERATION_COST) return setToast("No credits left");

    const parsed = parsePrefsFromPrompt(raw);
    const effectivePack = parsed.pack ?? pack;
    const effectiveAudience = parsed.audience ?? audience;
    const effectiveTone = parsed.tone ?? tone;
    const effectiveLanguage = parsed.language ?? language;
    const now = new Date().toISOString();

    setPack(effectivePack);
    setAudience(effectiveAudience);
    setTone(effectiveTone);
    setLanguage(effectiveLanguage);

    updateActive((s) => {
      const title = raw.length > 36 ? raw.slice(0, 36) + "…" : raw;
      const nextTitle = s.title === "New chat" ? title : s.title;

      return {
        ...s,
        title: nextTitle,
        updatedAt: now,
        pack: effectivePack,
        audience: effectiveAudience,
        tone: effectiveTone,
        language: effectiveLanguage,
        lastPrompt: raw,
        lastOutput: null,
        messages: [
          ...s.messages,
          { id: makeId(), role: "user", text: raw, createdAt: now },
          { id: makeId(), role: "assistant", title: "Generating…", text: "", createdAt: now, kind: "skeleton" },
          { id: makeId(), role: "assistant", title: "Validating…", text: "", createdAt: now, kind: "skeleton" },
        ],
      };
    });

    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "studio_lite_pack",
          input: {
            instruction: raw,
            pack: effectivePack,
            audience: effectiveAudience,
            tone: effectiveTone,
            language: effectiveLanguage,
            goal: parsed.goal || undefined,
          },
          options: {
            templateVersion: 12,
            maxAttempts: 3,
          },
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const rawText = await res.text();

      if (!ct.includes("application/json")) {
        throw new Error(`API returned non-JSON (${res.status}). ${rawText.slice(0, 200)}`);
      }

      const json = rawText ? JSON.parse(rawText) : null;

      if (!res.ok || json?.success === false) {
        const msg = json?.error || json?.message || `Request failed (${res.status})`;
        const details = json?.details ? `\n${JSON.stringify(json.details, null, 2)}` : "";
        throw new Error(`${msg}${details}`);
      }

      const out = (json.data || {}) as StudioLiteOutput;
      const sections = buildSections(out);

      updateActive((s) => {
        const withoutSkeleton = s.messages.filter(
          (m) => !(m.role === "assistant" && (m as AssistantMessage).kind === "skeleton")
        );

        return {
          ...s,
          updatedAt: new Date().toISOString(),
          pack: effectivePack,
          audience: effectiveAudience,
          tone: effectiveTone,
          language: effectiveLanguage,
          lastOutput: out,
          messages: [
            ...withoutSkeleton,
            ...sections.map((sec) => ({
              id: makeId(),
              role: "assistant" as const,
              title: sec.title,
              text: sec.text,
              actions: sec.actions,
              createdAt: new Date().toISOString(),
              kind: "normal" as const,
            })),
          ],
        };
      });

      setSchedulePlan(null);
      setCreditsLeft((x) => Math.max(0, x - GENERATION_COST));
      setToast("Generated ✅");
      setPrompt("");
    } catch (e: any) {
      updateActive((s) => {
        const withoutSkeleton = s.messages.filter(
          (m) => !(m.role === "assistant" && (m as AssistantMessage).kind === "skeleton")
        );

        return {
          ...s,
          updatedAt: new Date().toISOString(),
          messages: [
            ...withoutSkeleton,
            {
              id: makeId(),
              role: "assistant",
              title: "Error",
              text: `Failed to generate.\n${e?.message || "Unknown error"}`,
              createdAt: new Date().toISOString(),
              kind: "normal",
            },
          ],
        };
      });
      setToast("Error");
    } finally {
      setIsGenerating(false);
    }
  }

  function selectPackFromDrawer(k: PackKey) {
    setPack(k);
    setPacksOpen(false);
    setToast(`Pack: ${PACKS[k].label}`);
    setMobileNavOpen(false);
  }

  const DesktopSidebar = (
    <>
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StudioLiteLogo size={32} />
          {sidebarCollapsed ? null : (
            <div className="leading-tight">
              <div className="text-sm font-extrabold">Studio Lite</div>
              <div className="text-xs text-black/50">Growth OS</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="hidden md:inline-flex rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/[0.04]"
          title="Collapse"
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>
      </div>

      <div className="px-3 pb-3">
        <Button className={cn("w-full rounded-xl bg-black text-white hover:bg-neutral-900", sidebarCollapsed && "px-0")} onClick={newChat}>
          {sidebarCollapsed ? "+" : "+ New chat"}
        </Button>
      </div>

      <div className="px-2 space-y-1">
        <SidebarRow icon={<span>🗂️</span>} label="Chats" active={sidebarTab === "chats"} onClick={() => setSidebarTab("chats")} collapsed={sidebarCollapsed} />
        <SidebarRow icon={<span>🔎</span>} label="Search" active={sidebarTab === "search"} onClick={() => setSidebarTab("search")} collapsed={sidebarCollapsed} />
        <SidebarRow icon={<span>⚡</span>} label="Packs" active={false} onClick={() => setPacksOpen(true)} collapsed={sidebarCollapsed} />
        <SidebarRow icon={<span>⚙️</span>} label="Settings" active={sidebarTab === "settings"} onClick={() => setSidebarTab("settings")} collapsed={sidebarCollapsed} />
      </div>

      <div className="flex-1 overflow-auto px-3 py-3">
        {sidebarCollapsed ? null : (
          <>
            {sidebarTab === "chats" && (
              <>
                <div className="text-xs font-semibold text-black/55 mb-2">History</div>

                {groupedChats.pinned.length ? (
                  <div className="mb-4">
                    <div className="px-1 pb-1 text-[11px] font-semibold text-black/40">Pinned</div>
                    <div className="space-y-1">
                      {groupedChats.pinned.map((s) => (
                        <ChatListItem
                          key={s.id}
                          title={s.title}
                          subtitle={`${PACKS[s.pack]?.label || "Quick"} • ${new Date(s.updatedAt).toLocaleDateString()}`}
                          active={s.id === activeId}
                          pinned={!!s.pinned}
                          onClick={() => selectChat(s.id)}
                          onDelete={() => deleteChat(s.id)}
                          onPin={() => togglePin(s.id)}
                          onRename={() => openRename(s.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {(["Today", "Previous 7 days", "Older"] as const).map((g) =>
                    groupedChats.groups[g]?.length ? (
                      <div key={g}>
                        <div className="px-1 pb-1 text-[11px] font-semibold text-black/40">{g}</div>
                        <div className="space-y-1">
                          {groupedChats.groups[g].map((s) => (
                            <ChatListItem
                              key={s.id}
                              title={s.title}
                              subtitle={`${PACKS[s.pack]?.label || "Quick"} • ${new Date(s.updatedAt).toLocaleDateString()}`}
                              active={s.id === activeId}
                              pinned={!!s.pinned}
                              onClick={() => selectChat(s.id)}
                              onDelete={() => deleteChat(s.id)}
                              onPin={() => togglePin(s.id)}
                              onRename={() => openRename(s.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </>
            )}

            {sidebarTab === "search" && (
              <>
                <div className="text-xs font-semibold text-black/55 mb-2">Search chats</div>
                <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title or messages…"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                  />
                </div>
                <div className="mt-3 text-xs text-black/45">Tip: keywords like “launch”, “thread”, “replies”.</div>
              </>
            )}

            {sidebarTab === "settings" && (
              <>
                <div className="text-xs font-semibold text-black/55 mb-2">Preferences</div>

                <div className="space-y-2">
                  <Select value={audience} onChange={(e) => setAudience((e.target as HTMLSelectElement).value as AudienceKey)} className="bg-white">
                    <option value="founders">Audience: Founders</option>
                    <option value="builders">Audience: Builders</option>
                    <option value="web3">Audience: Web3</option>
                    <option value="creators">Audience: Creators</option>
                    <option value="developers">Audience: Developers</option>
                  </Select>

                  <Select value={tone} onChange={(e) => setTone((e.target as HTMLSelectElement).value as ToneKey)} className="bg-white">
                    <option value="contrarian">Tone: Contrarian</option>
                    <option value="calm">Tone: Calm</option>
                    <option value="funny">Tone: Funny</option>
                    <option value="serious">Tone: Serious</option>
                  </Select>

                  <Select value={language} onChange={(e) => setLanguage((e.target as HTMLSelectElement).value as LangKey)} className="bg-white">
                    <option value="en">Language: English</option>
                    <option value="zh">Language: 中文</option>
                  </Select>
                </div>

                <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                  <div className="text-xs font-semibold text-black/55">Credits</div>

                  <div className="mt-2">
                    <CreditsBadge credits={creditsLeft} />
                  </div>

                  <div className="mt-3 text-xs text-black/50 leading-relaxed">
                    Each generation costs {GENERATION_COST} credit.
                  </div>

                  <div className="mt-2">
                    <Button
                      className="w-full rounded-xl bg-black text-white hover:bg-neutral-900"
                      onClick={() => setToast("Upgrade flow here")}
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="border-t border-black/10 p-3">
        <div className={cn("flex items-center justify-between", sidebarCollapsed && "justify-center")}>
          {sidebarCollapsed ? null : <div className="text-xs text-black/50">{packLine}</div>}
          {sidebarCollapsed ? null : (
            <button
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/60 hover:bg-black/[0.04]"
              onClick={() => setToast("Account menu")}
            >
              Account
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-[#F7F7F8] text-black">
      <div className="flex h-full">
        <aside
          className={cn(
            "hidden md:flex shrink-0 flex-col border-r border-black/10 bg-white",
            sidebarCollapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          {DesktopSidebar}
        </aside>

        <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <div className="flex h-full flex-col">{DesktopSidebar}</div>
        </MobileDrawer>

        <section className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-black/10 bg-white/90 backdrop-blur sticky top-0 z-30">
            <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  className="md:hidden h-9 w-9 rounded-full border border-black/10 bg-white text-sm font-semibold"
                  onClick={() => setMobileNavOpen(true)}
                  title="Menu"
                >
                  ☰
                </button>

                <StudioLiteLogo size={32} />
                <div className="leading-tight min-w-0">
                  <div className="text-sm font-extrabold truncate">OneAI Studio Lite</div>
                  <div className="text-xs text-black/55 truncate">AI Twitter Growth OS</div>
                </div>

                <span className="hidden lg:inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-semibold text-black/70">
                  {packLine}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <CreditsBadge credits={creditsLeft} />

                <button
                  className={cn(
                    "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]",
                    !active?.lastOutput && "opacity-40 pointer-events-none"
                  )}
                  onClick={copyAll}
                >
                  Copy all
                </button>
                <button
                  className={cn(
                    "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]",
                    !active?.lastOutput && "opacity-40 pointer-events-none"
                  )}
                  onClick={exportMarkdown}
                >
                  Export MD
                </button>
                <button
                  className={cn(
                    "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]",
                    !active?.lastOutput && "opacity-40 pointer-events-none"
                  )}
                  onClick={exportRawJson}
                >
                  Export JSON
                </button>
                <button
                  className={cn(
                    "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]",
                    !active?.lastOutput && "opacity-40 pointer-events-none"
                  )}
                  onClick={exportJsonSchema}
                >
                  Export Schema
                </button>
                <button
                  className={cn(
                    "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]",
                    !active?.lastOutput && "opacity-40 pointer-events-none"
                  )}
                  onClick={openSchedulePlan}
                >
                  Schedule
                </button>
                <Button className="rounded-full bg-black text-white hover:bg-neutral-900" onClick={() => setToast("Upgrade flow here")}>
                  Upgrade
                </Button>
              </div>

              <div className="md:hidden flex items-center gap-2">
                <CreditsBadge credits={creditsLeft} compact />

                <button
                  className="h-9 w-9 rounded-full border border-black/10 bg-white text-sm font-semibold"
                  onClick={() => setMobileActionsOpen((v) => !v)}
                  title="More"
                >
                  ⋯
                </button>
                <Button className="rounded-full bg-black text-white hover:bg-neutral-900 px-4" onClick={() => setToast("Upgrade flow here")}>
                  Upgrade
                </Button>
              </div>
            </div>
          </div>

          <ActionMenu open={mobileActionsOpen} onClose={() => setMobileActionsOpen(false)}>
            <MenuAction label="Copy all" onClick={copyAll} disabled={!active?.lastOutput} />
            <MenuAction label="Export MD" onClick={exportMarkdown} disabled={!active?.lastOutput} />
            <MenuAction label="Export JSON" onClick={exportRawJson} disabled={!active?.lastOutput} />
            <MenuAction label="Export Schema" onClick={exportJsonSchema} disabled={!active?.lastOutput} />
            <MenuAction label="Schedule" onClick={openSchedulePlan} disabled={!active?.lastOutput} />
            <MenuAction label="Choose pack" onClick={() => { setMobileActionsOpen(false); setPacksOpen(true); }} />
          </ActionMenu>

          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-6 space-y-5">
              <div className="pt-1 pb-1">
  <div className="text-2xl md:text-3xl font-extrabold tracking-tight">What do you want to create?</div>
  <div className="mt-2 text-sm text-black/55">
    Default output is English. Chinese input will reply in Chinese.
  </div>

  <div className="mt-2 space-y-1 text-xs font-semibold text-red-500">
  <div>BUILD: studio-lite-credits-debug-01</div>
  <div>creditsLeft: {creditsLeft}</div>
  <div>ls: {mounted ? String(localStorage.getItem(CREDITS_KEY)) : "…"}</div>
  </div>
</div>

              {creditsLeft <= 0 ? (
                <CreditsEmptyState onUpgrade={() => setToast("Upgrade flow here")} />
              ) : null}

              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-2 w-max min-w-full">
                  {suggestions.map((s) => (
                    <SuggestChip
                      key={s}
                      text={s}
                      onClick={() => {
                        setPrompt(s);
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }}
                    />
                  ))}
                </div>
              </div>

              {active?.messages?.map((m) => {
                if (m.role === "user") return <Msg key={m.id} role="user" text={m.text} />;
                const am = m as AssistantMessage;
                const bestForPost = canDirectPostToX(am.text) ? am.text : "";
                return (
                  <Msg
                    key={m.id}
                    role="assistant"
                    title={am.title}
                    text={am.text}
                    actions={am.actions}
                    kind={am.kind}
                    onCopy={() => onCopy(am.text)}
                    onPost={bestForPost ? () => window.open(twitterComposeUrl(bestForPost), "_blank") : undefined}
                  />
                );
              })}

              <div ref={listBottomRef} className="h-2" />
            </div>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-black/10 bg-white/95 backdrop-blur pb-[max(env(safe-area-inset-bottom),0px)]">
            <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 sm:py-4">
              {toast ? (
                <div className="mb-3 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-black/70">{toast}</div>
              ) : null}

              <div className="rounded-[22px] border border-black/10 bg-white shadow-sm">
                <div className="px-4 pt-4">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={onKeyDownComposer}
                    placeholder='Message OneAI… (Enter to send, Shift+Enter for newline)'
                    className="min-h-[84px] max-h-[220px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-black/35"
                  />
                </div>

                <div className="flex flex-col gap-2 border-t border-black/10 px-4 py-3">
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 w-max min-w-full pb-1">
                      {parsedLive.tags?.length ? (
                        parsedLive.tags.slice(0, 8).map((t) => <Tag key={t} text={t} />)
                      ) : (
                        <>
                          <Tag text={`pack:${pack}`} />
                          <Tag text={`aud:${audience}`} />
                          <Tag text={`tone:${tone}`} />
                          <Tag text={`lang:${language}`} />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-black/45">
                    <div>Each generation costs {GENERATION_COST} credit.</div>
                    <div>{creditsLeft} credits remaining</div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                      <button
                        onClick={() => setToast("Upload (stub)")}
                        className="h-9 w-9 shrink-0 rounded-full border border-black/10 bg-white text-black/60 hover:bg-black/[0.04] transition"
                        title="Upload"
                      >
                        +
                      </button>

                      <button
                        onClick={() => setPacksOpen(true)}
                        className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-black/70 hover:bg-black/[0.04] shrink-0"
                        title="Choose pack"
                      >
                        {PACKS[pack].label}
                      </button>

                      <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-black/70 shrink-0">
                        {creditsLeft} credits
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setToast("Model (stub)")}
                        className="hidden sm:inline-flex rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-black/70 hover:bg-black/[0.04]"
                        title="Model"
                      >
                        Studio Lite
                      </button>

                      <button
                        disabled={!canGenerate}
                        onClick={onGenerate}
                        className={cn(
                          "inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-extrabold transition shadow-sm",
                          canGenerate
                            ? "bg-black text-white hover:bg-neutral-900"
                            : "bg-black/10 text-black/30"
                        )}
                        title={`Generate · ${GENERATION_COST} credit`}
                      >
                        Generate · {GENERATION_COST}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center text-[11px] text-black/45">
                P3.7: credits UI + launch-ready generation flow.
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal open={packsOpen} title="Choose a pack" onClose={() => setPacksOpen(false)}>
        <div className="grid gap-2">
          {(["quick", "growth", "launch", "replies"] as PackKey[]).map((k) => {
            const isActive = pack === k;
            return (
              <button
                key={k}
                onClick={() => selectPackFromDrawer(k)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition",
                  isActive ? "border-black/20 bg-black text-white" : "border-black/10 bg-white hover:bg-black/[0.04]"
                )}
              >
                <div className={cn("text-sm font-extrabold", isActive ? "text-white" : "text-black")}>{PACKS[k].label}</div>
                <div className={cn("text-xs mt-1", isActive ? "text-white/70" : "text-black/55")}>{PACKS[k].desc}</div>
                <div className={cn("text-[11px] mt-2", isActive ? "text-white/60" : "text-black/45")}>
                  {PACKS[k].includes.join(" · ")}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-xs text-black/60">
          Tip: type it inline — <span className="font-semibold">“Launch pack. Founders. Goal: 100 waitlist…”</span>
        </div>
      </Modal>

      <Modal open={scheduleOpen} title="Schedule plan" onClose={() => setScheduleOpen(false)}>
        {!schedulePlan ? (
          <div className="text-sm text-black/60">No schedule generated yet.</div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3">
              <div className="text-xs font-semibold text-black/60">Strategy</div>
              <div className="mt-1 text-sm text-black/80">{schedulePlan.strategy}</div>
              <div className="mt-2 text-xs text-black/50">
                Timezone: {schedulePlan.timezone} • Generated: {new Date(schedulePlan.generated_at_iso).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              {schedulePlan.items.map((it) => (
                <div key={it.id} className="rounded-2xl border border-black/10 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-black/55">{new Date(it.suggested_at_iso).toLocaleString()}</div>
                      <div className="text-sm font-extrabold">{it.label}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 hover:bg-black/[0.04]"
                        onClick={() => copyToClipboard(it.text).then((ok) => setToast(ok ? "Copied" : "Copy failed"))}
                      >
                        Copy
                      </button>
                      <button
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          canDirectPostToX(it.text)
                            ? "bg-black text-white hover:bg-neutral-900"
                            : "border border-black/10 bg-white text-black/60"
                        )}
                        onClick={() => {
                          if (canDirectPostToX(it.text)) {
                            window.open(twitterComposeUrl(it.text), "_blank");
                          } else {
                            copyToClipboard(it.text).then((ok) => setToast(ok ? "Copied long post" : "Copy failed"));
                          }
                        }}
                      >
                        {canDirectPostToX(it.text) ? "Post" : "Copy long"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-black/80 break-words">{it.text}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                onClick={copySchedule}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]"
              >
                Copy schedule text
              </button>
              <button
                onClick={exportScheduleJson}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]"
              >
                Export schedule JSON
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={renameOpen} title="Rename chat" onClose={() => setRenameOpen(false)}>
        <div className="space-y-3">
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter a title…"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRenameOpen(false)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/[0.04]"
            >
              Cancel
            </button>
            <button onClick={applyRename} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-900">
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}