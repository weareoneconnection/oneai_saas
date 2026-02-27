// src/core/workflows/waocChatWorkflow.ts
import { runTask } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocChatValidator } from "../validators/waocChatValidator.js";
import { registerWorkflow } from "./registry.js";

// ✅ Constraints layer (your standalone file)
import {
  checkWaocChatConstraints,
  type WaocChatData,
} from "../constraints/waocChatConstraints.js";

/* =========================
   Types
========================= */

export type WaocChatInput = {
  message: string;
  context?: "community" | "mission" | "philosophy" | "general";
  lang?: "en" | "zh";

  /**
   * ✅ L9: emotion is handled by LLM (bot may pass hint)
   */
  emotionHint?:
    | "greeting_morning"
    | "greeting_night"
    | "stress"
    | "anger"
    | "celebrate"
    | "gratitude"
    | "apology"
    | null;
};

type WaocChatCtx = WorkflowContext<WaocChatInput, WaocChatData> & {
  templateVersion: number;
};

/* =========================
   Helpers
========================= */

function norm(s: any) {
  return String(s ?? "").trim();
}
function lower(s: any) {
  return norm(s).toLowerCase();
}
function env(name: string) {
  const v = process.env[name];
  return v ? String(v).trim() : "";
}
function nonEmptyList(xs: Array<string | false | null | undefined>) {
  return xs.map((x) => String(x || "").trim()).filter(Boolean);
}

/** Basic intent signals (used only for safe fallback, not for routing) */
function looksLikeMeaningQuestion(msgLower: string) {
  return /waoc.*meaning|what.*waoc|stands for|acronym|全称|什么意思|含义|缩写|代表什么/.test(
    msgLower
  );
}
function looksLikeCAQuestion(msgLower: string) {
  return (
    /\bca\b/.test(msgLower) ||
    msgLower.includes("contract") ||
    msgLower.includes("address") ||
    msgLower.includes("合约") ||
    msgLower.includes("地址")
  );
}
function looksLikeNewsQuestion(msgLower: string) {
  return (
    msgLower.includes("news") ||
    msgLower.includes("update") ||
    msgLower.includes("what's new") ||
    msgLower.includes("最新") ||
    msgLower.includes("有什么消息") ||
    msgLower.includes("进展")
  );
}

/* =========================
   Deterministic Quick Replies (FACTUAL ONLY)
   - Keeps the bot stable for factual entry points
   - GM/GN removed: emotion handled by LLM
========================= */

function quickAutoReply(args: {
  raw: string;
  msg: string; // already lowercased
  lang: "en" | "zh";
}): WaocChatData | null {
  const { raw, msg, lang } = args;

  const WEBSITE_URL = env("WEBSITE_URL") || env("WAOC_SITE_URL");
  const X_URL = env("X_URL");
  const TG_URL = env("TG_URL") || env("WAOC_COMMUNITY_URL");
  const ONE_MISSION_URL = env("ONE_MISSION_URL");
  const ONE_FIELD_URL = env("ONE_FIELD_URL");
  const MEDITATION_URL = env("MEDITATION_URL");

  const WAOC_CA_SOL = env("WAOC_CA_SOL");
  const WAOC_CA_BSC = env("WAOC_CA_BSC");

  const links = nonEmptyList([
    WEBSITE_URL && `Website: ${WEBSITE_URL}`,
    X_URL && `X: ${X_URL}`,
    TG_URL && `Telegram: ${TG_URL}`,
    ONE_MISSION_URL && `One Mission: ${ONE_MISSION_URL}`,
    ONE_FIELD_URL && `One Field: ${ONE_FIELD_URL}`,
    MEDITATION_URL && `Meditation: ${MEDITATION_URL}`,
  ]);

  const suggestedAction = links.length ? links.join(" | ") : undefined;
  // --- WAOC meaning / stands for (deterministic, NEVER let LLM improvise) ---
const asksMeaning =
  /waoc.*meaning|what.*waoc|stands for|acronym|全称|什么意思|含义|缩写|代表什么/.test(msg);

if (asksMeaning) {
  if (lang === "zh") {
    return {
      reply:
        "WAOC = We Are One Connection。\n" +
        "WAOC 是面向长期协作的协调层：身份、贡献、证明，以及可落地的应用入口（如 One Mission / One Field）。\n\n" +
        "官方入口：\n" +
        (links.length ? links.map((x) => `- ${x}`).join("\n") : "（暂未配置官方链接）"),
      suggestedAction,
    };
  }
  return {
    reply:
      "WAOC = We Are One Connection.\n" +
      "WAOC is a long-term coordination layer for builders: identity, contribution, proofs, and practical applications (e.g., One Mission / One Field).\n\n" +
      "Official entry points:\n" +
      (links.length ? links.map((x) => `- ${x}`).join("\n") : "(official links not configured yet)"),
    suggestedAction,
  };
}
  // --- Website / Links ---
  const asksLinks =
    msg === "website" ||
    msg === "site" ||
    msg === "links" ||
    msg.includes("website") ||
    msg.includes("官网") ||
    msg.includes("链接") ||
    msg.includes("site");

  if (asksLinks) {
    return {
      reply:
        lang === "zh"
          ? "WAOC 官方入口在这里（选你需要的）：\n" +
            (links.length
              ? links.map((x) => `- ${x}`).join("\n")
              : "（暂未配置链接环境变量）")
          : "WAOC official entry points (pick what you need):\n" +
            (links.length
              ? links.map((x) => `- ${x}`).join("\n")
              : "(links not configured on server env yet)"),
      suggestedAction,
    };
  }

  // --- CA / Contract Address ---
  const asksCA = looksLikeCAQuestion(msg) || msg === "ca" || msg.includes("ca ");

  if (asksCA) {
    const hasSol = Boolean(WAOC_CA_SOL);
    const hasBsc = Boolean(WAOC_CA_BSC);

    if (lang === "zh") {
      if (hasSol || hasBsc) {
        const lines: string[] = [];
        if (hasSol) lines.push(`Solana CA: ${WAOC_CA_SOL}`);
        if (hasBsc) lines.push(`BSC CA: ${WAOC_CA_BSC}`);
        return {
          reply:
            "WAOC 合约地址（官方配置）：\n" +
            lines.map((x) => `- ${x}`).join("\n") +
            "\n\n⚠️ 只以官方渠道为准，别信私聊。",
          suggestedAction,
        };
      }
      return {
        reply:
          "你问的是 WAOC 的 CA（合约地址）对吗？我这边没有在系统里配置 CA，所以不会乱写。\n" +
          "请到官网/置顶消息/官方频道核对后再操作。",
        suggestedAction,
      };
    }

    if (hasSol || hasBsc) {
      const lines: string[] = [];
      if (hasSol) lines.push(`Solana CA: ${WAOC_CA_SOL}`);
      if (hasBsc) lines.push(`BSC CA: ${WAOC_CA_BSC}`);
      return {
        reply:
          "WAOC contract address (officially configured):\n" +
          lines.map((x) => `- ${x}`).join("\n") +
          "\n\n⚠️ Only trust official channels—ignore DMs.",
        suggestedAction,
      };
    }

    return {
      reply:
        "Are you asking for WAOC CA (contract address)? I don’t have a configured CA here, so I won’t guess.\n" +
        "Please verify via official links / pinned message.",
      suggestedAction,
    };
  }

  // --- One Mission / leaderboard ---
  const asksMission =
    msg.includes("one mission") ||
    msg === "mission" ||
    msg.includes("leaderboard") ||
    msg.includes("rank") ||
    msg.includes("排行榜") ||
    msg.includes("任务") ||
    msg.includes("积分");

  if (asksMission) {
    return {
      reply:
        lang === "zh"
          ? "One Mission 是 WAOC 的贡献引擎：完成任务 → 记分 → 上榜。\n" +
            (ONE_MISSION_URL
              ? `入口：${ONE_MISSION_URL}`
              : "（One Mission 链接未配置）")
          : "One Mission is WAOC’s contribution engine: complete tasks → earn points → climb the leaderboard.\n" +
            (ONE_MISSION_URL
              ? `Entry: ${ONE_MISSION_URL}`
              : "(One Mission link not configured)"),
      suggestedAction,
    };
  }

  // --- help (very short triggers) ---
  if (raw.length <= 14) {
    if (lang === "zh" && (msg === "help" || msg === "帮助")) {
      return {
        reply:
          "我能帮你：解释 WAOC / One Mission / 排行榜、发公告草稿、做投票、写推文、梳理增长策略。",
        suggestedAction,
      };
    }
    if (lang === "en" && msg === "help") {
      return {
        reply:
          "I can help explain WAOC/One Mission/leaderboards, draft announcements, polls, tweets, and growth strategy.",
        suggestedAction,
      };
    }
  }

  return null;
}

/* =========================
   L9: Constraint Guard (never crash the workflow)
   - If constraints fail, replace with a safe fallback reply that ALWAYS passes
   - This is the “one-time solve” so you don’t keep patching per incident
========================= */

function applyConstraintsOrFallback(args: {
  data: WaocChatData;
  input: WaocChatInput;
}): { ok: true; data: WaocChatData } {
  const data = args.data || { reply: "" };
  const input = args.input || ({} as any);

  const check = checkWaocChatConstraints(data);
  if (check.ok) return { ok: true, data };

  const raw = norm(input.message);
  const msgLower = lower(raw);
  const lang: "en" | "zh" = input.lang === "zh" ? "zh" : "en";
  const replyLower = (data.reply || "").toLowerCase();
const hasBadExpansion =
  replyLower.includes("web of all communities") ||
  replyLower.includes("web of autonomous") ||
  replyLower.includes("autonomous communities") ||
  replyLower.includes("we are one community") ||
  replyLower.includes("one community");

if (hasBadExpansion) {
  const lang: "en" | "zh" = input.lang === "zh" ? "zh" : "en";
  const website = env("WEBSITE_URL") || env("WAOC_SITE_URL");
  const tg = env("TG_URL") || env("WAOC_COMMUNITY_URL");
  const oneMission = env("ONE_MISSION_URL");

  return {
    ok: true,
    data:
      lang === "zh"
        ? {
            reply:
              "WAOC = We Are One Connection。\n" +
              "WAOC 是面向长期协作的协调层：身份、贡献、证明，以及可落地的应用入口（如 One Mission / One Field）。\n" +
              (website || tg || oneMission
                ? `\n官方入口：${[website && `Website: ${website}`, tg && `Telegram: ${tg}`, oneMission && `One Mission: ${oneMission}`]
                    .filter(Boolean)
                    .join(" | ")}`
                : ""),
          }
        : {
            reply:
              "WAOC = We Are One Connection.\n" +
              "WAOC is a long-term coordination layer for builders: identity, contribution, proofs, and practical applications.\n" +
              (website || tg || oneMission
                ? `\nOfficial: ${[website && `Website: ${website}`, tg && `Telegram: ${tg}`, oneMission && `One Mission: ${oneMission}`]
                    .filter(Boolean)
                    .join(" | ")}`
                : ""),
          },
  };
}
  // --- Meaning question MUST be hard-fixed ---
  if (looksLikeMeaningQuestion(msgLower)) {
    const fixed: WaocChatData =
      lang === "zh"
        ? {
            reply:
              "WAOC = We Are One Connection。\n" +
              "它是一套面向长期协作的协调层：身份、贡献、证明，以及可落地的应用入口（如 One Mission / One Field 等）。",
          }
        : {
            reply:
              "WAOC = We Are One Connection.\n" +
              "It’s a long-term coordination layer for identity, contribution, proofs, and practical apps (e.g., One Mission / One Field).",
          };

    // Ensure passes
    const c2 = checkWaocChatConstraints(fixed);
    if (c2.ok) return { ok: true, data: fixed };
  }

  // --- News/update questions: no PR fluff, give path ---
  if (looksLikeNewsQuestion(msgLower)) {
    const fixed: WaocChatData =
      lang === "zh"
        ? {
            reply:
              "我这边不做“实时新闻/进展”的猜测，也不会编。\n" +
              "最稳的是看置顶消息 + 官方频道/官网更新；如果你想要社区内的当日摘要，可以用 /report。",
          }
        : {
            reply:
              "I can’t verify real-time news here and I won’t guess.\n" +
              "Best path: pinned message + official channels/website updates. For an in-community daily snapshot, use /report.",
          };

    const c2 = checkWaocChatConstraints(fixed);
    if (c2.ok) return { ok: true, data: fixed };
  }

  // --- CA/price safety fallback ---
  if (looksLikeCAQuestion(msgLower) || /price|估值|价格|多少钱/.test(msgLower)) {
    const fixed: WaocChatData =
      lang === "zh"
        ? {
            reply:
              "这类信息（CA/价格/上所/合作）如果没有出现在官方入口里，我不会乱写。\n" +
              "请用官网/置顶消息/官方 X 去核对，再决定下一步。",
          }
        : {
            reply:
              "For CA/price/listings/partnerships: if it’s not in official sources, I won’t guess.\n" +
              "Please verify via website/pinned message/official X before taking action.",
          };

    const c2 = checkWaocChatConstraints(fixed);
    if (c2.ok) return { ok: true, data: fixed };
  }

  // --- Generic safe fallback (non-coaching) ---
  const fixed: WaocChatData =
    lang === "zh"
      ? {
          reply:
            "我先按 WAOC 语境直接给可用答案：如果你要入口/资料，我可以把官方链接整理出来；如果你要执行（推文/叙事/任务），直接发关键词：tweet / narrative / mission。",
        }
      : {
          reply:
            "Here’s the practical path: if you need entry/docs, I can list official links; if you want execution (tweet/narrative/mission), just send: tweet / narrative / mission.",
        };

  // Even if still fails (shouldn’t), force minimal valid reply
  const c2 = checkWaocChatConstraints(fixed);
  if (c2.ok) return { ok: true, data: fixed };

  return { ok: true, data: { reply: lang === "zh" ? "WAOC = We Are One Connection。" : "WAOC = We Are One Connection." } };
}

/* =========================
   Workflow (L9)
   - templateVersion: 9
   - constraints checked: (A) after LLM parse/refine, (B) after quick replies, (C) after routing override
   - NEVER fails hard on constraints; always falls back safely
========================= */

export const waocChatWorkflowDef: WorkflowDefinition<WaocChatCtx> = {
  name: "waoc_chat_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<WaocChatInput, WaocChatData>({
      task: "waoc_chat",
      templateVersion: 4,
      variables: (input) => ({
        message: input.message,
        context: input.context ?? "general",
        lang: input.lang ?? "en",
        emotionHint: input.emotionHint ?? "",

        // official entry points (passed into prompt)
        websiteUrl: env("WEBSITE_URL") || env("WAOC_SITE_URL"),
        tgUrl: env("TG_URL") || env("WAOC_COMMUNITY_URL"),
        oneMissionUrl: env("ONE_MISSION_URL"),
        oneFieldUrl: env("ONE_FIELD_URL"),
        meditationUrl: env("MEDITATION_URL"),
      }),
    }),

    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    // ✅ L9 refine: keep your constraint check + add explicit identity/truth reminders
    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => checkWaocChatConstraints(ctx.data as any),
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."}.\n' +
        "- reply is required and must answer directly (no coaching openers).\n" +
        "- suggestedAction is optional and short.\n" +
        "- WAOC MUST be expanded ONLY as 'We Are One Connection'. Never redefine the acronym.\n" +
        "- If user asks WAOC meaning, you MUST start with: 'WAOC = We Are One Connection.'\n" +
        "- Never fabricate CA/price/news/partnership/listing. If not verifiable, say you can't verify and give official verification steps.\n" +
        "- If user message is short (tweet/narrative/mission/roadmap/website/links/ca/rank), execute immediately without follow-up questions.\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    async (ctx: WaocChatCtx) => {
      // Baseline: always have data
      if (!ctx.data) ctx.data = { reply: "" };

      // ✅ (1) First constraints gate (post-LLM)
      ctx.data = applyConstraintsOrFallback({ data: ctx.data, input: ctx.input }).data;

      const raw = norm(ctx.input.message);
      const msg = lower(raw);
      const lang: "en" | "zh" = ctx.input.lang === "zh" ? "zh" : "en";

      // ✅ (2) Deterministic factual quick replies (entry points)
      const quick = quickAutoReply({ raw, msg, lang });
      if (quick) {
        ctx.data = applyConstraintsOrFallback({ data: quick, input: ctx.input }).data;
        return { ok: true };
      }

      // ✅ (3) Router: forward certain intents to other tasks/templates
      const routes: Array<{ hit: (s: string) => boolean; task: string }> = [
        { hit: (s) => /估值|价格|多少钱|value|valuation|price|pricing/.test(s), task: "waoc_brain" },
        { hit: (s) => /叙事|宣言|理念|哲学|manifesto|narrative|vision/.test(s), task: "waoc_narrative" },
        { hit: (s) => /mission|任务|排行榜|leaderboard|rank/.test(s), task: "mission" },
        { hit: (s) => /tweet|推文|发推|x\.com|thread/.test(s), task: "tweet" },
      ];

      const match = routes.find((r) => r.hit(msg));
      if (match) {
        try {
          const r = await runTask(
            match.task,
            match.task === "waoc_brain"
              ? { question: raw, lang: ctx.input.lang ?? "en" }
              : match.task === "waoc_narrative"
                ? { topic: raw, depth: "short", lang: ctx.input.lang ?? "en" }
                : { message: raw, lang: ctx.input.lang ?? "en" },
            // keep other tasks on their own versions; waoc_chat is v9
            { templateVersion: 5 }
          );

          if (r?.success) {
            const answer =
              (r.data?.reply ??
                r.data?.answer ??
                r.data?.content ??
                r.data?.text ??
                "").toString().trim();

            if (answer) {
              const next: WaocChatData = { ...ctx.data, reply: answer };

              if (Array.isArray(r.data?.links) && r.data.links.length) {
                next.suggestedAction = "Learn more: " + r.data.links.join(" | ");
              }

              // ✅ (4) Second constraints gate (post-routing override)
              ctx.data = applyConstraintsOrFallback({ data: next, input: ctx.input }).data;
            }
          }
        } catch {
          // ignore routing errors; keep current ctx.data
          ctx.data = applyConstraintsOrFallback({ data: ctx.data, input: ctx.input }).data;
        }
      }

      // ✅ Final guarantee
      ctx.data = applyConstraintsOrFallback({ data: ctx.data, input: ctx.input }).data;
      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});