// src/core/workflow/waocChatWorkflow.ts
import { runTask, registerWorkflow } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";

import { waocChatValidator } from "../validators/waocChatValidator.js";
import { checkWaocChatConstraintsSafe } from "../constraints/waocChatConstraints.js";

const WAOC_CHAT_TEMPLATE_VERSION = 4;

export type WaocSuggestedAction =
  | "none"
  | "/links"
  | "/help"
  | "/mission"
  | "/rank"
  | "/report"
  | "/builders"
  | "/knowledge"
  | "/growth"
  | "/news"
  | "/events"
  | "/tools"
  | "/price"
  | "/x"
  | "/web";

export type WaocChatData = {
  reply: string;
  suggestedAction?: WaocSuggestedAction;
};

const ALLOWED_ACTIONS: WaocSuggestedAction[] = [
  "none",
  "/links",
  "/help",
  "/mission",
  "/rank",
  "/report",
  "/builders",
  "/knowledge",
  "/growth",
  "/news",
  "/events",
  "/tools",
  "/price",
  "/x",
  "/web",
];

export type ThreadMemory = {
  topic?: string;
  currentQuestion?: string;
  currentGoal?: string;
  latestConclusion?: string;
  nextStep?: string;
  ownerHint?: string;
  mood?: "open" | "deciding" | "executing";
};

export type WaocChatInput = {
  message: string;
  context?: "community" | "mission" | "philosophy" | "general";
  lang?: "en" | "zh" | "mixed";
  recentMessages?: string;
  memory?: string;

  // injected by caller / storage
  threadMemory?: ThreadMemory | string | null;

  communityName?: string;
  communityIdentity?: string;
  communityNarrative?: string;
  communityFocus?: string;
  ecosystemContext?: string;
  officialLinks?: string;
};

type WaocChatCtx = WorkflowContext<WaocChatInput, WaocChatData> & {
  templateVersion: number;
  __threadMemory?: ThreadMemory;
  __community?: CommunityContext;
  __signals?: CommunitySignals;
  __route?: RouteDecision;
};

type CommunityContext = {
  communityName: string;
  communityIdentity: string;
  communityNarrative: string;
  communityFocus: string;
  ecosystemContext: string;
  officialLinks: string;
  isWAOC: boolean;
  hasCommunityContext: boolean;
};

type CommunitySignals = {
  meaningSignal: boolean;
  linksSignal: boolean;
  helpSignal: boolean;
  missionSignal: boolean;
  rankSignal: boolean;
  reportSignal: boolean;
  builderSignal: boolean;
  knowledgeSignal: boolean;
  growthSignal: boolean;
  newsSignal: boolean;
  eventsSignal: boolean;
  toolsSignal: boolean;
  pricingSignal: boolean;
  xSignal: boolean;
  webSignal: boolean;
  capabilityQuestionSignal: boolean;
  communityIdentityQuestionSignal: boolean;
  systemQuestionSignal: boolean;
  directQuestionSignal: boolean;
};

type AiRouterIntent =
  | "meaning"
  | "links"
  | "help"
  | "mission"
  | "rank"
  | "report"
  | "builder"
  | "knowledge"
  | "growth"
  | "news"
  | "events"
  | "tools"
  | "price"
  | "x"
  | "web"
  | "capability"
  | "community"
  | "system"
  | "general";

type RouteDecision = {
  intent: AiRouterIntent;
  confidence: number;
  task?: string;
  suggestedAction: WaocSuggestedAction;
  reason: string;
};

function norm(v: unknown) {
  return String(v ?? "").trim();
}

function lower(v: unknown) {
  return norm(v).toLowerCase();
}

function safeJson(value: any) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function isAllowedAction(v: any): v is WaocSuggestedAction {
  return ALLOWED_ACTIONS.includes(v as WaocSuggestedAction);
}

function ensureAllowedAction(v: any): WaocSuggestedAction {
  return isAllowedAction(v) ? v : "none";
}

function toConstraintLang(
  lang: "en" | "zh" | "mixed" | undefined
): "en" | "zh" | undefined {
  if (lang === "zh") return "zh";
  if (lang === "en") return "en";
  if (lang === "mixed") return "en";
  return undefined;
}

function finalizeReply(reply: string, lang: "en" | "zh" | "mixed") {
  const lines = norm(reply)
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (lines.length) return lines.join("\n");
  return lang === "zh" ? "收到。" : "Got it.";
}

function inferCommunityContext(input: WaocChatInput): CommunityContext {
  const communityName = norm(input.communityName);
  const communityIdentity = norm(input.communityIdentity);
  const communityNarrative = norm(input.communityNarrative);
  const communityFocus = norm(input.communityFocus);
  const ecosystemContext = norm(input.ecosystemContext);
  const officialLinks = norm(input.officialLinks);

  const hasCommunityContext = Boolean(
    communityName || communityIdentity || communityNarrative || communityFocus || ecosystemContext
  );

  const isWAOC =
    lower(communityName) === "waoc" ||
    /we are one connection/i.test(communityIdentity) ||
    /we are one connection/i.test(communityNarrative) ||
    /waoc/i.test(communityNarrative) ||
    /waoc/i.test(communityFocus) ||
    /waoc/i.test(ecosystemContext);

  return {
    communityName,
    communityIdentity,
    communityNarrative,
    communityFocus,
    ecosystemContext,
    officialLinks,
    isWAOC,
    hasCommunityContext,
  };
}

function looksLikeMeaningQuestion(msg: string) {
  return (
    /\bwaoc\b.*(\bmeaning\b|\bmean\b|\bmeans\b|\bacronym\b|\bstand(?:s|ing)?\s+for\b)/.test(msg) ||
    /\bwhat\s+(does|is|’s|'s)\s+waoc\s+(mean|meaning|stand(?:s|ing)?\s+for)\b/.test(msg) ||
    /全称|什么意思|含义|缩写|代表什么/.test(msg)
  );
}

function looksLikeLinksQuestion(msg: string) {
  return (
    msg === "website" ||
    msg === "site" ||
    msg === "links" ||
    msg.includes("website") ||
    msg.includes("官网") ||
    msg.includes("链接")
  );
}

function looksLikeHelpQuestion(msg: string) {
  return (
    msg === "/help" ||
    /\bhelp\b/.test(msg) ||
    /how to use|what can i do|commands|功能|怎么用|帮助|指令/.test(msg)
  );
}

function looksLikeMissionIntent(msg: string) {
  return /mission|task|objective|执行|任务|落地|next step|owner|具体一点/.test(msg);
}

function looksLikeRankIntent(msg: string) {
  return /rank|ranking|leaderboard|score|points|排行榜|排名|积分/.test(msg);
}

function looksLikeReportIntent(msg: string) {
  return /report|summary|summarize|weekly|daily|报告|总结|日报|周报/.test(msg);
}

function looksLikeBuilderIntent(msg: string) {
  return /builder|developer|dev|contributors?|who is building|开发者|构建者|谁在构建/.test(msg);
}

function looksLikeKnowledgeIntent(msg: string) {
  return /knowledge|guide|faq|playbook|docs|documentation|strategy|文档|指南|知识|原理/.test(msg);
}

function looksLikeGrowthIntent(msg: string) {
  return /growth|marketing|promotion|campaign|retention|adoption|增长|推广|传播|活动/.test(msg);
}

function looksLikeNewsIntent(msg: string) {
  return /news|latest|update|announcement|最新|新闻|动态|公告|更新/.test(msg);
}

function looksLikeEventsIntent(msg: string) {
  return /event|events|space|ama|meetup|workshop|hackathon|活动|日程|会议|space/.test(msg);
}

function looksLikeToolsIntent(msg: string) {
  return /tools|tooling|stack|resources|resource|工具|资源|工具栈/.test(msg);
}

function looksLikePriceIntent(msg: string) {
  return /price|market cap|chart|valuation|token price|价格|币价|市值|估值|行情/.test(msg);
}

function looksLikeXIntent(msg: string) {
  return /\bx\.com\b|\btwitter\b|\btweet\b|@[a-z0-9_]{1,15}\b/i.test(msg) || /推文|推特|x账号|x 帐号/.test(msg);
}

function looksLikeWebIntent(msg: string) {
  return /\bhttps?:\/\//.test(msg) || /\bwebsite\b|\bweb page\b|\barticle\b|\blink\b/.test(msg) || /网页|文章|网址|网站|链接/.test(msg);
}

function looksLikeCapabilityQuestion(msg: string) {
  return /what can you do|who are you|how can you help|你的作用|你能做什么|你是谁/.test(msg);
}

function looksLikeCommunityIdentityQuestion(msg: string) {
  return /what is this community|what is this project|这个社区是干什么的|这个项目是做什么的/.test(msg);
}

function looksLikeSystemQuestion(msg: string) {
  return /how does this work|how does oneai work|这个系统怎么运作|这个系统怎么工作/.test(msg);
}

function looksLikeDirectQuestion(raw: string) {
  const msg = norm(raw);
  const m = lower(raw);
  return (
    msg.includes("?") ||
    /^(what|how|why|who|when|where|which|can|should|is|are|do|does)\b/.test(m) ||
    /^(什么|怎么|为什么|谁|哪里|哪个|是否|能不能|是不是)/.test(m)
  );
}

function detectSignals(messageRaw: string): CommunitySignals {
  const msg = lower(messageRaw);

  return {
    meaningSignal: looksLikeMeaningQuestion(msg),
    linksSignal: looksLikeLinksQuestion(msg),
    helpSignal: looksLikeHelpQuestion(msg),
    missionSignal: looksLikeMissionIntent(msg),
    rankSignal: looksLikeRankIntent(msg),
    reportSignal: looksLikeReportIntent(msg),
    builderSignal: looksLikeBuilderIntent(msg),
    knowledgeSignal: looksLikeKnowledgeIntent(msg),
    growthSignal: looksLikeGrowthIntent(msg),
    newsSignal: looksLikeNewsIntent(msg),
    eventsSignal: looksLikeEventsIntent(msg),
    toolsSignal: looksLikeToolsIntent(msg),
    pricingSignal: looksLikePriceIntent(msg),
    xSignal: looksLikeXIntent(msg),
    webSignal: looksLikeWebIntent(msg),
    capabilityQuestionSignal: looksLikeCapabilityQuestion(msg),
    communityIdentityQuestionSignal: looksLikeCommunityIdentityQuestion(msg),
    systemQuestionSignal: looksLikeSystemQuestion(msg),
    directQuestionSignal: looksLikeDirectQuestion(messageRaw),
  };
}

function inferRouteDecision(args: {
  raw: string;
  msg: string;
  signals: CommunitySignals;
  community: CommunityContext;
}): RouteDecision {
  const { signals, community } = args;

  if (signals.meaningSignal && community.isWAOC) {
    return { intent: "meaning", confidence: 0.99, suggestedAction: "none", reason: "waoc_meaning" };
  }
  if (signals.linksSignal) {
    return { intent: "links", confidence: 0.98, suggestedAction: "/links", reason: "links_match" };
  }
  if (signals.helpSignal) {
    return { intent: "help", confidence: 0.98, suggestedAction: "/help", reason: "help_match" };
  }
  if (signals.capabilityQuestionSignal) {
    return { intent: "capability", confidence: 0.95, suggestedAction: "none", reason: "capability_match" };
  }
  if (signals.communityIdentityQuestionSignal) {
    return { intent: "community", confidence: 0.95, suggestedAction: "none", reason: "community_match" };
  }
  if (signals.systemQuestionSignal) {
    return { intent: "system", confidence: 0.95, task: "knowledge_agent", suggestedAction: "/knowledge", reason: "system_match" };
  }
  if (signals.newsSignal) {
    return { intent: "news", confidence: 0.95, task: "news_agent", suggestedAction: "/news", reason: "news_agent_route" };
  }
  if (signals.pricingSignal) {
    return { intent: "price", confidence: 0.95, task: "price_agent", suggestedAction: "/price", reason: "price_agent_route" };
  }
  if (signals.xSignal) {
    return { intent: "x", confidence: 0.95, task: "x_agent", suggestedAction: "/x", reason: "x_agent_route" };
  }
  if (signals.webSignal) {
    return { intent: "web", confidence: 0.95, task: "oneclaw_execute", suggestedAction: "/web", reason: "oneclaw_execute_route" };
  }
  if (signals.reportSignal) {
    return { intent: "report", confidence: 0.92, task: "report_agent", suggestedAction: "/report", reason: "report_match" };
  }
  if (signals.rankSignal) {
    return { intent: "rank", confidence: 0.92, suggestedAction: "/rank", reason: "rank_match" };
  }
  if (signals.missionSignal) {
    return { intent: "mission", confidence: 0.91, task: "mission", suggestedAction: "/mission", reason: "mission_match" };
  }
  if (signals.builderSignal) {
    return { intent: "builder", confidence: 0.88, task: "builder_agent", suggestedAction: "/builders", reason: "builder_match" };
  }
  if (signals.knowledgeSignal) {
    return { intent: "knowledge", confidence: 0.88, task: "knowledge_agent", suggestedAction: "/knowledge", reason: "knowledge_match" };
  }
  if (signals.growthSignal) {
    return { intent: "growth", confidence: 0.88, task: "growth_agent", suggestedAction: "/growth", reason: "growth_match" };
  }
  if (signals.eventsSignal) {
    return { intent: "events", confidence: 0.85, suggestedAction: "/events", reason: "events_match" };
  }
  if (signals.toolsSignal) {
    return { intent: "tools", confidence: 0.85, suggestedAction: "/tools", reason: "tools_match" };
  }

  return { intent: "general", confidence: 0.50, suggestedAction: "none", reason: "general_fallback" };
}

function quickAutoReply(args: {
  msg: string;
  lang: "en" | "zh" | "mixed";
  community: CommunityContext;
}): WaocChatData | null {
  const { msg, lang, community } = args;

  if (looksLikeMeaningQuestion(msg) && community.isWAOC) {
    return {
      reply:
        lang === "zh"
          ? "WAOC = We Are One Connection。\n它更像一个围绕协作、贡献、builder、mission 和长期生态增长展开的网络。"
          : "WAOC = We Are One Connection.\nIt is a network centered on coordination, contribution, builders, missions, and long-term ecosystem growth.",
      suggestedAction: "none",
    };
  }

  if (looksLikeHelpQuestion(msg)) {
    return {
      reply:
        lang === "zh"
          ? "你可以直接问我：项目是什么、怎么开始、有哪些链接、builder / mission / rank / report，也可以问新闻、价格、X、网页。"
          : "You can ask what the project is, how to start, official links, builder/mission/rank/report, or ask about news, price, X, and web content.",
      suggestedAction: "/help",
    };
  }

  return null;
}

function parseThreadMemory(value: unknown): ThreadMemory {
  if (!value) return {};
  if (typeof value === "object") return value as ThreadMemory;

  try {
    return JSON.parse(String(value)) as ThreadMemory;
  } catch {
    return {};
  }
}

function summarizeRecentForTopic(recentMessages: string, max = 8): string[] {
  return norm(recentMessages)
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(-max);
}
function safeParse(output: string) {
  try {
    return JSON.parse(output);
  } catch {
    const match = output.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("INVALID_JSON");
  }
}

function buildThreadMemory(args: {
  message: string;
  recentMessages: string;
  previous: ThreadMemory;
  signals: CommunitySignals;
  route: RouteDecision;
}): ThreadMemory {
  const { message, recentMessages, previous, signals, route } = args;
  const raw = norm(message);
  const lines = summarizeRecentForTopic(recentMessages, 6);
  const recentTail = lines.join(" | ");

  const next: ThreadMemory = { ...previous };

  if (route.intent === "mission") {
    next.topic = next.topic || "mission planning";
  } else if (route.intent === "builder") {
    next.topic = next.topic || "builder coordination";
  } else if (route.intent === "growth") {
    next.topic = next.topic || "growth discussion";
  } else if (route.intent === "knowledge") {
    next.topic = next.topic || "knowledge explanation";
  } else if (route.intent === "report") {
    next.topic = next.topic || "report / summary";
  } else if (route.intent === "news") {
    next.topic = next.topic || "latest updates";
  } else if (route.intent === "price") {
    next.topic = next.topic || "market / price";
  } else if (route.intent === "x") {
    next.topic = next.topic || "x / twitter analysis";
  } else if (route.intent === "web") {
    next.topic = next.topic || "web content analysis";
  }

  if (signals.directQuestionSignal) {
    next.currentQuestion = raw;
  }

  if (/goal|objective|target|目标|目的/.test(lower(raw))) {
    next.currentGoal = raw;
  }

  if (/next step|下一步|怎么执行|落地|owner|谁来做|who should own/.test(lower(raw))) {
    next.mood = "executing";
    next.nextStep = raw;
  } else if (signals.directQuestionSignal) {
    next.mood = "deciding";
  } else {
    next.mood = next.mood || "open";
  }

  if (!next.topic && recentTail) {
    next.topic = recentTail.slice(0, 160);
  }

  return next;
}

function updateThreadMemoryFromReply(args: {
  previous: ThreadMemory;
  reply: string;
  message: string;
  route: RouteDecision;
}): ThreadMemory {
  const { previous, reply, message, route } = args;
  const next: ThreadMemory = { ...previous };
  const cleanReply = norm(reply);
  const msg = lower(message);

  if (cleanReply) {
    next.latestConclusion = cleanReply.split("\n")[0]?.slice(0, 240) || next.latestConclusion;
  }

  if (
    route.intent === "mission" ||
    /next step|owner|deliverable|任务|执行|落地/.test(msg)
  ) {
    next.mood = "executing";
  }

  const lowerReply = lower(cleanReply);

  if (/owner|由.+负责|谁来做|谁负责/.test(lowerReply)) {
    next.ownerHint = cleanReply.split("\n")[0]?.slice(0, 160) || next.ownerHint;
  }

  if (/next step|下一步|first step|先做/.test(lowerReply)) {
    next.nextStep = cleanReply.split("\n")[0]?.slice(0, 180) || next.nextStep;
  }

  return next;
}

async function persistThreadMemory(args: {
  ctx: WaocChatCtx;
  memory: ThreadMemory;
}) {
  const { ctx, memory } = args;
  const chatId = (ctx as any)?.meta?.chatId || (ctx as any)?.chatId || (ctx as any)?.input?.chatId;
  if (!chatId) return;

  try {
    await runTask("memory_store", {
      namespace: "waoc_chat_thread_memory",
      key: String(chatId),
      value: safeJson(memory),
    });
  } catch {
    // optional persistence
  }
}

async function readThreadMemory(args: {
  ctx: WaocChatCtx;
}): Promise<ThreadMemory> {
  const chatId = (args.ctx as any)?.meta?.chatId || (args.ctx as any)?.chatId || (args.ctx as any)?.input?.chatId;
  if (!chatId) return {};

  try {
    const res = await runTask("memory_read", {
      namespace: "waoc_chat_thread_memory",
      key: String(chatId),
    });

    return parseThreadMemory(res?.data?.value ?? "");
  } catch {
    return {};
  }
}

export const waocChatWorkflowDef: WorkflowDefinition<WaocChatCtx> = {
  name: "waoc_chat_workflow",
  maxAttempts: 3,
  steps: [
    // step 1: quick reply
    async (ctx: WaocChatCtx) => {
      const raw = norm(ctx.input?.message);
      const msg = lower(raw);
      const lang: "en" | "zh" | "mixed" =
        ctx.input?.lang === "zh" ? "zh" : ctx.input?.lang === "mixed" ? "mixed" : "en";

      const community = inferCommunityContext(ctx.input);
      ctx.__community = community;

      const quick = quickAutoReply({ msg, lang, community });
      if (quick) {
        ctx.data = checkWaocChatConstraintsSafe({
          data: quick,
          userMessage: ctx.input.message,
          lang: toConstraintLang(ctx.input.lang),
        }).data;

        ctx.data.reply = finalizeReply(ctx.data.reply, lang);
        return { ok: true, stop: true } as any;
      }

      return { ok: true };
    },

    // step 2: build lightweight thread memory
    async (ctx: WaocChatCtx) => {
      const raw = norm(ctx.input?.message);
      const previous =
        parseThreadMemory(ctx.input?.threadMemory) ||
        (await readThreadMemory({ ctx }));

      const community = ctx.__community ?? inferCommunityContext(ctx.input);
      const signals = detectSignals(raw);
      const route = inferRouteDecision({
        raw,
        msg: lower(raw),
        signals,
        community,
      });

      ctx.__signals = signals;
      ctx.__route = route;
      ctx.__threadMemory = buildThreadMemory({
        message: raw,
        recentMessages: norm(ctx.input?.recentMessages ?? ""),
        previous,
        signals,
        route,
      });

      return { ok: true };
    },

    // step 3: prompt
    preparePromptStep<WaocChatInput, WaocChatData>({
      task: "waoc_chat",
      templateVersion: WAOC_CHAT_TEMPLATE_VERSION,
      variables: (input: WaocChatInput, ctx?: any): Record<string, string> => {
        const c = ctx as WaocChatCtx | undefined;
        const community = c?.__community ?? inferCommunityContext(input);
        const signals = c?.__signals ?? detectSignals(input.message);
        const route =
          c?.__route ??
          inferRouteDecision({
            raw: input.message,
            msg: lower(input.message),
            signals,
            community,
          });

        const threadMemory =
          c?.__threadMemory ??
          parseThreadMemory(input.threadMemory);

        return {
          lang: norm(input.lang ?? "en"),
          message: norm(input.message),
          recentMessages: norm(input.recentMessages ?? ""),
          communityContext: safeJson(community),
          detectedSignals: safeJson(signals),
          aiRouteDecision: safeJson(route),
          threadMemory: safeJson(threadMemory),
          memory: norm(input.memory ?? ""),
        };
      },
    }),

    // step 4-8: llm chain
    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => {
        const checked = checkWaocChatConstraintsSafe({
          data: ctx.data as any,
          userMessage: ctx.input?.message,
          lang: toConstraintLang(ctx.input?.lang),
        });

        ctx.data = checked.data;
        return { ok: true, errors: [] };
      },
      extraInstruction:
        'Return ONLY valid JSON: {"reply":"...","suggestedAction":"..."}.\n' +
        '- suggestedAction MUST be one of: "none", "/links", "/help", "/mission", "/rank", "/report", "/builders", "/knowledge", "/growth", "/news", "/events", "/tools", "/price", "/x", "/web".\n' +
        "- reply is required and must directly answer the current message.\n" +
        "- Keep reply concise and natural.\n" +
        "- Use threadMemory to avoid repeating already-set conclusions.\n" +
        "- Do not auto-ask generic follow-up questions unless truly necessary.\n" +
        "- Do not fabricate price/news/X/web facts.\n" +
        "- In WAOC scope, WAOC MUST mean only 'We Are One Connection'.\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    // step 9: agent routing
    async (ctx: WaocChatCtx) => {
      if (!ctx.data) ctx.data = { reply: "", suggestedAction: "none" };

      const raw = norm(ctx.input.message);
      const lang: "en" | "zh" | "mixed" =
        ctx.input.lang === "zh" ? "zh" : ctx.input.lang === "mixed" ? "mixed" : "en";

      const community = ctx.__community ?? inferCommunityContext(ctx.input);
      const route =
        ctx.__route ??
        inferRouteDecision({
          raw,
          msg: lower(raw),
          signals: ctx.__signals ?? detectSignals(raw),
          community,
        });

      if (route.task) {
        try {
          const taskInput: any = {
            message: raw,
            lang,
            recentMessages: norm(ctx.input.recentMessages ?? ""),
            memory: norm(ctx.input.memory ?? ""),
            threadMemory: safeJson(ctx.__threadMemory ?? {}),
            communityName: community.communityName,
            communityIdentity: community.communityIdentity,
            communityNarrative: community.communityNarrative,
            communityFocus: community.communityFocus,
            ecosystemContext: community.ecosystemContext,
            officialLinks: community.officialLinks,
          };

          const r = await runTask(route.task, taskInput, {
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
              ctx.data.reply = answer;
              ctx.data.suggestedAction = ensureAllowedAction(
                r.data?.suggestedAction ?? route.suggestedAction
              );
            } else if ((ctx.data.suggestedAction ?? "none") === "none") {
              ctx.data.suggestedAction = route.suggestedAction;
            }
          } else if ((ctx.data.suggestedAction ?? "none") === "none") {
            ctx.data.suggestedAction = route.suggestedAction;
          }
        } catch {
          if ((ctx.data.suggestedAction ?? "none") === "none") {
            ctx.data.suggestedAction = route.suggestedAction;
          }
        }
      } else if ((ctx.data.suggestedAction ?? "none") === "none") {
        ctx.data.suggestedAction = route.suggestedAction;
      }

      const checked = checkWaocChatConstraintsSafe({
        data: ctx.data,
        userMessage: ctx.input.message,
        lang: toConstraintLang(ctx.input.lang),
      });

      ctx.data = checked.data;
      ctx.data.reply = finalizeReply(ctx.data.reply, lang);
      ctx.data.suggestedAction = ensureAllowedAction(ctx.data.suggestedAction ?? "none");

      return { ok: true };
    },

    // step 10: save thread memory
    async (ctx: WaocChatCtx) => {
      const updated = updateThreadMemoryFromReply({
        previous: ctx.__threadMemory ?? {},
        reply: ctx.data?.reply ?? "",
        message: ctx.input?.message ?? "",
        route:
          ctx.__route ??
          {
            intent: "general",
            confidence: 0.5,
            suggestedAction: "none",
            reason: "fallback",
          },
      });

      ctx.__threadMemory = updated;
      await persistThreadMemory({ ctx, memory: updated });

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});