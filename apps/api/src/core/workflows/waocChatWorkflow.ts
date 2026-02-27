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

// ✅ NEW: constraints layer
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
   * ✅ V4: emotion is handled by LLM
   * bot can pass in:
   * - greeting_morning | greeting_night | stress | anger | celebrate | gratitude | apology
   * - or null/undefined
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
function nonEmptyList(xs: string[]) {
  return xs.map((x) => x.trim()).filter(Boolean);
}

/**
 * Deterministic quick replies for common FACTUAL queries.
 * ✅ V5: Removed GM/GN (emotion is handled by LLM)
 * IMPORTANT: Never fabricate CA; only show if env provides it.
 */
function quickAutoReply(args: {
  raw: string;
  msg: string;
  lang: "en" | "zh";
}): { reply: string; suggestedAction?: string } | null {
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
    if (lang === "zh") {
      return {
        reply:
          "WAOC 官方入口在这里（选你需要的）：\n" +
          (links.length
            ? links.map((x) => `- ${x}`).join("\n")
            : "（暂未配置链接环境变量）"),
        suggestedAction,
      };
    }
    return {
      reply:
        "WAOC official entry points (pick what you need):\n" +
        (links.length
          ? links.map((x) => `- ${x}`).join("\n")
          : "(links not configured on server env yet)"),
      suggestedAction,
    };
  }

  // --- CA / Contract Address ---
  const asksCA =
    msg === "ca" ||
    msg.includes("contract") ||
    msg.includes("address") ||
    msg.includes("合约") ||
    msg.includes("地址") ||
    msg.includes("ca ");

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
            "\n\n⚠️ 请只以官方渠道为准，别信私聊。",
          suggestedAction,
        };
      }
      return {
        reply:
          "你问的是 WAOC 的 CA（合约地址）对吗？我这边没有在系统里配置 CA，避免我乱写误导。\n" +
          "建议你只在官网/置顶消息/官方频道核对。",
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
        "Are you asking for WAOC CA (contract address)? I don’t have a configured CA in this system, so I won’t guess.\n" +
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
    if (lang === "zh") {
      return {
        reply:
          "One Mission 是 WAOC 的贡献引擎：完成任务 → 记分 → 上榜。\n" +
          (ONE_MISSION_URL
            ? `入口：${ONE_MISSION_URL}`
            : "（One Mission 链接未配置）"),
        suggestedAction,
      };
    }
    return {
      reply:
        "One Mission is WAOC’s contribution engine: complete tasks → earn points → climb the leaderboard.\n" +
        (ONE_MISSION_URL
          ? `Entry: ${ONE_MISSION_URL}`
          : "(One Mission link not configured)"),
      suggestedAction,
    };
  }

  // --- help (very short triggers) ---
  if (raw.length <= 14) {
    if (lang === "zh") {
      if (msg === "help" || msg === "帮助") {
        return {
          reply:
            "我能帮你：解释 WAOC / One Mission / 排行榜、发公告草稿、做投票、写推文、梳理增长策略。",
          suggestedAction,
        };
      }
    } else {
      if (msg === "help") {
        return {
          reply:
            "I can help explain WAOC/One Mission/leaderboards, draft announcements, polls, tweets, and growth strategy.",
          suggestedAction,
        };
      }
    }
  }

  return null;
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
      templateVersion: 4, // ✅ V4
      variables: (input) => ({
        message: input.message,
        context: input.context ?? "general",
        lang: input.lang ?? "en",
        emotionHint: input.emotionHint ?? "",
      }),
    }),

    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),

    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => checkWaocChatConstraints(ctx.data as any),
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."}.\n' +
        "- reply is required and must answer the user directly like a normal person.\n" +
        "- suggestedAction is optional and short.\n" +
        "- Do NOT force a follow-up question unless it truly helps.\n" +
        "- If the user message is short (e.g. 'Mission', 'CA', 'website', 'gm', 'gn'), infer the WAOC intent and answer helpfully.\n" +
        "- WAOC MUST be expanded ONLY as 'We Are One Connection'. Never redefine the acronym.\n" +
        "- Keep it natural and WAOC-context aware.\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    async (ctx: WaocChatCtx) => {
      // ✅ ensure baseline is valid
      if (!ctx.data) return { ok: false, error: ["internal: data is undefined"] };

      const ok = checkWaocChatConstraints(ctx.data as any);
      if (!ok.ok) return { ok: false, error: ok.errors };

      const raw = norm(ctx.input.message);
      const msg = lower(raw);
      const lang: "en" | "zh" = ctx.input.lang === "zh" ? "zh" : "en";

      /** 1) Quick deterministic auto replies (FACT only: CA/links/mission/help) */
      const quick = quickAutoReply({ raw, msg, lang });
      if (quick) {
        ctx.data.reply = quick.reply;
        if (quick.suggestedAction) ctx.data.suggestedAction = quick.suggestedAction;

        // ✅ re-check constraints
        const okQuick = checkWaocChatConstraints(ctx.data as any);
        if (!okQuick.ok) return { ok: false, error: okQuick.errors };

        return { ok: true };
      }

      /** 2) Router: forward certain intents to other tasks/templates */
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
              ctx.data.reply = answer;

              if (Array.isArray(r.data?.links) && r.data.links.length) {
                ctx.data.suggestedAction =
                  "Learn more: " + r.data.links.join(" | ");
              }

              // ✅ critical: re-check constraints after routing override
              const ok2 = checkWaocChatConstraints(ctx.data as any);
              if (!ok2.ok) return { ok: false, error: ok2.errors };
            }
          }
        } catch {
          // swallow routing errors
        }
      }

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});