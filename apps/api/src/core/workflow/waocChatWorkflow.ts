// src/core/workflows/waocChatWorkflow.ts
import { runTask, registerWorkflow } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocChatValidator } from "../validators/waocChatValidator.js";
import {
  checkWaocChatConstraints,
  type WaocChatData,
  type WaocSuggestedAction,
} from "../constraints/waocChatConstraints.js";

/* =========================
   Constants
========================= */

const WAOC_CHAT_TEMPLATE_VERSION = 4;

const ALLOWED_ACTIONS: WaocSuggestedAction[] = [
  "none",
  "/links",
  "/mission",
  "/rank",
  "/report",
  "/builders",
  "/knowledge",
  "/growth",
];

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
  recentMessages?: string;
};

type WaocChatCtx = WorkflowContext<WaocChatInput, WaocChatData> & {
  templateVersion: number;
};

type CommunitySignals = {
  builderSignal: boolean;
  missionSignal: boolean;
  knowledgeSignal: boolean;
  insightSignal: boolean;
  growthSignal: boolean;
  reportSignal: boolean;
  rankingSignal: boolean;
  verificationSignal: boolean;
  newcomerSignal: boolean;
  conflictSignal: boolean;
  noiseSignal: boolean;
  crossCommunityHint: boolean;
  operatorSignal: boolean;
  executionSignal: boolean;
};

type RuntimeState =
  | "general"
  | "coordination_window"
  | "knowledge_window"
  | "insight_window"
  | "growth_window"
  | "newcomer_window"
  | "high_noise"
  | "conflict"
  | "fud_risk"
  | "calm_building"
  | "low_activity";

type CoordinationGap =
  | "none"
  | "builder_without_mission"
  | "mission_without_owner"
  | "knowledge_not_captured"
  | "growth_without_execution"
  | "repeated_problem_without_owner";

type NetworkContext = {
  builderDensity: number;
  missionMomentum: number;
  knowledgeDensity: number;
  insightDensity: number;
  growthDensity: number;
  newcomerDensity: number;
  noiseLevel: number;
  executionDensity: number;
  coordinationState: RuntimeState;
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

function isAllowedAction(v: any): v is WaocSuggestedAction {
  return ALLOWED_ACTIONS.includes(v as WaocSuggestedAction);
}

function ensureAllowedAction(v: any): WaocSuggestedAction {
  return isAllowedAction(v) ? v : "none";
}

function getRecentMessages(ctx: WaocChatCtx) {
  return norm(
    ctx.input?.recentMessages ??
      (ctx as any)?.recentMessages ??
      (ctx as any)?.meta?.recentMessages ??
      ""
  );
}

function getChatId(ctx: WaocChatCtx) {
  return String((ctx as any)?.meta?.chatId ?? (ctx as any)?.chatId ?? "global");
}

function getOfficialLinks() {
  const WEBSITE_URL = env("WEBSITE_URL") || env("WAOC_SITE_URL");
  const X_URL = env("X_URL") || env("WAOC_X_URL");
  const TG_URL = env("TG_URL") || env("WAOC_COMMUNITY_URL");
  const ONE_MISSION_URL = env("ONE_MISSION_URL");
  const ONE_FIELD_URL = env("ONE_FIELD_URL");
  const MEDITATION_URL = env("MEDITATION_URL");

  const links = nonEmptyList([
    WEBSITE_URL && `Website: ${WEBSITE_URL}`,
    X_URL && `X: ${X_URL}`,
    TG_URL && `Telegram: ${TG_URL}`,
    ONE_MISSION_URL && `One Mission: ${ONE_MISSION_URL}`,
    ONE_FIELD_URL && `One Field: ${ONE_FIELD_URL}`,
    MEDITATION_URL && `Meditation: ${MEDITATION_URL}`,
  ]);

  return {
    WEBSITE_URL,
    X_URL,
    TG_URL,
    ONE_MISSION_URL,
    ONE_FIELD_URL,
    MEDITATION_URL,
    links,
  };
}

/* =========================
   Intent / Quick-detection helpers
========================= */

function looksLikeMeaningQuestion(msgLower: string) {
  return (
    /\bwaoc\b.*(\bmeaning\b|\bmean\b|\bacronym\b|\bfull\s*form\b|\bexpand(ed)?\b|\bstands?\s+for\b)/.test(
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

function looksLikeLinksQuestion(msgLower: string) {
  return (
    msgLower === "website" ||
    msgLower === "site" ||
    msgLower === "links" ||
    msgLower.includes("website") ||
    msgLower.includes("官网") ||
    msgLower.includes("链接") ||
    msgLower.includes("site")
  );
}

function looksLikeExplicitMissionRequest(msgLower: string) {
  return (
    /^\/mission\b/.test(msgLower) ||
    /^mission\b/.test(msgLower) ||
    /^任务\b/.test(msgLower) ||
    /generate.*mission|create.*mission|写.*任务|生成.*任务|给我.*mission/.test(msgLower)
  );
}

function looksLikeExplicitTweetRequest(msgLower: string) {
  return /(^|\s)tweet(\s|$)|(^|\s)thread(\s|$)|推文|发推|长推/.test(msgLower);
}

function looksLikeNarrativeRequest(msgLower: string) {
  return /叙事|宣言|理念|哲学|philosophy|manifesto|narrative|vision/.test(
    msgLower
  );
}

function looksLikeValuationRequest(msgLower: string) {
  return /估值|value|valuation/.test(msgLower);
}

function looksLikeVerificationLikeQuestion(msgLower: string) {
  return (
    looksLikeNewsQuestion(msgLower) ||
    looksLikeCAQuestion(msgLower) ||
    /price|valuation|market|chart|pump|dump|listing|partner|partnership|verify|scam|真假|今天|现在|价格|估值|市值|行情|上所|合作|验证|防骗/.test(
      msgLower
    )
  );
}

function looksLikeReportIntent(msgLower: string) {
  return /report|summary|summarize|weekly|daily|周报|日报|总结|报告/.test(
    msgLower
  );
}

function looksLikeKnowledgeIntent(msgLower: string) {
  return /knowledge|guide|faq|playbook|lesson|strategy|洞察|经验|方法|文档|指南|知识/.test(
    msgLower
  );
}

function looksLikeGrowthIntent(msgLower: string) {
  return /growth|campaign|distribution|retention|twitter|x\.com|增长|传播|留存|活动/.test(
    msgLower
  );
}

function looksLikeBuilderIntent(msgLower: string) {
  return /builder|developer|dev|build|building|repo|code|开发者|构建者|代码|开发/.test(
    msgLower
  );
}

/* =========================
   Community Signals
========================= */

function detectCommunitySignals(
  messageRaw: string,
  recentMessagesRaw = ""
): CommunitySignals {
  const msg = lower(messageRaw);
  const recent = lower(recentMessagesRaw);
  const joined = `${msg}\n${recent}`;

  const builderSignal =
    /build|building|ship|shipping|code|repo|dev|deploy|architecture|tool|api|infra|dashboard|bot|开发|代码|部署|架构|工具|系统/.test(
      joined
    );

  const missionSignal =
    /mission|task|objective|execute|execution|deliver|milestone|任务|目标|执行|交付|里程碑|落地/.test(
      joined
    );

  const knowledgeSignal =
    /guide|faq|playbook|template|docs|documentation|lesson|framework|strategy|method|经验|方法|文档|指南|模板|框架/.test(
      joined
    );

  const insightSignal =
    /pattern|lesson|insight|bottleneck|not working|working|重复问题|规律|经验|洞察|瓶颈|问题反复|failed approach|working strategy/.test(
      joined
    );

  const growthSignal =
    /growth|grow|distribution|content|campaign|twitter|x\.com|community growth|retention|增长|传播|内容|活动|留存/.test(
      joined
    );

  const reportSignal =
    /report|summary|summarize|weekly|daily|insight|洞察|总结|报告|日报|周报/.test(
      joined
    );

  const rankingSignal =
    /rank|ranking|leaderboard|score|points|排行榜|排名|积分/.test(joined);

  const verificationSignal = looksLikeVerificationLikeQuestion(msg);

  const newcomerSignal =
    /what is|how to join|how do i join|start here|help|guide me|new here|新手|怎么加入|怎么开始|帮助|入门/.test(
      joined
    );

  const conflictSignal =
    /idiot|stupid|trash|fuck|傻逼|滚|闭嘴|骗子|诈骗|吵|撕|喷/.test(joined);

  const noiseSignal =
    /airdrop|ref|join now|free|claim|moon|x10|x100|梭哈|空投|暴涨|起飞/.test(
      joined
    );

  const crossCommunityHint =
    /other community|another community|cross-community|shared problem|shared mission|另一个社区|跨社区|别的社区|共同问题|共同任务/.test(
      joined
    );

  const operatorSignal =
    /ops|operator|moderation|manage|coordination|协调|管理|运营|治理|流程/.test(
      joined
    );

  const executionSignal =
    /shipped|deployed|delivered|completed|finished|launched|已完成|已经部署|交付了|上线了|做完了/.test(
      joined
    );

  return {
    builderSignal,
    missionSignal,
    knowledgeSignal,
    insightSignal,
    growthSignal,
    reportSignal,
    rankingSignal,
    verificationSignal,
    newcomerSignal,
    conflictSignal,
    noiseSignal,
    crossCommunityHint,
    operatorSignal,
    executionSignal,
  };
}

/* =========================
   Network Context Inference
========================= */

function countMatches(re: RegExp, s: string) {
  return (s.match(re) || []).length;
}

function inferNetworkContext(
  messageRaw: string,
  recentMessagesRaw = ""
): NetworkContext {
  const text = lower(`${messageRaw}\n${recentMessagesRaw}`);

  const builderDensity = countMatches(
    /build|building|ship|code|repo|deploy|bot|dashboard|开发|部署|代码/g,
    text
  );

  const missionMomentum = countMatches(
    /mission|task|objective|deliver|execute|任务|目标|执行|交付/g,
    text
  );

  const knowledgeDensity = countMatches(
    /guide|faq|playbook|lesson|strategy|文档|指南|经验|方法|知识/g,
    text
  );

  const insightDensity = countMatches(
    /insight|pattern|bottleneck|lesson|洞察|规律|瓶颈|教训/g,
    text
  );

  const growthDensity = countMatches(
    /growth|campaign|distribution|retention|增长|传播|留存/g,
    text
  );

  const newcomerDensity = countMatches(
    /what is|how to join|help|new here|新手|怎么加入|帮助|入门/g,
    text
  );

  const noiseLevel = countMatches(
    /airdrop|moon|x10|x100|claim|free|空投|暴涨|起飞|梭哈/g,
    text
  );

  const executionDensity = countMatches(
    /shipped|deployed|delivered|completed|launched|已完成|部署|交付|上线/g,
    text
  );

  let coordinationState: RuntimeState = "general";

  if (!text || text.length < 50) {
    coordinationState = "low_activity";
  } else if (noiseLevel >= 3) {
    coordinationState = "high_noise";
  } else if (
    /idiot|stupid|trash|fuck|傻逼|滚|闭嘴|骗子|诈骗|吵|撕|喷/.test(text)
  ) {
    coordinationState = "conflict";
  } else if (
    /rug|rugpull|跑路|割韭菜|归零|崩盘|砸盘|fud/.test(text)
  ) {
    coordinationState = "fud_risk";
  } else if (growthDensity >= 2) {
    coordinationState = "growth_window";
  } else if (newcomerDensity >= 2) {
    coordinationState = "newcomer_window";
  } else if (insightDensity >= 2) {
    coordinationState = "insight_window";
  } else if (knowledgeDensity >= 2) {
    coordinationState = "knowledge_window";
  } else if (builderDensity >= 2 && missionMomentum >= 1) {
    coordinationState = "coordination_window";
  } else if (builderDensity >= 2 || executionDensity >= 2) {
    coordinationState = "calm_building";
  }

  return {
    builderDensity,
    missionMomentum,
    knowledgeDensity,
    insightDensity,
    growthDensity,
    newcomerDensity,
    noiseLevel,
    executionDensity,
    coordinationState,
  };
}

/* =========================
   Coordination Gap Detection
========================= */

function detectCoordinationGap(
  signals: CommunitySignals,
  network: NetworkContext
): CoordinationGap {
  if (signals.builderSignal && !signals.missionSignal) {
    return "builder_without_mission";
  }

  if (signals.missionSignal && !signals.builderSignal && network.builderDensity === 0) {
    return "mission_without_owner";
  }

  if (
    (signals.knowledgeSignal || signals.insightSignal) &&
    network.knowledgeDensity + network.insightDensity >= 2
  ) {
    return "knowledge_not_captured";
  }

  if (signals.growthSignal && !signals.missionSignal && network.executionDensity === 0) {
    return "growth_without_execution";
  }

  if (network.missionMomentum >= 3 && network.builderDensity === 0) {
    return "repeated_problem_without_owner";
  }

  return "none";
}

/* =========================
   Action Inference
========================= */

function inferPreferredAction(
  signals: CommunitySignals,
  network: NetworkContext,
  gap: CoordinationGap
): WaocSuggestedAction {
  if (signals.verificationSignal) return "/links";
  if (gap === "builder_without_mission") return "/mission";
  if (gap === "mission_without_owner") return "/builders";
  if (gap === "knowledge_not_captured") return "/knowledge";
  if (gap === "growth_without_execution") return "/mission";
  if (gap === "repeated_problem_without_owner") return "/builders";

  if (signals.reportSignal) return "/report";
  if (signals.rankingSignal) return "/rank";
  if (signals.growthSignal || network.coordinationState === "growth_window")
    return "/growth";
  if (signals.missionSignal || network.missionMomentum >= 2) return "/mission";
  if (signals.builderSignal || network.builderDensity >= 2) return "/builders";
  if (
    signals.knowledgeSignal ||
    signals.insightSignal ||
    network.knowledgeDensity >= 2 ||
    network.insightDensity >= 2
  ) {
    return "/knowledge";
  }

  return "none";
}

/* =========================
   Signal / Runtime hints for prompt
========================= */

function buildSignalHint(signals: CommunitySignals, lang: "en" | "zh") {
  const tags: string[] = [];
  if (signals.builderSignal) tags.push("builder_signal");
  if (signals.missionSignal) tags.push("mission_signal");
  if (signals.knowledgeSignal) tags.push("knowledge_signal");
  if (signals.insightSignal) tags.push("insight_signal");
  if (signals.growthSignal) tags.push("growth_signal");
  if (signals.reportSignal) tags.push("report_signal");
  if (signals.rankingSignal) tags.push("ranking_signal");
  if (signals.newcomerSignal) tags.push("newcomer_signal");
  if (signals.verificationSignal) tags.push("verification_signal");
  if (signals.conflictSignal) tags.push("conflict_signal");
  if (signals.noiseSignal) tags.push("noise_signal");
  if (signals.crossCommunityHint) tags.push("cross_community_hint");
  if (signals.operatorSignal) tags.push("operator_signal");
  if (signals.executionSignal) tags.push("execution_signal");

  if (!tags.length) return "";

  return lang === "zh"
    ? `\n\n系统信号：${tags.join(", ")}`
    : `\n\nSystem signals: ${tags.join(", ")}`;
}

function buildRuntimeHint(
  network: NetworkContext,
  gap: CoordinationGap,
  lang: "en" | "zh"
) {
  const text =
    lang === "zh"
      ? `运行时上下文：state=${network.coordinationState}, gap=${gap}, builderDensity=${network.builderDensity}, missionMomentum=${network.missionMomentum}, knowledgeDensity=${network.knowledgeDensity}, insightDensity=${network.insightDensity}, growthDensity=${network.growthDensity}, executionDensity=${network.executionDensity}, noiseLevel=${network.noiseLevel}`
      : `Runtime context: state=${network.coordinationState}, gap=${gap}, builderDensity=${network.builderDensity}, missionMomentum=${network.missionMomentum}, knowledgeDensity=${network.knowledgeDensity}, insightDensity=${network.insightDensity}, growthDensity=${network.growthDensity}, executionDensity=${network.executionDensity}, noiseLevel=${network.noiseLevel}`;

  return `\n\n${text}`;
}

/* =========================
   Rhythm Control Engine
========================= */

type GroupState =
  | "calm_building"
  | "low_activity"
  | "high_noise"
  | "fud_risk"
  | "conflict"
  | "hype_overheat";

function inferGroupState(recentMessagesRaw: any): GroupState {
  const text = lower(recentMessagesRaw);

  if (!text || text.length < 50) return "low_activity";

  const conflict =
    /idiot|stupid|scam|trash|f\*|fuck|你妈|傻逼|滚|闭嘴|sb|nm|废物|骗子|骗|拉黑|举报|吵|撕|喷/.test(
      text
    );
  if (conflict) return "conflict";

  const fud =
    /rug|rugpull|跑路|割韭菜|归零|崩盘|砸盘|被盗|黑客|被骗|假消息|假的|诈骗|骗局|fud/.test(
      text
    );
  if (fud) return "fud_risk";

  const hype =
    /moon|to the moon|pump|x10|x50|x100|lambo|起飞|冲|爆拉|暴涨|all in|梭哈|发财/.test(
      text
    );
  if (hype) return "hype_overheat";

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const shortLines = lines.filter((l) => l.length <= 8).length;

  const spam =
    /t\.me\/|airdrop|ref|invite|join now|free|claim|dm me|私聊|加我|返佣|空投/.test(
      text
    );

  if (spam) return "high_noise";
  if (lines.length >= 15 && shortLines / Math.max(lines.length, 1) > 0.55)
    return "high_noise";

  if (lines.length <= 3) return "low_activity";
  return "calm_building";
}

function shouldIgnite(state: GroupState) {
  return state === "low_activity";
}

function pickIgnitionLine(
  lang: "en" | "zh",
  seed: number,
  state: RuntimeState
): string {
  const poolEn =
    state === "coordination_window"
      ? [
          "What should become the next mission?",
          "Who should own the next execution step?",
          "What useful thing can we ship next?",
        ]
      : state === "knowledge_window" || state === "insight_window"
      ? [
          "What should we turn into a guide?",
          "What lesson here is worth preserving?",
          "Which insight should become reusable knowledge?",
        ]
      : [
          "What are you shipping this week?",
          "Drop one execution update.",
          "Any mission worth testing today?",
          "What problem should we solve next?",
          "Who is building right now?",
        ];

  const poolZh =
    state === "coordination_window"
      ? [
          "接下来最值得变成任务的是什么？",
          "下一步执行最该由谁来接？",
          "接下来最值得交付的是什么？",
        ]
      : state === "knowledge_window" || state === "insight_window"
      ? [
          "这里有什么值得沉淀成指南？",
          "这里哪条经验最值得保留？",
          "哪个洞察应该变成可复用知识？",
        ]
      : [
          "这周你在交付什么？",
          "丢一个执行进展。",
          "今天有什么任务值得测试？",
          "接下来最该解决什么问题？",
          "现在谁在建？",
        ];

  const pool = lang === "zh" ? poolZh : poolEn;
  return pool[Math.abs(seed) % pool.length];
}

const __igniteMap: Map<string, number> = (globalThis as any).__waocIgniteMap ||
  ((globalThis as any).__waocIgniteMap = new Map<string, number>());

/* =========================
   Deterministic Quick Replies
   Only highest-certainty cases
========================= */

function quickAutoReply(args: {
  raw: string;
  msg: string;
  lang: "en" | "zh";
}): WaocChatData | null {
  const { msg, lang } = args;

  const { links } = getOfficialLinks();
  const WAOC_CA_SOL = env("WAOC_CA_SOL");
  const WAOC_CA_BSC = env("WAOC_CA_BSC");

  const actionLinks: WaocSuggestedAction = "/links";
  const actionNone: WaocSuggestedAction = "none";

  if (looksLikeMeaningQuestion(msg)) {
    const reply =
      lang === "zh"
        ? "WAOC = We Are One Connection。\n" +
          "WAOC is an AI-native coordination network for human connection.\n" +
          "一个关于人类协作的长期实验。\n\n" +
          "官方入口：\n" +
          (links.length
            ? links.map((x) => `- ${x}`).join("\n")
            : "（暂未配置官方链接）")
        : "WAOC = We Are One Connection.\n" +
          "WAOC is an AI-native coordination network for human connection.\n" +
          "A long-term experiment in human coordination.\n\n" +
          "Official entry points:\n" +
          (links.length
            ? links.map((x) => `- ${x}`).join("\n")
            : "(official links not configured yet)");

    return { reply, suggestedAction: links.length ? actionLinks : actionNone };
  }

  if (looksLikeLinksQuestion(msg)) {
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

  if (looksLikeCAQuestion(msg) || msg === "ca" || msg.includes("ca ")) {
    const hasSol = Boolean(WAOC_CA_SOL);
    const hasBsc = Boolean(WAOC_CA_BSC);

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
          ? "你问的是 WAOC 的 CA。我这里不会猜或乱编。\n请以置顶消息 + 官网/官方 X 为准。（/links）"
          : "You’re asking for WAOC CA. I won’t guess or fabricate it.\nUse pinned messages + official website/official X. (/links)",
      suggestedAction: actionLinks,
    };
  }

  return null;
}

/* =========================
   Constraint Guard
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
    return {
      ok: true,
      data: {
        reply: norm(check.data?.reply ?? data.reply),
        suggestedAction: ensureAllowedAction(
          check.data?.suggestedAction ?? data.suggestedAction
        ),
      },
    };
  }

  const raw = norm(input.message);
  const msgLower = lower(raw);
  const lang: "en" | "zh" = input.lang === "zh" ? "zh" : "en";

  const { WEBSITE_URL, TG_URL, X_URL } = getOfficialLinks();

  const linkLine =
    [
      WEBSITE_URL && `Website: ${WEBSITE_URL}`,
      X_URL && `X: ${X_URL}`,
      TG_URL && `Telegram: ${TG_URL}`,
    ]
      .filter(Boolean)
      .join(" | ") || "";

  if (looksLikeMeaningQuestion(msgLower)) {
    const reply =
      lang === "zh"
        ? [
            "WAOC = We Are One Connection。",
            "WAOC is an AI-native coordination network for human connection.",
            "一个关于人类协作的长期实验。",
            linkLine ? `入口：${linkLine}（/links）` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : [
            "WAOC = We Are One Connection.",
            "WAOC is an AI-native coordination network for human connection.",
            "A long-term experiment in human coordination.",
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

  if (looksLikeVerificationLikeQuestion(msgLower)) {
    const lines =
      lang === "zh"
        ? [
            "我这里无法实时核验外部信息，也不会猜或乱编。",
            "最短路径：看置顶消息 + 官网/官方 X；需要入口清单发 /links。",
          ]
        : [
            "I can’t verify real-time external info here, and I won’t guess or fabricate.",
            "Shortest path: check pinned messages + official website/official X. For entry points, use /links.",
          ];

    if (linkLine) lines.push(linkLine);

    return {
      ok: true,
      data: {
        reply: lines.join("\n"),
        suggestedAction: linkLine ? "/links" : "none",
      },
    };
  }

  return {
    ok: true,
    data: {
      reply: norm(data.reply) || (lang === "zh" ? "收到。" : "Got it."),
      suggestedAction: ensureAllowedAction(data.suggestedAction),
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
    // 1) deterministic high-certainty interception only
    async (ctx: WaocChatCtx) => {
      const raw = norm(ctx.input?.message);
      const msg = lower(raw);
      const lang: "en" | "zh" = ctx.input?.lang === "zh" ? "zh" : "en";

      const quick = quickAutoReply({ raw, msg, lang });
      if (quick) {
        ctx.data = applyConstraintsOrFallback({
          data: quick,
          input: ctx.input,
        }).data;
        return { ok: true, stop: true } as any;
      }

      return { ok: true };
    },

    // 2) prepare prompt with signal + runtime hints
    preparePromptStep<WaocChatInput, WaocChatData>({
      task: "waoc_chat",
      templateVersion: WAOC_CHAT_TEMPLATE_VERSION,
      variables: (input: WaocChatInput): Record<string, string> => {
        const lang: "en" | "zh" = input.lang === "zh" ? "zh" : "en";
        const signals = detectCommunitySignals(
          input.message,
          input.recentMessages ?? ""
        );
        const network = inferNetworkContext(
          input.message,
          input.recentMessages ?? ""
        );
        const gap = detectCoordinationGap(signals, network);

        return {
          message:
            norm(input.message) +
            buildSignalHint(signals, lang) +
            buildRuntimeHint(network, gap, lang),
          context: norm(input.context ?? "general"),
          lang: norm(input.lang ?? "en"),
          emotionHint: norm(input.emotionHint ?? ""),
          recentMessages: norm(input.recentMessages ?? ""),

          websiteUrl: env("WEBSITE_URL") || env("WAOC_SITE_URL"),
          tgUrl: env("TG_URL") || env("WAOC_COMMUNITY_URL"),
          oneMissionUrl: env("ONE_MISSION_URL"),
          oneFieldUrl: env("ONE_FIELD_URL"),
          meditationUrl: env("MEDITATION_URL"),
          xUrl: env("X_URL") || env("WAOC_X_URL"),
        };
      },
    }),

    // 3) model generation
    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    // 4) refinement with v17 coordination runtime framing
    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => {
        const r: any = checkWaocChatConstraints({
          data: ctx.data as any,
          userMessage: ctx.input?.message,
          lang: ctx.input?.lang,
        });

        return r?.ok
          ? { ok: true, errors: [] }
          : {
              ok: false,
              errors: [String(r?.reason || "waoc_chat_constraints_failed")],
            };
      },
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."}.\n' +
        "- reply is required and must answer directly.\n" +
        '- suggestedAction is optional and MUST be one of: "none", "/links", "/mission", "/rank", "/report", "/builders", "/knowledge", "/growth".\n' +
        "- Think like a coordination runtime, not only a chatbot.\n" +
        "- Prefer the highest-value next step: insight, mission, builder coordination, knowledge capture, growth action, or report.\n" +
        "- If there is a clear coordination gap, it is good to surface it briefly and suggest the most useful next action.\n" +
        "- If there are builder, mission, knowledge, insight, growth, newcomer, or cross-community signals, reflect them when useful.\n" +
        "- Keep replies compact, clear, and high-signal.\n" +
        "- WAOC MUST be expanded ONLY as 'We Are One Connection'. Never redefine the acronym.\n" +
        "- Only if the user asks WAOC meaning/acronym/full-form, include as the FIRST LINE: 'WAOC = We Are One Connection.'\n" +
        "- Never fabricate CA/price/news/partnership/listing. If not verifiable, say you can't verify and route to /links.\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    // 5) runtime amplification, routing, rhythm, final repair
    async (ctx: WaocChatCtx) => {
      if (!ctx.data) ctx.data = { reply: "", suggestedAction: "none" };

      ctx.data = applyConstraintsOrFallback({
        data: ctx.data,
        input: ctx.input,
      }).data;

      const raw = norm(ctx.input.message);
      const msg = lower(raw);
      const lang: "en" | "zh" = ctx.input.lang === "zh" ? "zh" : "en";
      const recentMessages = getRecentMessages(ctx);

      const signals = detectCommunitySignals(raw, recentMessages);
      const network = inferNetworkContext(raw, recentMessages);
      const gap = detectCoordinationGap(signals, network);

      // ---- agent routing
      const routes: Array<{
        hit: (
          s: string,
          sig: CommunitySignals,
          net: NetworkContext,
          gap: CoordinationGap
        ) => boolean;
        task: string;
        mapInput: () => any;
      }> = [
        {
          hit: (s) => looksLikeValuationRequest(s),
          task: "waoc_brain",
          mapInput: () => ({ question: raw, lang }),
        },
        {
          hit: (s) => looksLikeNarrativeRequest(s),
          task: "waoc_narrative",
          mapInput: () => ({ topic: raw, depth: "short", lang }),
        },
        {
          hit: (s) => looksLikeExplicitTweetRequest(s),
          task: "tweet",
          mapInput: () => ({ message: raw, lang }),
        },
        {
          hit: (s) => looksLikeExplicitMissionRequest(s),
          task: "mission",
          mapInput: () => ({ message: raw, lang }),
        },
        {
          hit: (s) => looksLikeReportIntent(s),
          task: "report_agent",
          mapInput: () => ({ message: raw, lang }),
        },
        {
          hit: (s) => looksLikeGrowthIntent(s) || signals.growthSignal,
          task: "growth_agent",
          mapInput: () => ({ message: raw, lang }),
        },
        {
          hit: (s) => looksLikeKnowledgeIntent(s) || signals.knowledgeSignal || signals.insightSignal,
          task: "knowledge_agent",
          mapInput: () => ({ message: raw, lang }),
        },
        {
          hit: (s) => looksLikeBuilderIntent(s) || signals.builderSignal || gap === "mission_without_owner",
          task: "builder_agent",
          mapInput: () => ({ message: raw, lang }),
        },
      ];

      const match = routes.find((r) => r.hit(msg, signals, network, gap));

      if (match) {
        try {
          const r = await runTask(match.task, match.mapInput(), {
            templateVersion: WAOC_CHAT_TEMPLATE_VERSION,
          });

          if (r?.success) {
            const answer = norm(
              r.data?.reply ??
                r.data?.answer ??
                r.data?.content ??
                r.data?.text ??
                ""
            );

            if (answer) {
              const inferredAction = inferPreferredAction(signals, network, gap);

              const next: WaocChatData = {
                ...ctx.data,
                reply: answer,
                suggestedAction: ensureAllowedAction(
                  r.data?.suggestedAction ??
                    ctx.data?.suggestedAction ??
                    inferredAction
                ),
              };

              if (Array.isArray(r.data?.links) && r.data.links.length) {
                next.suggestedAction = "/links";
              }

              ctx.data = applyConstraintsOrFallback({
                data: next,
                input: ctx.input,
              }).data;
            }
          }
        } catch {
          ctx.data = applyConstraintsOrFallback({
            data: ctx.data,
            input: ctx.input,
          }).data;
        }
      } else {
        // ---- fallback action amplification when LLM under-specifies
        if ((ctx.data.suggestedAction ?? "none") === "none") {
          ctx.data.suggestedAction = inferPreferredAction(signals, network, gap);
        }
      }

      // ---- coordination-gap amplification
      if (gap !== "none") {
        const current = norm(ctx.data.reply);
        const gapLine =
          lang === "zh"
            ? gap === "builder_without_mission"
              ? "协调缺口：有 builder 信号，但还没有清晰任务。"
              : gap === "mission_without_owner"
              ? "协调缺口：有任务信号，但没有清晰 owner。"
              : gap === "knowledge_not_captured"
              ? "协调缺口：有知识信号，但还没有沉淀。"
              : gap === "growth_without_execution"
              ? "协调缺口：有增长想法，但缺少执行路径。"
              : "协调缺口：问题重复出现，但还没有明确 owner。"
            : gap === "builder_without_mission"
            ? "Coordination gap: builder signal exists, but no clear mission yet."
            : gap === "mission_without_owner"
            ? "Coordination gap: mission signal exists, but no clear owner yet."
            : gap === "knowledge_not_captured"
            ? "Coordination gap: useful knowledge signal exists, but it is not captured yet."
            : gap === "growth_without_execution"
            ? "Coordination gap: growth idea exists, but no execution path yet."
            : "Coordination gap: repeated problem exists, but no clear owner yet.";

        if (
          current &&
          !current.toLowerCase().includes("coordination gap") &&
          !current.includes("协调缺口")
        ) {
          ctx.data.reply = `${current}\n${gapLine}`.trim();
        }
      }

      // ---- cross-community hint amplification
      if (signals.crossCommunityHint) {
        const current = norm(ctx.data.reply);
        const extra =
          lang === "zh"
            ? "这可能有跨社区协作机会。"
            : "This may have cross-community coordination potential.";

        if (current && !current.includes(extra)) {
          ctx.data.reply = `${current}\n${extra}`.trim();
        }
      }

      // ---- rhythm engine
      try {
        const state = inferGroupState(recentMessages);

        if (
          state !== "conflict" &&
          state !== "fud_risk" &&
          state !== "high_noise" &&
          state !== "hype_overheat"
        ) {
          if (shouldIgnite(state)) {
            const chatId = getChatId(ctx);
            const key = `waoc:ignite:last:${chatId}`;

            const now = Date.now();
            const COOLDOWN_MS = 5 * 60 * 1000;
            const last = Number(__igniteMap.get(key) || 0);
            const cooldownOk = !last || now - last >= COOLDOWN_MS;

            if (cooldownOk) {
              const seedBase = String(chatId)
                .split("")
                .reduce((a, c) => a + c.charCodeAt(0), 0);
              const seed = seedBase + Math.floor(now / COOLDOWN_MS);
              const ignition = pickIgnitionLine(
                lang,
                seed,
                network.coordinationState
              );

              const next: WaocChatData = {
                ...ctx.data,
                reply: `${norm(ctx.data?.reply)}\n${ignition}`.trim(),
                suggestedAction: ensureAllowedAction(
                  ctx.data?.suggestedAction ?? "none"
                ),
              };

              ctx.data = applyConstraintsOrFallback({
                data: next,
                input: ctx.input,
              }).data;

              __igniteMap.set(key, now);
            }
          }
        }
      } catch {
        // never break chat
      }

      ctx.data = applyConstraintsOrFallback({
        data: ctx.data,
        input: ctx.input,
      }).data;

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});