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

import {
  checkWaocChatConstraints,
  type WaocChatData,
  type WaocSuggestedAction,
} from "../constraints/waocChatConstraints.js";

/* =========================
   Types
========================= */

export type WaocChatInput = {
  message: string;
  context?: "community" | "mission" | "philosophy" | "general";
  lang?: "en" | "zh";
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

/** Meaning intent (aligned with constraints, practical) */
function looksLikeMeaningQuestion(msgLower: string) {
  return (
    /\bwaoc\b.*(\bmeaning\b|\bmean\b|\bmeans\b|\bacronym\b|\bfull\s*form\b|\bexpand(ed)?\b|\bstands?\s+for\b|\bstanding\s+for\b)/.test(
      msgLower
    ) ||
    /\bwhat\s+does\s+waoc\s+(mean|stand\s+for)\b/.test(msgLower) ||
    /\bwhat\s+(is|’s|'s)\s+waoc\b/.test(msgLower) ||
    /^\s*waoc\s*\?\s*$/.test(msgLower) ||
    /全称|什么意思|含义|缩写|代表什么|展开|啥意思/.test(msgLower)
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
    msgLower.includes("latest") ||
    msgLower.includes("update") ||
    msgLower.includes("what's new") ||
    msgLower.includes("最新") ||
    msgLower.includes("有什么消息") ||
    msgLower.includes("进展") ||
    msgLower.includes("更新")
  );
}

/* =========================
   Deterministic Quick Replies (FACTUAL ONLY)
========================= */

function quickAutoReply(args: {
  raw: string;
  msg: string; // already lowercased
  lang: "en" | "zh";
}): WaocChatData | null {
  const { raw, msg, lang } = args;

  const WEBSITE_URL = env("WEBSITE_URL") || env("WAOC_SITE_URL");
  const X_URL = env("X_URL") || env("WAOC_X_URL");
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

  const actionLinks: WaocSuggestedAction = "/links";
  const actionNone: WaocSuggestedAction = "none";

  // --- WAOC meaning / stands for (deterministic) ---
  const asksMeaning = looksLikeMeaningQuestion(msg);
  if (asksMeaning) {
    const reply =
      lang === "zh"
        ? "WAOC = We Are One Connection。\n" +
          "WAOC —— Solana 上的 AI-Native Coordination Layer。\n" +
          "由 $WAOC（We Are One Connection）驱动。\n" +
          "链上身份与声誉基础设施。\n" +
          "一个关于人类协作的长期实验。\n\n" +
          "官方入口：\n" +
          (links.length
            ? links.map((x) => `- ${x}`).join("\n")
            : "（暂未配置官方链接）")
        : "WAOC = We Are One Connection.\n" +
          "WAOC — AI-Native Coordination Layer on Solana.\n" +
          "Powered by $WAOC (We Are One Connection).\n" +
          "On-chain identity & reputation infrastructure.\n" +
          "A long-term experiment in Human Coordination.\n\n" +
          "Official entry points:\n" +
          (links.length
            ? links.map((x) => `- ${x}`).join("\n")
            : "(official links not configured yet)");

    return { reply, suggestedAction: links.length ? actionLinks : actionNone };
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
          ? "WAOC 官方入口：\n" +
            (links.length
              ? links.map((x) => `- ${x}`).join("\n")
              : "（暂未配置链接环境变量）")
          : "WAOC official entry points:\n" +
            (links.length
              ? links.map((x) => `- ${x}`).join("\n")
              : "(links not configured on server env yet)"),
      suggestedAction: links.length ? actionLinks : actionNone,
    };
  }

  // --- CA / Contract Address ---
  const asksCA = looksLikeCAQuestion(msg) || msg === "ca" || msg.includes("ca ");

  if (asksCA) {
    const hasSol = Boolean(WAOC_CA_SOL);
    const hasBsc = Boolean(WAOC_CA_BSC);

    // If configured, output. If not, TruthGate path.
    if (hasSol || hasBsc) {
      const lines: string[] = [];
      if (hasSol) lines.push(`Solana CA: ${WAOC_CA_SOL}`);
      if (hasBsc) lines.push(`BSC CA: ${WAOC_CA_BSC}`);

      return {
        reply:
          (lang === "zh"
            ? "WAOC 合约地址（官方配置）：\n"
            : "WAOC contract address (officially configured):\n") +
          lines.map((x) => `- ${x}`).join("\n") +
          (lang === "zh"
            ? "\n\n⚠️ 只以官方渠道为准，别信私聊。"
            : "\n\n⚠️ Only trust official channels—ignore DMs."),
        suggestedAction: actionLinks,
      };
    }

    return {
      reply:
        lang === "zh"
          ? "你问的是 WAOC 的 CA（合约地址）。我这边无法实时核验，也不会猜或乱编。\n请以置顶消息 + 官网/官方 X 为准。（入口：/links）"
          : "You’re asking for WAOC CA (contract address). I can’t verify real-time here and I won’t guess.\nUse pinned messages + official website/official X. (Entry: /links)",
      suggestedAction: actionLinks,
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
          ? "One Mission 是 WAOC 的贡献引擎：完成任务 → 记分 → 上榜。"
          : "One Mission is WAOC’s contribution engine: complete tasks → earn points → climb the leaderboard.",
      suggestedAction: actionNone,
    };
  }

  // --- help (very short triggers) ---
  if (raw.length <= 14) {
    if (lang === "zh" && (msg === "help" || msg === "帮助")) {
      return { reply: "我能做：解释 WAOC、生成推文/叙事/任务、整理执行计划。", suggestedAction: actionNone };
    }
    if (lang === "en" && msg === "help") {
      return { reply: "I can: explain WAOC, generate tweet/narrative/mission, and produce an execution plan.", suggestedAction: actionNone };
    }
  }

  return null;
}

/* =========================
   Constraint Guard (never crash)
   Minimal fallback: only fix Identity + TruthGate, otherwise keep the model's reply.
========================= */
/* =========================
   Constraint Guard (never crash)
   Minimal fallback: only fix Identity + TruthGate, otherwise keep the model's reply.
========================= */

function applyConstraintsOrFallback(args: {
  data: WaocChatData;
  input: WaocChatInput;
}): { ok: true; data: WaocChatData } {
  const data = args.data || { reply: "", suggestedAction: "none" };
  const input = args.input || ({} as any);

  const check = checkWaocChatConstraints({
    data,
    userMessage: input.message,
    lang: input.lang,
  });

  if (check.ok) {
    return { ok: true, data };
  }

  const raw = norm(input.message);
  const msgLower = lower(raw);
  const lang: "en" | "zh" = input.lang === "zh" ? "zh" : "en";

  const website = env("WEBSITE_URL") || env("WAOC_SITE_URL");
  const tg = env("TG_URL") || env("WAOC_COMMUNITY_URL");
  const x = env("X_URL") || env("WAOC_X_URL");

  const linkLine =
    [website && `Website: ${website}`, x && `X: ${x}`, tg && `Telegram: ${tg}`]
      .filter(Boolean)
      .join(" | ") || "";

  // =========================
  // Meaning fallback
  // =========================
  if (looksLikeMeaningQuestion(msgLower)) {
    const reply =
      lang === "zh"
        ? [
            "WAOC = We Are One Connection。",
            "WAOC —— Solana 上的 AI-Native Coordination Layer。",
            "由 $WAOC（We Are One Connection）驱动。",
            "链上身份与声誉基础设施。",
            "一个关于人类协作的长期实验。",
            linkLine ? `入口：${linkLine}（/links）` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : [
            "WAOC = We Are One Connection.",
            "WAOC — AI-Native Coordination Layer on Solana.",
            "Powered by $WAOC (We Are One Connection).",
            "On-chain identity & reputation infrastructure.",
            "A long-term experiment in Human Coordination.",
            linkLine ? `Entry: ${linkLine} (/links)` : "",
          ]
            .filter(Boolean)
            .join("\n");

    return {
      ok: true,
      data: {
        reply,
        suggestedAction: linkLine ? "/links" : "none",
      },
    };
  }

  // ----------------------------
  // 2) Truth Gate (Coordination Core Style)
  // ----------------------------
  const verificationLike =
    looksLikeNewsQuestion(msgLower) ||
    looksLikeCAQuestion(msgLower) ||
    /price|valuation|market|chart|pump|dump|listing|partner|partnership|verify|scam|真假|最新|今天|现在|新闻|更新|价格|估值|市值|行情|上所|合作|验证|防骗/.test(
      msgLower
    );

  if (verificationLike) {
    const lines =
      lang === "zh"
        ? [
            "我这里无法实时核验外部信息（新闻/价格/CA/上所/合作），也不会猜或乱编。",
            "最短路径：看置顶消息 + 官网/官方 X；需要入口清单发 /links。",
            "如果你把“要核验的具体点”用一句话写清楚（例如：哪条新闻/哪个地址/哪个截图），我可以帮你整理核验步骤与风险点。",
          ]
        : [
            "I can’t verify real-time external info here (news/price/CA/listings/partnerships), and I won’t guess or fabricate.",
            "Shortest path: check pinned messages + official website/official X. For entry points, use /links.",
            "If you state the exact claim in one line (which news / which address / which screenshot), I’ll structure the verification steps and key risk checks.",
          ];

    if (linkLine) lines.push(linkLine);

    const fixed: WaocChatData = {
      reply: lines.join("\n"),
      suggestedAction: linkLine ? "/links" : "none",
    };

    const c2 = checkWaocChatConstraints({
      data: fixed,
      userMessage: input.message,
    });

    if (c2.ok) return { ok: true, data: fixed };

    return { ok: true, data };
  }

  // =========================
  // Default fallback (keep model output)
  // =========================
  return {
    ok: true,
    data: {
      reply: data.reply || (lang === "zh" ? "收到。" : "Got it."),
      suggestedAction:
        data.suggestedAction === "/links" || data.suggestedAction === "none"
          ? data.suggestedAction
          : "none",
    },
  };
}
/* =========================
   Workflow
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

        websiteUrl: env("WEBSITE_URL") || env("WAOC_SITE_URL"),
        tgUrl: env("TG_URL") || env("WAOC_COMMUNITY_URL"),
        oneMissionUrl: env("ONE_MISSION_URL"),
        oneFieldUrl: env("ONE_FIELD_URL"),
        meditationUrl: env("MEDITATION_URL"),
        xUrl: env("X_URL") || env("WAOC_X_URL"),
      }),
    }),

    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) =>
        checkWaocChatConstraints({
          data: ctx.data as any,
          userMessage: ctx.input?.message,
          lang: ctx.input?.lang,
        }),
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."}.\n' +
        "- reply is required and must answer directly.\n" +
        '- suggestedAction is optional and MUST be either "none" or "/links".\n' +
        "- WAOC MUST be expanded ONLY as 'We Are One Connection'. Never redefine the acronym.\n" +
        "- Only if the user asks WAOC meaning/acronym/full-form, include: 'WAOC = We Are One Connection.'\n" +
        "- Never fabricate CA/price/news/partnership/listing. If not verifiable, say you can't verify and provide official verification steps (pinned/website/official X or /links).\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    async (ctx: WaocChatCtx) => {
      if (!ctx.data) ctx.data = { reply: "", suggestedAction: "none" };

      // ✅ (1) Minimal constraints gate (do not overwrite unless needed)
      ctx.data = applyConstraintsOrFallback({ data: ctx.data, input: ctx.input }).data;

      const raw = norm(ctx.input.message);
      const msg = lower(raw);
      const lang: "en" | "zh" = ctx.input.lang === "zh" ? "zh" : "en";

      // ✅ (2) Deterministic factual quick replies
      const quick = quickAutoReply({ raw, msg, lang });
      if (quick) {
        ctx.data = applyConstraintsOrFallback({ data: quick, input: ctx.input }).data;
        return { ok: true };
      }

      // ✅ (3) Router: forward certain intents to other tasks/templates
      const routes: Array<{ hit: (s: string) => boolean; task: string }> = [
        { hit: (s) => /估值|value|valuation/.test(s), task: "waoc_brain" },
        { hit: (s) => /叙事|宣言|理念|哲学|philosophy|manifesto|narrative|vision/.test(s), task: "waoc_narrative" },
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
            { templateVersion: 4 }
          );

          if (r?.success) {
            const answer =
              (r.data?.reply ??
                r.data?.answer ??
                r.data?.content ??
                r.data?.text ??
                "").toString().trim();

            if (answer) {
              const next: WaocChatData = {
                ...ctx.data,
                reply: answer,
                suggestedAction: ctx.data?.suggestedAction ?? "none",
              };

              if (Array.isArray(r.data?.links) && r.data.links.length) {
                next.reply += "\n\n(Need official entry points? Use /links.)";
                next.suggestedAction = "/links";
              }

              ctx.data = applyConstraintsOrFallback({ data: next, input: ctx.input }).data;
            }
          }
        } catch {
          ctx.data = applyConstraintsOrFallback({ data: ctx.data, input: ctx.input }).data;
        }
      }

      // ✅ Final guarantee (minimal)
      ctx.data = applyConstraintsOrFallback({ data: ctx.data, input: ctx.input }).data;
      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});
