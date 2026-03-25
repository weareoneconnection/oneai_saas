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
import { checkWaocChatConstraints } from "../constraints/waocChatConstraints.js";

/* =========================
   Constants
========================= */

const WAOC_CHAT_TEMPLATE_VERSION =4;

export type WaocSuggestedAction =
  | "none"
  | "/links"
  | "/mission"
  | "/rank"
  | "/report"
  | "/builders"
  | "/knowledge"
  | "/growth"
  | "/news"
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
  "/mission",
  "/rank",
  "/report",
  "/builders",
  "/knowledge",
  "/growth",
  "/news",
  "/price",
  "/x",
  "/web",
];

const COORDINATION_GAP_APPEND_RATE = 0.14;
const MOMENTUM_APPEND_RATE = 0.12;
const LIGHT_REDIRECT_RATE = 0.08;

/* =========================
   Types
========================= */

export type WaocChatInput = {
  message: string;
  context?: "community" | "mission" | "philosophy" | "general";
  lang?: "en" | "zh" | "mixed";
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

  roomState?:
    | "quiet"
    | "active"
    | "builder_dense"
    | "newcomer_wave"
    | "noisy"
    | "mixed"
    | "tense"
    | null;

  momentumHint?:
    | "starting"
    | "building"
    | "focused"
    | "drifting"
    | "repetitive"
    | "cooling"
    | "unclear"
    | "dormant"
    | "weak"
    | "emerging"
    | "fragmented"
    | "noisy"
    | null;

  communityName?: string;
  communityIdentity?: string;
  communityNarrative?: string;
  communityFocus?: string;
  ecosystemContext?: string;
  officialLinks?: string;
};

type WaocChatCtx = WorkflowContext<WaocChatInput, WaocChatData> & {
  templateVersion: number;
};

type QuestionType = "community" | "system" | "capability" | "growth" | "general";

type ResponseDepth = "minimal" | "normal" | "full";

type MomentumState =
  | "dormant"
  | "weak"
  | "emerging"
  | "building"
  | "focused"
  | "repetitive"
  | "noisy"
  | "fragmented";

type OperatorMode =
  | "chat"
  | "question"
  | "builder"
  | "contributor"
  | "mission"
  | "onboarding"
  | "knowledge"
  | "growth"
  | "noise"
  | "news"
  | "price"
  | "x"
  | "web";

type CommunitySignals = {
  meaningSignal: boolean;
  builderSignal: boolean;
  contributorSignal: boolean;
  collaborationSignal: boolean;
  missionSignal: boolean;
  missionOpportunitySignal: boolean;
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
  selfOrganizingSignal: boolean;
  orientationSignal: boolean;
  builderQuestionSignal: boolean;
  pricingSignal: boolean;
  capabilityQuestionSignal: boolean;
  communityIdentityQuestionSignal: boolean;
  systemQuestionSignal: boolean;
  directQuestionSignal: boolean;
  waocExplicitSignal: boolean;
  newsSignal: boolean;
  xSignal: boolean;
  webSignal: boolean;
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
  | "low_activity"
  | "organization_window"
  | "news_window"
  | "price_window"
  | "x_window"
  | "web_window";

type CoordinationGap =
  | "none"
  | "builder_without_mission"
  | "mission_without_owner"
  | "knowledge_not_captured"
  | "growth_without_execution"
  | "repeated_problem_without_owner";

type ConversationMomentum =
  | "starting"
  | "building"
  | "focused"
  | "drifting"
  | "repetitive"
  | "cooling"
  | "unclear";

type InferredRoomState =
  | "quiet"
  | "active"
  | "builder_dense"
  | "newcomer_wave"
  | "noisy"
  | "mixed"
  | "tense";

type NetworkContext = {
  builderDensity: number;
  missionMomentum: number;
  knowledgeDensity: number;
  insightDensity: number;
  growthDensity: number;
  newcomerDensity: number;
  noiseLevel: number;
  executionDensity: number;
  organizationDensity: number;
  collaborationDensity: number;
  coordinationState: RuntimeState;
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

type CoordinationIntelligence = {
  roomState: InferredRoomState;
  momentum: ConversationMomentum;
  v22Momentum: MomentumState;
  gap: CoordinationGap;
  preferredAction: WaocSuggestedAction;
  shouldStayMinimal: boolean;
  shouldLightRedirect: boolean;
  shouldAvoidRouting: boolean;
  coordinationPriority: "low" | "medium" | "high";
  responseDepth: ResponseDepth;
  operatorMode: OperatorMode;
  questionType: QuestionType;
  missionOpportunity: boolean;
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

function safeJson(value: any) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
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

function toConstraintLang(
  lang: "en" | "zh" | "mixed" | undefined
): "en" | "zh" | undefined {
  if (lang === "zh") return "zh";
  if (lang === "en") return "en";
  if (lang === "mixed") return "en";
  return undefined;
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

function inferCommunityContext(input: WaocChatInput): CommunityContext {
  const defaults = getOfficialLinks();

  const communityName = norm(input.communityName);
  const communityIdentity = norm(input.communityIdentity);
  const communityNarrative = norm(input.communityNarrative);
  const communityFocus = norm(input.communityFocus);
  const ecosystemContext = norm(input.ecosystemContext);
  const officialLinks =
    norm(input.officialLinks) ||
    (defaults.links.length ? defaults.links.join(" | ") : "");

  const hasCommunityContext = Boolean(
    communityName ||
      communityIdentity ||
      communityNarrative ||
      communityFocus ||
      ecosystemContext
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

/* =========================
   Intent helpers
========================= */

function looksLikeMeaningQuestion(msgLower: string) {
  return (
    /\bwaoc\b.*(\bmeaning\b|\bmean\b|\bmeans\b|\bacronym\b|\bfull\s*form\b|\bexpand(ed)?\b|\bstand(?:s|ing)?\s+for\b)/.test(
      msgLower
    ) ||
    /\bwhat\s+(does|is|’s|'s)\s+waoc\s+(mean|meaning|stand(?:s|ing)?\s+for)\b/.test(
      msgLower
    ) ||
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
    msgLower.includes("announcement") ||
    msgLower.includes("what's new") ||
    msgLower.includes("最新") ||
    msgLower.includes("新闻") ||
    msgLower.includes("动态") ||
    msgLower.includes("公告") ||
    msgLower.includes("有什么消息") ||
    msgLower.includes("进展") ||
    msgLower.includes("更新")
  );
}

function looksLikePriceQuestion(msgLower: string) {
  return (
    /\bprice\b/.test(msgLower) ||
    /\bmarket cap\b/.test(msgLower) ||
    /\bchart\b/.test(msgLower) ||
    /\bvaluation\b/.test(msgLower) ||
    /\btoken price\b/.test(msgLower) ||
    /价格|币价|行情|市值|估值|走势图/.test(msgLower)
  );
}

function looksLikeXQuestion(msgLower: string) {
  return (
    /\bx\.com\b/.test(msgLower) ||
    /\btwitter\b/.test(msgLower) ||
    /\btweet\b/.test(msgLower) ||
    /\baccount\b/.test(msgLower) ||
    /@[a-z0-9_]{1,15}\b/i.test(msgLower) ||
    /推特|账号|推文|X账号|X 帐号/.test(msgLower)
  );
}

function looksLikeWebQuestion(msgLower: string) {
  return (
    /\bhttps?:\/\//.test(msgLower) ||
    /\bwebsite\b/.test(msgLower) ||
    /\bweb page\b/.test(msgLower) ||
    /\barticle\b/.test(msgLower) ||
    /\blink\b/.test(msgLower) ||
    /网页|文章|网址|链接|网站/.test(msgLower)
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
    /generate.*mission|create.*mission|写.*任务|生成.*任务|给我.*mission/.test(
      msgLower
    )
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
    looksLikePriceQuestion(msgLower) ||
    /market|pump|dump|listing|partner|partnership|verify|scam|真假|今天|现在|上所|合作|验证|防骗/.test(
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
  return /growth|campaign|distribution|retention|twitter|x\.com|增长|传播|留存|活动|adoption|traction|expansion|community building/.test(
    msgLower
  );
}

function looksLikeBuilderIntent(msgLower: string) {
  return /builder|developer|dev|build|building|repo|code|tracker|dashboard|tool|workflow|app|bot|开发者|构建者|代码|开发|工具|系统/.test(
    msgLower
  );
}

function looksLikeOrientationQuestion(msgLower: string) {
  return (
    /where to start|how to start|start here|how do i join|how to join|new here|help|guide me|what should i do first|i'm new/.test(
      msgLower
    ) || /怎么开始|怎么加入|新来的|新人|怎么参与|从哪里开始|入门/.test(msgLower)
  );
}

function looksLikeRankingQuestion(msgLower: string) {
  return /rank|ranking|leaderboard|score|points|排行榜|排名|积分/.test(msgLower);
}

function looksLikeCapabilityQuestion(msgLower: string) {
  return (
    /what can you do|who are you|how can you help|what do you do|你的作用|你能做什么|你是谁|你可以帮什么|what can you do in details|what can you do in detail/.test(
      msgLower
    )
  );
}

function looksLikeCommunityIdentityQuestion(msgLower: string) {
  return (
    /what is this community|what is this about|what is this project|what is this group|这个社区是干什么的|这是做什么的|这个项目是做什么的/.test(
      msgLower
    )
  );
}

function looksLikeSystemQuestion(msgLower: string) {
  return (
    /how does this system work|how does oneai work|how does this work|how does it work|how does the system operate|how do you operate|这个系统怎么运作|这个系统怎么工作|oneai怎么运作|这个是怎么工作的/.test(
      msgLower
    )
  );
}

function looksLikeDirectQuestion(msgRaw: string) {
  const msg = norm(msgRaw);
  const m = lower(msgRaw);
  return (
    msg.includes("?") ||
    /^(what|how|why|who|when|where|which|can|should|is|are|do|does)\b/.test(m) ||
    /^(什么|怎么|为什么|谁|哪里|哪个|是否|能不能|是不是)/.test(m)
  );
}

function inferQuestionType(msgRaw: string): QuestionType {
  const m = lower(msgRaw);
  if (looksLikeSystemQuestion(m)) return "system";
  if (looksLikeCommunityIdentityQuestion(m)) return "community";
  if (looksLikeCapabilityQuestion(m)) return "capability";
  if (looksLikeGrowthIntent(m)) return "growth";
  return "general";
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

  const meaningSignal = looksLikeMeaningQuestion(msg);

  const builderSignal =
    /build|building|ship|shipping|code|repo|dev|deploy|architecture|tool|api|infra|dashboard|bot|tracker|workflow|app|feature|system|开发|代码|部署|架构|工具|系统|功能/.test(
      joined
    );

  const contributorSignal =
    /shipped|deployed|delivered|completed|finished|launched|made this|pushed|updated|wrote|designed|researched|已完成|已经部署|交付了|上线了|做完了|我做了|我更新了|我写了|我设计了|我研究了/.test(
      joined
    );

  const collaborationSignal =
    /anyone interested|looking for|need help|contributors|collaborate|work together|join me|who wants to help|一起做|一起搞|一起做这个|找人一起|需要帮手|谁愿意一起/.test(
      joined
    );

  const missionSignal =
    /mission|task|objective|execute|execution|deliver|milestone|任务|目标|执行|交付|里程碑|落地/.test(
      joined
    );

  const missionOpportunitySignal =
    /someone should|we should|needs to be done|worth doing|actionable|small mission|值得做|应该做|有人来做|需要有人做|可以搞一个|可以做成任务/.test(
      joined
    );

  const knowledgeSignal =
    /guide|faq|playbook|template|docs|documentation|lesson|framework|strategy|method|经验|方法|文档|指南|模板|框架|原理|怎么运作|如何工作/.test(
      joined
    );

  const insightSignal =
    /pattern|lesson|insight|bottleneck|not working|working|重复问题|规律|经验|洞察|瓶颈|问题反复|failed approach|working strategy/.test(
      joined
    );

  const growthSignal =
    /growth|grow|distribution|content|campaign|twitter|x\.com|community growth|retention|adoption|traction|expansion|community building|增长|传播|内容|活动|留存|增长计划|扩张/.test(
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
    /what is|how to join|how do i join|start here|help|guide me|new here|i'm new|新人|新手|怎么加入|怎么开始|帮助|入门/.test(
      joined
    );

  const conflictSignal =
    /idiot|stupid|trash|fuck|傻逼|滚|闭嘴|骗子|诈骗|吵|撕|喷/.test(joined);

  const noiseSignal =
    /airdrop|ref|join now|free|claim|moon|x10|x100|梭哈|空投|暴涨|起飞|wen moon|to the moon/.test(
      joined
    );

  const crossCommunityHint =
    /other community|another community|cross-community|shared problem|shared mission|另一个社区|跨社区|别的社区|共同问题|共同任务/.test(
      joined
    );

  const operatorSignal =
    /ops|operator|moderation|manage|coordination|community plan|协调|管理|运营|治理|流程|社区计划/.test(
      joined
    );

  const executionSignal =
    /shipped|deployed|delivered|completed|finished|launched|已完成|已经部署|交付了|上线了|做完了/.test(
      joined
    );

  const selfOrganizingSignal =
    /owner|ownership|owner type|who should own|collaboration opportunity|coordination gap|structure|next step|owner|负责人|谁来负责|协作机会|协调缺口|结构化|下一步/.test(
      joined
    );

  const orientationSignal = looksLikeOrientationQuestion(msg);
  const builderQuestionSignal =
    /who is building|who are the builders|who is the dev|谁在构建|谁在开发|有哪些 builder/.test(
      joined
    );
  const pricingSignal = looksLikePriceQuestion(joined);
  const capabilityQuestionSignal = looksLikeCapabilityQuestion(msg);
  const communityIdentityQuestionSignal =
    looksLikeCommunityIdentityQuestion(msg);
  const systemQuestionSignal = looksLikeSystemQuestion(msg);
  const directQuestionSignal = looksLikeDirectQuestion(messageRaw);
  const waocExplicitSignal =
    /\bwaoc\b|we are one connection|WAOC|We Are One Connection/.test(messageRaw);

  const newsSignal = looksLikeNewsQuestion(msg);
  const xSignal = looksLikeXQuestion(msg);
  const webSignal = looksLikeWebQuestion(msg);

  return {
    meaningSignal,
    builderSignal,
    contributorSignal,
    collaborationSignal,
    missionSignal,
    missionOpportunitySignal,
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
    selfOrganizingSignal,
    orientationSignal,
    builderQuestionSignal,
    pricingSignal,
    capabilityQuestionSignal,
    communityIdentityQuestionSignal,
    systemQuestionSignal,
    directQuestionSignal,
    waocExplicitSignal,
    newsSignal,
    xSignal,
    webSignal,
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
    /build|building|ship|code|repo|deploy|bot|dashboard|tracker|app|tool|workflow|开发|部署|代码/g,
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
    /growth|campaign|distribution|retention|adoption|traction|expansion|增长|传播|留存/g,
    text
  );

  const newcomerDensity = countMatches(
    /what is|how to join|help|new here|i'm new|新手|怎么加入|帮助|入门/g,
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

  const organizationDensity = countMatches(
    /owner|ownership|coordination gap|structure|next step|负责人|协作|协调缺口|结构化|下一步/g,
    text
  );

  const collaborationDensity = countMatches(
    /anyone interested|looking for|collaborate|work together|join me|一起做|找人一起|谁愿意一起/g,
    text
  );

  let coordinationState: RuntimeState = "general";

  if (!text || text.length < 50) {
    coordinationState = "low_activity";
  } else if (looksLikePriceQuestion(text)) {
    coordinationState = "price_window";
  } else if (looksLikeNewsQuestion(text)) {
    coordinationState = "news_window";
  } else if (looksLikeXQuestion(text)) {
    coordinationState = "x_window";
  } else if (looksLikeWebQuestion(text)) {
    coordinationState = "web_window";
  } else if (noiseLevel >= 3) {
    coordinationState = "high_noise";
  } else if (
    /idiot|stupid|trash|fuck|傻逼|滚|闭嘴|骗子|诈骗|吵|撕|喷/.test(text)
  ) {
    coordinationState = "conflict";
  } else if (/rug|rugpull|跑路|割韭菜|归零|崩盘|砸盘|fud/.test(text)) {
    coordinationState = "fud_risk";
  } else if (organizationDensity >= 2) {
    coordinationState = "organization_window";
  } else if (growthDensity >= 2) {
    coordinationState = "growth_window";
  } else if (newcomerDensity >= 2) {
    coordinationState = "newcomer_window";
  } else if (insightDensity >= 2) {
    coordinationState = "insight_window";
  } else if (knowledgeDensity >= 2) {
    coordinationState = "knowledge_window";
  } else if (builderDensity >= 2 && (missionMomentum >= 1 || collaborationDensity >= 1)) {
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
    organizationDensity,
    collaborationDensity,
    coordinationState,
  };
}

/* =========================
   Room / Momentum / Depth
========================= */

function inferRoomState(
  messageRaw: string,
  recentMessagesRaw: string,
  network: NetworkContext,
  explicit?: WaocChatInput["roomState"]
): InferredRoomState {
  if (explicit) return explicit;

  const text = lower(`${messageRaw}\n${recentMessagesRaw}`);

  if (/idiot|stupid|trash|fuck|傻逼|滚|闭嘴|骗子|诈骗|吵|撕|喷/.test(text)) {
    return "tense";
  }

  if (network.noiseLevel >= 3) return "noisy";
  if (network.builderDensity >= 3) return "builder_dense";
  if (network.newcomerDensity >= 2) return "newcomer_wave";

  const lines = text.split("\n").map((x) => x.trim()).filter(Boolean);
  if (lines.length <= 2) return "quiet";
  if (lines.length >= 12) return "active";

  return "mixed";
}

function inferConversationMomentum(
  input: WaocChatInput,
  messageRaw: string,
  recentMessagesRaw: string,
  signals: CommunitySignals,
  network: NetworkContext
): ConversationMomentum {
  if (
    input.momentumHint === "starting" ||
    input.momentumHint === "building" ||
    input.momentumHint === "focused" ||
    input.momentumHint === "drifting" ||
    input.momentumHint === "repetitive" ||
    input.momentumHint === "cooling" ||
    input.momentumHint === "unclear"
  ) {
    return input.momentumHint;
  }

  const msg = lower(messageRaw);
  const recent = lower(recentMessagesRaw);
  const lines = recent.split("\n").map((x) => x.trim()).filter(Boolean);
  const shortLines = lines.filter((l) => l.length <= 10).length;

  if (!recent || recent.length < 30) return "starting";
  if (signals.conflictSignal) return "drifting";
  if (network.noiseLevel >= 3) return "repetitive";

  if (
    network.builderDensity >= 2 &&
    (network.missionMomentum >= 1 || network.executionDensity >= 1 || network.collaborationDensity >= 1)
  ) {
    return "building";
  }

  if (
    network.knowledgeDensity >= 2 ||
    network.insightDensity >= 2 ||
    network.organizationDensity >= 2 ||
    signals.newsSignal ||
    signals.pricingSignal ||
    signals.xSignal ||
    signals.webSignal
  ) {
    return "focused";
  }

  if (
    shortLines / Math.max(lines.length, 1) > 0.6 &&
    lines.length >= 8 &&
    !signals.builderSignal &&
    !signals.knowledgeSignal
  ) {
    return "repetitive";
  }

  if (/ok|k|nice|cool|gm|gn|haha|lol|嗯|好|哈哈/.test(msg) && msg.length <= 20) {
    return "cooling";
  }

  if (
    network.growthDensity === 0 &&
    network.builderDensity === 0 &&
    network.knowledgeDensity === 0 &&
    network.missionMomentum === 0
  ) {
    return "unclear";
  }

  return "drifting";
}

function mapV22Momentum(
  roomState: InferredRoomState,
  momentum: ConversationMomentum,
  network: NetworkContext
): MomentumState {
  if (roomState === "noisy") return "noisy";
  if (network.noiseLevel >= 3) return "noisy";
  if (momentum === "repetitive") return "repetitive";
  if (momentum === "focused") return "focused";
  if (momentum === "building") return "building";
  if (momentum === "starting" && network.builderDensity + network.collaborationDensity + network.missionMomentum >= 1) {
    return "emerging";
  }
  if (momentum === "starting") return "dormant";
  if (momentum === "cooling") return "weak";
  if (momentum === "drifting") return "fragmented";
  return "weak";
}

function inferResponseDepth(
  signals: CommunitySignals,
  questionType: QuestionType,
  roomState: InferredRoomState,
  momentum: ConversationMomentum
): ResponseDepth {
  if (
    signals.directQuestionSignal ||
    questionType === "community" ||
    questionType === "system" ||
    questionType === "capability" ||
    questionType === "growth" ||
    signals.knowledgeSignal ||
    signals.meaningSignal ||
    signals.newsSignal ||
    signals.pricingSignal ||
    signals.xSignal ||
    signals.webSignal
  ) {
    return "full";
  }

  if (
    signals.builderSignal ||
    signals.missionSignal ||
    signals.missionOpportunitySignal ||
    signals.contributorSignal ||
    signals.collaborationSignal ||
    signals.orientationSignal ||
    signals.growthSignal
  ) {
    return "normal";
  }

  if (
    roomState === "noisy" ||
    roomState === "tense" ||
    momentum === "repetitive" ||
    momentum === "cooling" ||
    signals.noiseSignal
  ) {
    return "minimal";
  }

  return "minimal";
}

function inferOperatorMode(signals: CommunitySignals, questionType: QuestionType): OperatorMode {
  if (signals.newsSignal) return "news";
  if (signals.pricingSignal) return "price";
  if (signals.xSignal) return "x";
  if (signals.webSignal) return "web";
  if (signals.noiseSignal) return "noise";
  if (signals.orientationSignal || signals.newcomerSignal) return "onboarding";
  if (
    signals.knowledgeSignal ||
    signals.meaningSignal ||
    questionType === "community" ||
    questionType === "system" ||
    questionType === "capability"
  ) {
    return "knowledge";
  }
  if (questionType === "growth" || signals.growthSignal) return "growth";
  if (signals.missionSignal || signals.missionOpportunitySignal) return "mission";
  if (signals.builderSignal) return "builder";
  if (signals.contributorSignal || signals.executionSignal) return "contributor";
  if (signals.directQuestionSignal) return "question";
  return "chat";
}

/* =========================
   Coordination / Mission opportunity
========================= */

function shouldSkipCoordinationGap(signals: CommunitySignals, msgLower: string) {
  return (
    signals.meaningSignal ||
    signals.verificationSignal ||
    signals.newsSignal ||
    signals.pricingSignal ||
    signals.xSignal ||
    signals.webSignal ||
    looksLikeMeaningQuestion(msgLower) ||
    looksLikeVerificationLikeQuestion(msgLower) ||
    looksLikeLinksQuestion(msgLower) ||
    looksLikeCAQuestion(msgLower) ||
    looksLikeCapabilityQuestion(msgLower) ||
    looksLikeCommunityIdentityQuestion(msgLower) ||
    looksLikeSystemQuestion(msgLower)
  );
}

function detectCoordinationGap(
  signals: CommunitySignals,
  network: NetworkContext,
  msgLower: string
): CoordinationGap {
  if (shouldSkipCoordinationGap(signals, msgLower)) {
    return "none";
  }

  if (
    signals.builderSignal &&
    !signals.missionSignal &&
    !signals.missionOpportunitySignal &&
    network.collaborationDensity === 0
  ) {
    return "builder_without_mission";
  }

  if (
    (signals.missionSignal || signals.missionOpportunitySignal) &&
    !signals.builderSignal &&
    network.builderDensity === 0
  ) {
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

function inferMissionOpportunity(
  signals: CommunitySignals,
  network: NetworkContext
): boolean {
  if (signals.missionSignal) return true;
  if (signals.missionOpportunitySignal && (signals.builderSignal || signals.collaborationSignal)) {
    return true;
  }
  if (signals.builderSignal && signals.collaborationSignal) return true;
  if (network.builderDensity >= 2 && (network.missionMomentum >= 1 || network.collaborationDensity >= 1)) {
    return true;
  }
  return false;
}

/* =========================
   Action Inference
========================= */

function inferPreferredAction(
  signals: CommunitySignals,
  network: NetworkContext,
  gap: CoordinationGap,
  questionType: QuestionType,
  missionOpportunity: boolean
): WaocSuggestedAction {
  if (signals.meaningSignal) return "none";
  if (signals.newsSignal) return "/news";
  if (signals.pricingSignal) return "/price";
  if (signals.xSignal) return "/x";
  if (signals.webSignal) return "/web";
  if (questionType === "capability") return "none";
  if (questionType === "community") return "none";
  if (questionType === "system") return "/knowledge";
  if (questionType === "growth") return "/growth";
  if (signals.orientationSignal || signals.newcomerSignal) return "/links";
  if (signals.verificationSignal) return "/links";

  if (gap === "builder_without_mission") return "/mission";
  if (gap === "mission_without_owner") return "/builders";
  if (gap === "knowledge_not_captured") return "/knowledge";
  if (gap === "growth_without_execution") return "/mission";
  if (gap === "repeated_problem_without_owner") return "/builders";

  if (signals.reportSignal) return "/report";
  if (signals.rankingSignal) return "/rank";
  if (signals.builderQuestionSignal || signals.collaborationSignal) return "/builders";
  if (signals.growthSignal || network.coordinationState === "growth_window") return "/growth";
  if (missionOpportunity) return "/mission";
  if (signals.builderSignal || signals.contributorSignal || network.builderDensity >= 2) return "/builders";
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
   Coordination Intelligence Layer
========================= */

function inferCoordinationIntelligence(args: {
  input: WaocChatInput;
  messageRaw: string;
  recentMessagesRaw: string;
  signals: CommunitySignals;
  network: NetworkContext;
}): CoordinationIntelligence {
  const { input, messageRaw, recentMessagesRaw, signals, network } = args;
  const msgLower = lower(messageRaw);

  const questionType = inferQuestionType(messageRaw);
  const gap = detectCoordinationGap(signals, network, msgLower);
  const roomState = inferRoomState(
    messageRaw,
    recentMessagesRaw,
    network,
    input.roomState
  );
  const momentum = inferConversationMomentum(
    input,
    messageRaw,
    recentMessagesRaw,
    signals,
    network
  );
  const v22Momentum = mapV22Momentum(roomState, momentum, network);
  const missionOpportunity = inferMissionOpportunity(signals, network);
  const responseDepth = inferResponseDepth(signals, questionType, roomState, momentum);
  const operatorMode = inferOperatorMode(signals, questionType);
  const preferredAction = inferPreferredAction(
    signals,
    network,
    gap,
    questionType,
    missionOpportunity
  );

  const shouldStayMinimal =
    roomState === "noisy" ||
    roomState === "tense" ||
    momentum === "repetitive" ||
    momentum === "cooling" ||
    signals.conflictSignal ||
    signals.noiseSignal;

  const shouldLightRedirect =
    (roomState === "noisy" || momentum === "drifting") &&
    !signals.meaningSignal &&
    !signals.verificationSignal &&
    !signals.builderSignal &&
    !signals.knowledgeSignal &&
    !signals.newsSignal &&
    !signals.pricingSignal &&
    !signals.xSignal &&
    !signals.webSignal &&
    !signals.capabilityQuestionSignal &&
    !signals.communityIdentityQuestionSignal &&
    !signals.systemQuestionSignal &&
    !signals.directQuestionSignal;

  const shouldAvoidRouting =
    (shouldStayMinimal && preferredAction === "none") ||
    roomState === "tense" ||
    (momentum === "cooling" && !signals.orientationSignal);

  let coordinationPriority: "low" | "medium" | "high" = "low";
  if (gap !== "none" || preferredAction !== "none" || missionOpportunity) {
    coordinationPriority = "medium";
  }
  if (
    gap === "mission_without_owner" ||
    gap === "builder_without_mission" ||
    gap === "knowledge_not_captured" ||
    missionOpportunity ||
    signals.newsSignal ||
    signals.pricingSignal ||
    signals.xSignal ||
    signals.webSignal
  ) {
    coordinationPriority = "high";
  }

  return {
    roomState,
    momentum,
    v22Momentum,
    gap,
    preferredAction,
    shouldStayMinimal,
    shouldLightRedirect,
    shouldAvoidRouting,
    coordinationPriority,
    responseDepth,
    operatorMode,
    questionType,
    missionOpportunity,
  };
}

/* =========================
   Prompt hints
========================= */

function buildSignalHint(signals: CommunitySignals, lang: "en" | "zh" | "mixed") {
  const tags: string[] = [];
  if (signals.meaningSignal) tags.push("meaning_signal");
  if (signals.builderSignal) tags.push("builder_signal");
  if (signals.contributorSignal) tags.push("contributor_signal");
  if (signals.collaborationSignal) tags.push("collaboration_signal");
  if (signals.missionSignal) tags.push("mission_signal");
  if (signals.missionOpportunitySignal) tags.push("mission_opportunity_signal");
  if (signals.knowledgeSignal) tags.push("knowledge_signal");
  if (signals.insightSignal) tags.push("insight_signal");
  if (signals.growthSignal) tags.push("growth_signal");
  if (signals.reportSignal) tags.push("report_signal");
  if (signals.rankingSignal) tags.push("ranking_signal");
  if (signals.newcomerSignal) tags.push("newcomer_signal");
  if (signals.orientationSignal) tags.push("orientation_signal");
  if (signals.builderQuestionSignal) tags.push("builder_question_signal");
  if (signals.capabilityQuestionSignal) tags.push("capability_question_signal");
  if (signals.communityIdentityQuestionSignal) tags.push("community_identity_question_signal");
  if (signals.systemQuestionSignal) tags.push("system_question_signal");
  if (signals.directQuestionSignal) tags.push("direct_question_signal");
  if (signals.verificationSignal) tags.push("verification_signal");
  if (signals.conflictSignal) tags.push("conflict_signal");
  if (signals.noiseSignal) tags.push("noise_signal");
  if (signals.crossCommunityHint) tags.push("cross_community_hint");
  if (signals.operatorSignal) tags.push("operator_signal");
  if (signals.executionSignal) tags.push("execution_signal");
  if (signals.selfOrganizingSignal) tags.push("self_organizing_signal");
  if (signals.pricingSignal) tags.push("pricing_signal");
  if (signals.waocExplicitSignal) tags.push("waoc_explicit_signal");
  if (signals.newsSignal) tags.push("news_signal");
  if (signals.xSignal) tags.push("x_signal");
  if (signals.webSignal) tags.push("web_signal");

  if (!tags.length) return "";

  if (lang === "zh") return `\n\n系统信号：${tags.join(", ")}`;
  if (lang === "mixed") return `\n\nSystem/系统 signals：${tags.join(", ")}`;
  return `\n\nSystem signals: ${tags.join(", ")}`;
}

function buildRuntimeHint(
  network: NetworkContext,
  intelligence: CoordinationIntelligence,
  lang: "en" | "zh" | "mixed"
) {
  const base =
    `state=${network.coordinationState}, roomState=${intelligence.roomState}, momentum=${intelligence.momentum}, v22Momentum=${intelligence.v22Momentum}, gap=${intelligence.gap}, preferredAction=${intelligence.preferredAction}, priority=${intelligence.coordinationPriority}, responseDepth=${intelligence.responseDepth}, operatorMode=${intelligence.operatorMode}, questionType=${intelligence.questionType}, missionOpportunity=${intelligence.missionOpportunity ? "true" : "false"}, builderDensity=${network.builderDensity}, missionMomentum=${network.missionMomentum}, collaborationDensity=${network.collaborationDensity}, knowledgeDensity=${network.knowledgeDensity}, insightDensity=${network.insightDensity}, growthDensity=${network.growthDensity}, newcomerDensity=${network.newcomerDensity}, executionDensity=${network.executionDensity}, organizationDensity=${network.organizationDensity}, noiseLevel=${network.noiseLevel}`;

  if (lang === "zh") return `\n\n运行时上下文：${base}`;
  if (lang === "mixed") return `\n\nRuntime/运行时 context: ${base}`;
  return `\n\nRuntime context: ${base}`;
}

function buildInteractionHint(
  intelligence: CoordinationIntelligence,
  lang: "en" | "zh" | "mixed"
) {
  const hintEn = [
    intelligence.shouldStayMinimal ? "stay_minimal=true" : "stay_minimal=false",
    intelligence.shouldLightRedirect ? "light_redirect=true" : "light_redirect=false",
    intelligence.shouldAvoidRouting ? "avoid_routing=true" : "avoid_routing=false",
  ].join(", ");

  if (lang === "zh") return `\n\n交互提示：${hintEn}`;
  if (lang === "mixed") return `\n\nInteraction/交互 hints: ${hintEn}`;
  return `\n\nInteraction hints: ${hintEn}`;
}

function buildCommunityContextHint(
  community: CommunityContext,
  lang: "en" | "zh" | "mixed"
) {
  const parts = [
    `communityName=${community.communityName || ""}`,
    `communityIdentity=${community.communityIdentity || ""}`,
    `communityNarrative=${community.communityNarrative || ""}`,
    `communityFocus=${community.communityFocus || ""}`,
    `ecosystemContext=${community.ecosystemContext || ""}`,
    `isWAOC=${community.isWAOC ? "true" : "false"}`,
    `hasCommunityContext=${community.hasCommunityContext ? "true" : "false"}`,
  ].join(", ");

  if (!community.hasCommunityContext && !community.isWAOC) return "";

  if (lang === "zh") return `\n\n社区上下文：${parts}`;
  if (lang === "mixed") return `\n\nCommunity/社区 context: ${parts}`;
  return `\n\nCommunity context: ${parts}`;
}

function buildOperatorHint(
  signals: CommunitySignals,
  intelligence: CoordinationIntelligence,
  lang: "en" | "zh" | "mixed"
) {
  const parts = [
    `operatorMode=${intelligence.operatorMode}`,
    `responseDepth=${intelligence.responseDepth}`,
    `questionType=${intelligence.questionType}`,
    `v22Momentum=${intelligence.v22Momentum}`,
    `missionOpportunity=${intelligence.missionOpportunity ? "1" : "0"}`,
    `builder=${signals.builderSignal ? "1" : "0"}`,
    `contributor=${signals.contributorSignal ? "1" : "0"}`,
    `collaboration=${signals.collaborationSignal ? "1" : "0"}`,
    `directQuestion=${signals.directQuestionSignal ? "1" : "0"}`,
    `systemQuestion=${signals.systemQuestionSignal ? "1" : "0"}`,
    `news=${signals.newsSignal ? "1" : "0"}`,
    `price=${signals.pricingSignal ? "1" : "0"}`,
    `x=${signals.xSignal ? "1" : "0"}`,
    `web=${signals.webSignal ? "1" : "0"}`,
  ].join(", ");

  if (lang === "zh") return `\n\n运营判断：${parts}`;
  if (lang === "mixed") return `\n\nOperator/运营 hints: ${parts}`;
  return `\n\nOperator hints: ${parts}`;
}

/* =========================
   Rhythm control
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
  if (lines.length >= 15 && shortLines / Math.max(lines.length, 1) > 0.55) {
    return "high_noise";
  }

  if (lines.length <= 3) return "low_activity";
  return "calm_building";
}

function shouldIgnite(state: GroupState) {
  return state === "low_activity";
}

function pickIgnitionLine(
  lang: "en" | "zh" | "mixed",
  state: RuntimeState,
  community: CommunityContext,
  seed: number
): string {
  const prefixEn = community.communityName ? `${community.communityName}: ` : "";
  const prefixZh = community.communityName ? `${community.communityName}：` : "";

  const poolEn =
    state === "coordination_window" || state === "organization_window"
      ? [
          `${prefixEn}What should become the next concrete step?`,
          `${prefixEn}Who should own the next execution step?`,
          `${prefixEn}What useful thing can we ship next?`,
        ]
      : state === "knowledge_window" || state === "insight_window"
      ? [
          `${prefixEn}What here should turn into reusable knowledge?`,
          `${prefixEn}What lesson is worth preserving?`,
          `${prefixEn}Which insight should become a guide?`,
        ]
      : [
          `${prefixEn}What are people building this week?`,
          `${prefixEn}Any useful update worth sharing?`,
          `${prefixEn}What problem is most worth solving next?`,
        ];

  const poolZh =
    state === "coordination_window" || state === "organization_window"
      ? [
          `${prefixZh}接下来最值得推进的具体一步是什么？`,
          `${prefixZh}下一步执行最该由谁来接？`,
          `${prefixZh}接下来最值得交付的是什么？`,
        ]
      : state === "knowledge_window" || state === "insight_window"
      ? [
          `${prefixZh}这里有什么值得变成可复用知识？`,
          `${prefixZh}这里哪条经验最值得保留？`,
          `${prefixZh}哪个洞察应该变成指南？`,
        ]
      : [
          `${prefixZh}这周大家在构建什么？`,
          `${prefixZh}有没有值得分享的有效进展？`,
          `${prefixZh}接下来最值得解决的问题是什么？`,
        ];

  if (lang === "mixed") {
    const en = poolEn[Math.abs(seed) % poolEn.length];
    const zh = poolZh[Math.abs(seed) % poolZh.length];
    return `${en}\n${zh}`;
  }

  const pool = lang === "zh" ? poolZh : poolEn;
  return pool[Math.abs(seed) % pool.length];
}

const __igniteMap: Map<string, number> =
  (globalThis as any).__waocIgniteMap ||
  ((globalThis as any).__waocIgniteMap = new Map<string, number>());

/* =========================
   Quick replies
========================= */

function quickAutoReply(args: {
  raw: string;
  msg: string;
  lang: "en" | "zh" | "mixed";
  community: CommunityContext;
}): WaocChatData | null {
  const { msg, lang, community } = args;
  const defaults = getOfficialLinks();
  const WAOC_CA_SOL = env("WAOC_CA_SOL");
  const WAOC_CA_BSC = env("WAOC_CA_BSC");

  const linkLines = community.officialLinks
    ? community.officialLinks.split("|").map((x) => x.trim()).filter(Boolean)
    : defaults.links;

  const actionLinks: WaocSuggestedAction = "/links";
  const actionNone: WaocSuggestedAction = "none";

  if (looksLikeMeaningQuestion(msg) && community.isWAOC) {
    if (lang === "zh") {
      return {
        reply:
          "WAOC = We Are One Connection。\n" +
          "WAOC 代表一种关于协作、贡献与集体智能的长期愿景。\n" +
          "这里更重视实际推进，而不只是讨论。\n" +
          "官方入口见下方。\n" +
          (linkLines.length ? linkLines.map((x) => `- ${x}`).join("\n") : "（暂未配置官方链接）"),
        suggestedAction: linkLines.length ? actionLinks : actionNone,
      };
    }

    if (lang === "mixed") {
      return {
        reply:
          "WAOC = We Are One Connection.\n" +
          "WAOC represents a long-term vision of coordination, contribution, and collective intelligence.\n" +
          "It is more about practical coordination than abstract talk.\n" +
          "Official entry points are below.\n" +
          (linkLines.length ? linkLines.map((x) => `- ${x}`).join("\n") : "(official links not configured yet)"),
        suggestedAction: linkLines.length ? actionLinks : actionNone,
      };
    }

    return {
      reply:
        "WAOC = We Are One Connection.\n" +
        "WAOC represents a long-term vision of coordination, contribution, and collective intelligence.\n" +
        "It is more about practical coordination than abstract talk.\n" +
        "Official entry points are below.\n" +
        (linkLines.length ? linkLines.map((x) => `- ${x}`).join("\n") : "(official links not configured yet)"),
      suggestedAction: linkLines.length ? actionLinks : actionNone,
    };
  }

  if (looksLikeLinksQuestion(msg) || looksLikeOrientationQuestion(msg)) {
    if (lang === "zh") {
      return {
        reply:
          "官方入口如下。\n" +
          "先从核心链接开始会更清楚。\n" +
          "如果是新人，建议先看网站和社区入口。\n" +
          (linkLines.length ? linkLines.map((x) => `- ${x}`).join("\n") : "（暂未配置链接）"),
        suggestedAction: linkLines.length ? actionLinks : actionNone,
      };
    }

    if (lang === "mixed") {
      return {
        reply:
          "Official entry points are below.\n" +
          "Starting from the core links is the clearest path.\n" +
          "If you are new, begin with the site and community entry points.\n" +
          (linkLines.length ? linkLines.map((x) => `- ${x}`).join("\n") : "(links not configured yet)"),
        suggestedAction: linkLines.length ? actionLinks : actionNone,
      };
    }

    return {
      reply:
        "Official entry points are below.\n" +
        "Starting from the core links is the clearest path.\n" +
        "If you are new, begin with the site and community entry points.\n" +
        (linkLines.length ? linkLines.map((x) => `- ${x}`).join("\n") : "(links not configured yet)"),
      suggestedAction: linkLines.length ? actionLinks : actionNone,
    };
  }

  if (looksLikeCommunityIdentityQuestion(msg)) {
    if (lang === "zh") {
      return {
        reply:
          (community.communityName ? `${community.communityName} 是一个社区。` : "这是一个社区。") +
          "\n" +
          (community.communityIdentity ||
            community.communityNarrative ||
            community.communityFocus ||
            "这里更适合围绕实际协作、贡献和有用讨论来理解。") +
          "\n这里更重视行动与协作。\n不是单纯的信息群。",
        suggestedAction: "none",
      };
    }

    if (lang === "mixed") {
      return {
        reply:
          (community.communityName ? `${community.communityName} is a community.` : "This is a community.") +
          "\n" +
          (community.communityIdentity ||
            community.communityNarrative ||
            community.communityFocus ||
            "The best way to understand it is through practical coordination and participation.") +
          "\nIt is more action-oriented than purely informational.\nThat is usually the best lens to read it through.",
        suggestedAction: "none",
      };
    }

    return {
      reply:
        (community.communityName ? `${community.communityName} is a community.` : "This is a community.") +
        "\n" +
        (community.communityIdentity ||
          community.communityNarrative ||
          community.communityFocus ||
          "The best way to understand it is through practical coordination and participation.") +
        "\nIt is more action-oriented than purely informational.\nThat is usually the best lens to read it through.",
      suggestedAction: "none",
    };
  }

  if (looksLikeSystemQuestion(msg)) {
    if (lang === "zh") {
      return {
        reply:
          "它更像一个协调接口。\n" +
          "消息进来之后，会先判断是闲聊、提问、builder 想法、入门问题，还是更适合进入 knowledge / mission 场景。\n" +
          "然后再决定是直接回答，还是给出更合适的下一步。\n" +
          "目标是把讨论尽量推进到更清晰的行动。",
        suggestedAction: "/knowledge",
      };
    }

    if (lang === "mixed") {
      return {
        reply:
          "It works more like a coordination interface.\n" +
          "A message gets read as chat, question, builder idea, onboarding, or something that should move toward knowledge or mission.\n" +
          "Then it decides whether to answer directly or suggest the next useful step.\n" +
          "The aim is to make discussion more actionable.",
        suggestedAction: "/knowledge",
      };
    }

    return {
      reply:
        "It works more like a coordination interface.\n" +
        "A message gets read as chat, question, builder idea, onboarding, or something that should move toward knowledge or mission.\n" +
        "Then it decides whether to answer directly or suggest the next useful step.\n" +
        "The aim is to make discussion more actionable.",
      suggestedAction: "/knowledge",
    };
  }

  if (looksLikeCapabilityQuestion(msg)) {
    if (lang === "zh") {
      return {
        reply:
          "我主要是帮群里把有价值的话题往行动方向推进。\n" +
          "比如识别 builder、串联想法、把下一步说清楚。\n" +
          "也会在合适的时候把讨论变成 mission。\n" +
          "如果涉及外部信息，也可以路由到对应入口。",
        suggestedAction: "none",
      };
    }

    if (lang === "mixed") {
      return {
        reply:
          "Mostly helping useful ideas move toward action.\n" +
          "I help surface builders, connect ideas, and make the next step clearer.\n" +
          "When needed, I can also route discussion toward mission, knowledge, or external info flows.\n" +
          "That is the main operating role.",
        suggestedAction: "none",
      };
    }

    return {
      reply:
        "Mostly helping useful ideas move toward action.\n" +
        "I help surface builders, connect ideas, and make the next step clearer.\n" +
        "When needed, I can also route discussion toward mission, knowledge, or external info flows.\n" +
        "That is the main operating role.",
      suggestedAction: "none",
    };
  }

  if (looksLikeCAQuestion(msg) || msg === "ca" || msg.includes("ca ")) {
    const hasSol = Boolean(WAOC_CA_SOL);
    const hasBsc = Boolean(WAOC_CA_BSC);

    if (community.isWAOC && (hasSol || hasBsc)) {
      const lines: string[] = [];
      if (hasSol) lines.push(`Solana CA: ${WAOC_CA_SOL}`);
      if (hasBsc) lines.push(`BSC CA: ${WAOC_CA_BSC}`);

      if (lang === "zh") {
        return {
          reply:
            "以下是当前已配置的官方合约地址。\n" +
            lines.map((x) => `- ${x}`).join("\n") +
            "\n请只以官方渠道为准。\n不要相信私聊转发。",
          suggestedAction: actionLinks,
        };
      }

      if (lang === "mixed") {
        return {
          reply:
            "These are the currently configured official contract addresses.\n" +
            lines.map((x) => `- ${x}`).join("\n") +
            "\nOnly trust official channels.\nDo not trust random DMs.",
          suggestedAction: actionLinks,
        };
      }

      return {
        reply:
          "These are the currently configured official contract addresses.\n" +
          lines.map((x) => `- ${x}`).join("\n") +
          "\nOnly trust official channels.\nDo not trust random DMs.",
        suggestedAction: actionLinks,
      };
    }

    if (lang === "zh") {
      return {
        reply:
          "我不会猜或乱编合约地址。\n" +
          "这类信息应只以官方渠道为准。\n" +
          "建议查看置顶或官方入口。\n" +
          "这里先走官方链接。",
        suggestedAction: actionLinks,
      };
    }

    if (lang === "mixed") {
      return {
        reply:
          "I won’t guess or fabricate a contract address.\n" +
          "This should come only from official channels.\n" +
          "Check pinned information or official links.\n" +
          "Routing to official entry points is safer.",
        suggestedAction: actionLinks,
      };
    }

    return {
      reply:
        "I won’t guess or fabricate a contract address.\n" +
        "This should come only from official channels.\n" +
        "Check pinned information or official links.\n" +
        "Routing to official entry points is safer.",
      suggestedAction: actionLinks,
    };
  }

  return null;
}

/* =========================
   Constraint guard
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
    lang: toConstraintLang(input.lang),
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

  const lang: "en" | "zh" | "mixed" =
    input.lang === "zh" ? "zh" : input.lang === "mixed" ? "mixed" : "en";

  return {
    ok: true,
    data: {
      reply:
        norm(data.reply) ||
        (lang === "zh"
          ? "收到。\n先保留这个方向。\n需要时再继续推进。"
          : lang === "mixed"
          ? "Got it.\nKeeping this direction noted.\nWe can push it further when needed."
          : "Got it.\nKeeping this direction noted.\nWe can push it further when needed."),
      suggestedAction: ensureAllowedAction(data.suggestedAction),
    },
  };
}

/* =========================
   Post-process helpers
========================= */

function appendUniqueLine(reply: string, line: string) {
  const a = norm(reply);
  const b = norm(line);
  if (!a) return b;
  if (!b) return a;
  if (a.includes(b)) return a;
  return `${a}\n${b}`.trim();
}

function makeMinimalReply(
  lang: "en" | "zh" | "mixed",
  kind: "noise" | "tense" | "cooling"
): string {
  if (lang === "zh") {
    if (kind === "noise") return "先把重点放回一个更具体的问题。\n现在不适合把话题继续发散。";
    if (kind === "tense") return "先冷静一下。\n尽量把讨论拉回事实和问题本身。";
    return "收到。\n先保持简洁。\n等信息更清楚再展开。";
  }

  if (lang === "mixed") {
    if (kind === "noise") return "Let’s bring this back to one concrete problem.\n先把重点拉回一个更具体的问题。";
    if (kind === "tense") return "Let’s keep this calm and grounded in facts.\n先冷静一点，回到事实本身。";
    return "Got it.\nKeeping this brief for now.\nWe can expand once the signal is clearer.";
  }

  if (kind === "noise") return "Let’s bring this back to one concrete problem.\nThis is not the best moment to widen the thread.";
  if (kind === "tense") return "Let’s keep this calm and grounded in facts.\nThat will make the discussion more useful.";
  return "Got it.\nKeeping this brief for now.\nWe can expand once the signal is clearer.";
}

function shouldOverrideWithMinimalReply(args: {
  currentReply: string;
  lang: "en" | "zh" | "mixed";
  intelligence: CoordinationIntelligence;
  signals: CommunitySignals;
}): string | null {
  const { currentReply, lang, intelligence, signals } = args;

  if (
    signals.meaningSignal ||
    signals.verificationSignal ||
    signals.capabilityQuestionSignal ||
    signals.communityIdentityQuestionSignal ||
    signals.systemQuestionSignal ||
    signals.directQuestionSignal ||
    intelligence.responseDepth === "full"
  ) {
    return null;
  }

  if (!intelligence.shouldStayMinimal) return null;

  if (intelligence.roomState === "tense") {
    return currentReply || makeMinimalReply(lang, "tense");
  }
  if (intelligence.roomState === "noisy" || intelligence.momentum === "repetitive") {
    return currentReply || makeMinimalReply(lang, "noise");
  }
  if (intelligence.momentum === "cooling") {
    return currentReply || makeMinimalReply(lang, "cooling");
  }
  return null;
}

function makeWorkflowPaddingLine(first: string, lang: "en" | "zh" | "mixed" = "en") {
  const f = lower(first);

  if (lang === "zh") {
    if (/价格|币价|市值|行情/.test(f)) return "如果要实时数据，还需要接价格源。";
    if (/新闻|动态|公告/.test(f)) return "如果要最新动态，还需要接新闻源。";
    if (/推特|账号|推文|x/.test(f)) return "如果要继续分析，最好直接读取该账号内容。";
    if (/网页|文章|链接|网站/.test(f)) return "如果要更准确总结，最好先抓取正文。";
    if (/任务|mission/.test(f)) return "这个方向可以继续收敛成一个更具体的任务。";
    return "这个方向可以继续往下展开。";
  }

  if (lang === "mixed") {
    if (/price|market cap|chart|valuation|价格|币价|市值|行情/.test(f)) {
      return "A live price source would make this more useful.\n如果要实时数据，还需要接价格源。";
    }
    if (/news|update|announcement|新闻|动态|公告/.test(f)) {
      return "A live news source would make this more reliable.\n如果要最新动态，还需要接新闻源。";
    }
    if (/twitter|x|tweet|account|推特|账号|推文/.test(f)) {
      return "Reading the actual account content would make this stronger.\n如果要继续分析，最好直接读取该账号内容。";
    }
    if (/website|web|article|link|网页|文章|链接|网站/.test(f)) {
      return "Fetching the page content would make this more accurate.\n如果要更准确总结，最好先抓取正文。";
    }
    return "This could be taken one step further.\n这个方向可以继续往下展开。";
  }

  if (/price|market cap|chart|valuation/.test(f)) {
    return "A live price source would make this more useful.";
  }
  if (/news|update|announcement/.test(f)) {
    return "A live news source would make this more reliable.";
  }
  if (/twitter|x|tweet|account/.test(f)) {
    return "Reading the actual account content would make this stronger.";
  }
  if (/website|web|article|link/.test(f)) {
    return "Fetching the page content would make this more accurate.";
  }
  if (/mission|task/.test(f)) {
    return "This could be narrowed into a more concrete task.";
  }

  return "This could be taken one step further.";
}

function finalizeReplyLines(
  reply: string,
  lang: "en" | "zh" | "mixed" = "en"
): string {
  const lines = norm(reply)
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!lines.length) {
    return lang === "zh"
      ? "收到。\n这个方向可以继续往下展开。"
      : lang === "mixed"
      ? "Got it.\n这个方向可以继续往下展开。"
      : "Got it.\nThis could be taken one step further.";
  }

  const clipped = lines.slice(0, 5);

  if (clipped.length >= 2) return clipped.join("\n");

  const one = clipped[0];
  return [one, makeWorkflowPaddingLine(one, lang)].join("\n");
}

/* =========================
   Workflow
========================= */

export const waocChatWorkflowDef: WorkflowDefinition<WaocChatCtx> = {
  name: "waoc_chat_workflow",
  maxAttempts: 3,
  steps: [
    async (ctx: WaocChatCtx) => {
      const raw = norm(ctx.input?.message);
      const msg = lower(raw);
      const lang: "en" | "zh" | "mixed" =
        ctx.input?.lang === "zh"
          ? "zh"
          : ctx.input?.lang === "mixed"
          ? "mixed"
          : "en";

      const community = inferCommunityContext(ctx.input);

      const quick = quickAutoReply({ raw, msg, lang, community });
      if (quick) {
        ctx.data = applyConstraintsOrFallback({
          data: quick,
          input: ctx.input,
        }).data;
        ctx.data.reply = finalizeReplyLines(ctx.data.reply, lang);
        return { ok: true, stop: true } as any;
      }

      return { ok: true };
    },

    preparePromptStep<WaocChatInput, WaocChatData>({
      task: "waoc_chat",
      templateVersion: WAOC_CHAT_TEMPLATE_VERSION,
      variables: (input: WaocChatInput): Record<string, string> => {
        const lang: "en" | "zh" | "mixed" =
          input.lang === "zh" ? "zh" : input.lang === "mixed" ? "mixed" : "en";

        const signals = detectCommunitySignals(
          input.message,
          input.recentMessages ?? ""
        );
        const network = inferNetworkContext(
          input.message,
          input.recentMessages ?? ""
        );
        const intelligence = inferCoordinationIntelligence({
          input,
          messageRaw: input.message,
          recentMessagesRaw: input.recentMessages ?? "",
          signals,
          network,
        });
        const community = inferCommunityContext(input);

        return {
          message:
            norm(input.message) +
            buildSignalHint(signals, lang) +
            buildRuntimeHint(network, intelligence, lang) +
            buildInteractionHint(intelligence, lang) +
            buildCommunityContextHint(community, lang) +
            buildOperatorHint(signals, intelligence, lang),

          context: norm(input.context ?? "general"),
          lang: norm(input.lang ?? "en"),
          emotionHint: norm(input.emotionHint ?? ""),
          recentMessages: norm(input.recentMessages ?? ""),
          roomState: norm(input.roomState ?? intelligence.roomState),
          momentumHint: norm(input.momentumHint ?? intelligence.momentum),

          communityName: community.communityName,
          communityIdentity: community.communityIdentity,
          communityNarrative: community.communityNarrative,
          communityFocus: community.communityFocus,
          ecosystemContext: community.ecosystemContext,
          officialLinks: community.officialLinks,

          questionType: intelligence.questionType,
          responseDepth: intelligence.responseDepth,
          operatorMode: intelligence.operatorMode,
          v22Momentum: intelligence.v22Momentum,
          missionOpportunity: intelligence.missionOpportunity ? "true" : "false",

          websiteUrl: env("WEBSITE_URL") || env("WAOC_SITE_URL"),
          tgUrl: env("TG_URL") || env("WAOC_COMMUNITY_URL"),
          oneMissionUrl: env("ONE_MISSION_URL"),
          oneFieldUrl: env("ONE_FIELD_URL"),
          meditationUrl: env("MEDITATION_URL"),
          xUrl: env("X_URL") || env("WAOC_X_URL"),

          coordinationIntelligence: safeJson(intelligence),
          communityContext: safeJson(community),
          detectedSignals: safeJson(signals),
        };
      },
    }),

    generateLLMStep<WaocChatInput, WaocChatData>(),
    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    refineJsonStep<WaocChatInput, WaocChatData>({
      check: (ctx) => {
        const r: any = checkWaocChatConstraints({
          data: ctx.data as any,
          userMessage: ctx.input?.message,
          lang: toConstraintLang(ctx.input?.lang),
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
        '- suggestedAction MUST be one of: "none", "/links", "/mission", "/rank", "/report", "/builders", "/knowledge", "/growth", "/news", "/price", "/x", "/web".\n' +
        "- reply is required and must directly answer the user.\n" +
        "- Keep reply output between 2 and 5 concise lines.\n" +
        "- Think like an autonomous community coordination brain, not a generic chatbot.\n" +
        "- Detect builder signals, contributor signals, collaboration signals, mission opportunity, community momentum, news intent, price intent, X intent, and web intent.\n" +
        "- Distinguish system questions from community questions, capability questions, growth questions, and external information requests.\n" +
        "- If the user asks a direct question, answer clearly and completely enough to be useful.\n" +
        "- For system questions, explain mechanism / flow / operating logic.\n" +
        "- For community questions, explain identity / focus / purpose.\n" +
        "- For capability questions, answer naturally and concretely without sounding like support documentation.\n" +
        "- In builder contexts, avoid empty praise. Prefer one practical follow-up question or one concrete next step.\n" +
        "- Good builder follow-up examples: 'What would it track first?' 'Who would use it first?' 'What problem would it solve first?'\n" +
        "- Ask at most one follow-up question in builder mode.\n" +
        "- If a mission opportunity exists, it is acceptable to say so briefly.\n" +
        "- In growth contexts, answer practically with steps / priorities rather than vague encouragement.\n" +
        "- For news / price / X / web requests, do not fabricate facts. If not verifiable, say so briefly and route appropriately.\n" +
        "- Prefer one concrete next step over vague motivation.\n" +
        "- Respect room state and momentum when shaping the reply.\n" +
        "- In noisy, repetitive, or cooling situations, keep replies shorter and lighter.\n" +
        "- Keep replies natural, practical, socially aware, and high-signal.\n" +
        "- Avoid support-agent or corporate language such as 'It sounds like', 'As an AI', 'I can help with', 'This includes', 'Feel free to ask', 'facilitate coordination', 'foster collaboration', 'support builders and contributors', 'unlock potential', or 'drive engagement'.\n" +
        "- Do not assume every community is WAOC.\n" +
        "- If WAOC is in scope, WAOC MUST be expanded ONLY as 'We Are One Connection'. Never redefine the acronym.\n" +
        "- Never fabricate CA/price/news/partnership/listing. If not verifiable, say you can't verify and route accordingly.\n",
    }),

    parseJsonStep<WaocChatInput, WaocChatData>(),
    validateSchemaStep<WaocChatInput, WaocChatData>(waocChatValidator),

    async (ctx: WaocChatCtx) => {
      if (!ctx.data) ctx.data = { reply: "", suggestedAction: "none" };

      ctx.data = applyConstraintsOrFallback({
        data: ctx.data,
        input: ctx.input,
      }).data;

      const raw = norm(ctx.input.message);
      const msg = lower(raw);
      const lang: "en" | "zh" | "mixed" =
        ctx.input.lang === "zh"
          ? "zh"
          : ctx.input.lang === "mixed"
          ? "mixed"
          : "en";
      const recentMessages = getRecentMessages(ctx);

      const community = inferCommunityContext(ctx.input);
      const signals = detectCommunitySignals(raw, recentMessages);
      const network = inferNetworkContext(raw, recentMessages);
      const intelligence = inferCoordinationIntelligence({
        input: ctx.input,
        messageRaw: raw,
        recentMessagesRaw: recentMessages,
        signals,
        network,
      });

      const routes: Array<{
        hit: (
          s: string,
          sig: CommunitySignals,
          net: NetworkContext,
          intel: CoordinationIntelligence,
          comm: CommunityContext
        ) => boolean;
        task: string;
        mapInput: () => any;
        preferredAction?: WaocSuggestedAction;
      }> = [
        {
          hit: (s) => looksLikeValuationRequest(s),
          task: "waoc_brain",
          preferredAction: "/knowledge",
          mapInput: () => ({
            question: raw,
            lang,
            communityName: community.communityName,
            communityNarrative: community.communityNarrative,
          }),
        },
        {
          hit: (s) => looksLikeNarrativeRequest(s),
          task: "waoc_narrative",
          preferredAction: "/knowledge",
          mapInput: () => ({
            topic: raw,
            depth: "short",
            lang,
            communityName: community.communityName,
            communityNarrative: community.communityNarrative,
          }),
        },
        {
          hit: (s) => looksLikeExplicitTweetRequest(s),
          task: "tweet",
          preferredAction: "/growth",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
            communityNarrative: community.communityNarrative,
          }),
        },
        {
          hit: (s) => looksLikeExplicitMissionRequest(s),
          task: "mission",
          preferredAction: "/mission",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
            communityFocus: community.communityFocus,
          }),
        },
        {
          hit: (s) => looksLikeReportIntent(s),
          task: "report_agent",
          preferredAction: "/report",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
          }),
        },
        {
          hit: (_s, sig) => sig.newsSignal,
          task: "news_agent",
          preferredAction: "/news",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
          }),
        },
        {
          hit: (_s, sig) => sig.pricingSignal,
          task: "price_agent",
          preferredAction: "/price",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
          }),
        },
        {
          hit: (_s, sig) => sig.xSignal,
          task: "x_agent",
          preferredAction: "/x",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
          }),
        },
        {
          hit: (_s, sig) => sig.webSignal,
          task: "web_agent",
          preferredAction: "/web",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
          }),
        },
        {
          hit: (s, sig, _net, intel) =>
            looksLikeGrowthIntent(s) || sig.growthSignal || intel.questionType === "growth",
          task: "growth_agent",
          preferredAction: "/growth",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
            communityFocus: community.communityFocus,
          }),
        },
        {
          hit: (_s, sig, _net, intel) =>
            sig.knowledgeSignal ||
            sig.insightSignal ||
            sig.systemQuestionSignal ||
            intel.questionType === "system",
          task: "knowledge_agent",
          preferredAction: "/knowledge",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
          }),
        },
        {
          hit: (s, sig, _net, intel) =>
            looksLikeBuilderIntent(s) ||
            sig.builderSignal ||
            sig.builderQuestionSignal ||
            sig.collaborationSignal ||
            intel.missionOpportunity ||
            intel.gap === "mission_without_owner",
          task: "builder_agent",
          preferredAction: "/builders",
          mapInput: () => ({
            message: raw,
            lang,
            communityName: community.communityName,
            communityFocus: community.communityFocus,
          }),
        },
      ];

      const match = routes.find((r) =>
        r.hit(msg, signals, network, intelligence, community)
      );
      console.log("match task =", match?.task);
      
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
              const next: WaocChatData = {
                ...ctx.data,
                reply: answer,
                suggestedAction: ensureAllowedAction(
                  r.data?.suggestedAction ??
                    match.preferredAction ??
                    ctx.data?.suggestedAction ??
                    intelligence.preferredAction
                ),
              };

              if (Array.isArray(r.data?.links) && r.data.links.length) {
                next.suggestedAction = "/links";
              }

              if (intelligence.shouldAvoidRouting && next.suggestedAction === "none") {
                next.suggestedAction = "none";
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
        if ((ctx.data.suggestedAction ?? "none") === "none") {
          if (!intelligence.shouldAvoidRouting) {
            ctx.data.suggestedAction = intelligence.preferredAction;
          }
        }
      }

      {
        const maybeMinimal = shouldOverrideWithMinimalReply({
          currentReply: norm(ctx.data.reply),
          lang,
          intelligence,
          signals,
        });

        if (maybeMinimal) {
          ctx.data.reply = maybeMinimal;
          if (intelligence.shouldAvoidRouting) {
            ctx.data.suggestedAction = "none";
          }
        }
      }

      if (
        intelligence.gap !== "none" &&
        !shouldSkipCoordinationGap(signals, msg) &&
        !intelligence.shouldStayMinimal &&
        intelligence.responseDepth !== "full" &&
        Math.random() < COORDINATION_GAP_APPEND_RATE
      ) {
        const current = norm(ctx.data.reply);
        const gapLine =
          lang === "zh"
            ? intelligence.gap === "builder_without_mission"
              ? "这里已经有 builder 信号了，但还没有清晰任务。"
              : intelligence.gap === "mission_without_owner"
              ? "这个方向已经像任务了，但还没有明确 owner。"
              : intelligence.gap === "knowledge_not_captured"
              ? "这里已经有可复用的信息了，但还没有沉淀。"
              : intelligence.gap === "growth_without_execution"
              ? "这里已经有增长想法了，但还缺执行路径。"
              : "这个问题重复出现了，但还没有明确 owner。"
            : lang === "mixed"
            ? intelligence.gap === "builder_without_mission"
              ? "There is builder signal here, but no clear mission yet.\n这里已经有 builder 信号了，但还没有清晰任务。"
              : intelligence.gap === "mission_without_owner"
              ? "This already feels like a mission, but no clear owner yet.\n这个方向已经像任务了，但还没有明确 owner。"
              : intelligence.gap === "knowledge_not_captured"
              ? "There is reusable knowledge here, but it is not captured yet.\n这里已经有可复用的信息了，但还没有沉淀。"
              : intelligence.gap === "growth_without_execution"
              ? "There is a growth idea here, but it still lacks execution.\n这里已经有增长想法了，但还缺执行路径。"
              : "This issue keeps showing up, but there is still no clear owner.\n这个问题重复出现了，但还没有明确 owner。"
            : intelligence.gap === "builder_without_mission"
            ? "There is builder signal here, but no clear mission yet."
            : intelligence.gap === "mission_without_owner"
            ? "This already feels like a mission, but no clear owner yet."
            : intelligence.gap === "knowledge_not_captured"
            ? "There is reusable knowledge here, but it is not captured yet."
            : intelligence.gap === "growth_without_execution"
            ? "There is a growth idea here, but it still lacks execution."
            : "This issue keeps showing up, but there is still no clear owner.";

        if (
          current &&
          !current.toLowerCase().includes("no clear mission") &&
          !current.includes("还没有清晰任务")
        ) {
          ctx.data.reply = `${current}\n${gapLine}`.trim();
        }
      }

      if (
        !signals.meaningSignal &&
        !signals.verificationSignal &&
        !signals.capabilityQuestionSignal &&
        !signals.communityIdentityQuestionSignal &&
        !signals.systemQuestionSignal &&
        !signals.directQuestionSignal &&
        !signals.newsSignal &&
        !signals.pricingSignal &&
        !signals.xSignal &&
        !signals.webSignal &&
        !intelligence.shouldStayMinimal &&
        intelligence.responseDepth !== "full" &&
        Math.random() < MOMENTUM_APPEND_RATE
      ) {
        const current = norm(ctx.data.reply);
        let extra = "";

        if (lang === "zh") {
          if (intelligence.v22Momentum === "building") extra = "这个方向已经有继续推进的势头。";
          else if (intelligence.v22Momentum === "focused") extra = "这个讨论已经比较聚焦。";
          else if (intelligence.v22Momentum === "fragmented") extra = "可以先把它收敛到一个更具体的问题。";
          else if (intelligence.v22Momentum === "emerging") extra = "这里已经有一点成形的势头了。";
        } else if (lang === "mixed") {
          if (intelligence.v22Momentum === "building")
            extra = "There is real momentum here.\n这个方向已经有继续推进的势头。";
          else if (intelligence.v22Momentum === "focused")
            extra = "This thread is already fairly focused.\n这个讨论已经比较聚焦。";
          else if (intelligence.v22Momentum === "fragmented")
            extra = "It may help to narrow this to one concrete question.\n可以先把它收敛到一个更具体的问题。";
          else if (intelligence.v22Momentum === "emerging")
            extra = "This is starting to become actionable.\n这里已经有一点成形的势头了。";
        } else {
          if (intelligence.v22Momentum === "building")
            extra = "There is real momentum here.";
          else if (intelligence.v22Momentum === "focused")
            extra = "This thread is already fairly focused.";
          else if (intelligence.v22Momentum === "fragmented")
            extra = "It may help to narrow this to one concrete question.";
          else if (intelligence.v22Momentum === "emerging")
            extra = "This is starting to become actionable.";
        }

        if (extra) {
          ctx.data.reply = appendUniqueLine(current, extra);
        }
      }

      if (
        intelligence.missionOpportunity &&
        !signals.directQuestionSignal &&
        !signals.newsSignal &&
        !signals.pricingSignal &&
        !signals.xSignal &&
        !signals.webSignal &&
        !intelligence.shouldStayMinimal &&
        intelligence.responseDepth !== "full"
      ) {
        const current = norm(ctx.data.reply);
        const loweredCurrent = lower(current);
        const extra =
          lang === "zh"
            ? "这个方向已经有点像一个可以执行的小 mission 了。"
            : lang === "mixed"
            ? "This already feels actionable enough to become a small mission.\n这个方向已经有点像一个可以执行的小 mission 了。"
            : "This already feels actionable enough to become a small mission.";

        if (
          !loweredCurrent.includes("mission") &&
          !current.includes("小 mission")
        ) {
          ctx.data.reply = appendUniqueLine(current, extra);
        }
      }

      if (
        signals.contributorSignal &&
        !intelligence.shouldStayMinimal &&
        intelligence.responseDepth !== "full"
      ) {
        const current = norm(ctx.data.reply);
        const extra =
          lang === "zh"
            ? "这给了大家一个更具体的推进点。"
            : lang === "mixed"
            ? "That gives people something concrete to build on.\n这给了大家一个更具体的推进点。"
            : "That gives people something concrete to build on.";

        ctx.data.reply = appendUniqueLine(current, extra);
      }

      if (signals.crossCommunityHint && !intelligence.shouldStayMinimal) {
        const current = norm(ctx.data.reply);
        const extra =
          lang === "zh"
            ? "这里也许有跨社区协作机会。"
            : lang === "mixed"
            ? "There may be a cross-community coordination angle here.\n这里也许有跨社区协作机会。"
            : "There may be a cross-community coordination angle here.";

        ctx.data.reply = appendUniqueLine(current, extra);
      }

      if (
        signals.selfOrganizingSignal &&
        !signals.meaningSignal &&
        !signals.verificationSignal &&
        !signals.newsSignal &&
        !signals.pricingSignal &&
        !signals.xSignal &&
        !signals.webSignal &&
        !intelligence.shouldStayMinimal &&
        network.coordinationState === "organization_window"
      ) {
        const current = norm(ctx.data.reply);
        const extra =
          lang === "zh"
            ? "先明确一个最小下一步会更容易推进。"
            : lang === "mixed"
            ? "It may help to define one minimal next step.\n先明确一个最小下一步会更容易推进。"
            : "It may help to define one minimal next step.";

        ctx.data.reply = appendUniqueLine(current, extra);
      }

      if (
        (signals.builderSignal || signals.missionOpportunitySignal || signals.collaborationSignal) &&
        !signals.directQuestionSignal &&
        !signals.newsSignal &&
        !signals.pricingSignal &&
        !signals.xSignal &&
        !signals.webSignal &&
        !intelligence.shouldStayMinimal &&
        intelligence.responseDepth === "normal"
      ) {
        const current = norm(ctx.data.reply);
        const loweredCurrent = lower(current);

        const alreadyHasFollowUp =
          /\?$/.test(current) ||
          loweredCurrent.includes("what would it") ||
          loweredCurrent.includes("who would use it") ||
          loweredCurrent.includes("what problem would") ||
          loweredCurrent.includes("你希望它先") ||
          loweredCurrent.includes("谁会先用");

        if (!alreadyHasFollowUp) {
          const followUp =
            lang === "zh"
              ? "你希望它先解决什么问题？"
              : lang === "mixed"
              ? "What problem would it solve first?\n你希望它先解决什么问题？"
              : "What problem would it solve first?";

          ctx.data.reply = appendUniqueLine(current, followUp);
        }
      }

      if (
        intelligence.shouldLightRedirect &&
        !signals.meaningSignal &&
        !signals.verificationSignal &&
        !signals.capabilityQuestionSignal &&
        !signals.communityIdentityQuestionSignal &&
        !signals.systemQuestionSignal &&
        !signals.directQuestionSignal &&
        Math.random() < LIGHT_REDIRECT_RATE
      ) {
        const current = norm(ctx.data.reply);
        const extra =
          lang === "zh"
            ? "先把重点放回一个更具体的问题。"
            : lang === "mixed"
            ? "Let’s bring this back to one concrete problem.\n先把重点拉回一个更具体的问题。"
            : "Let’s bring this back to one concrete problem.";

        ctx.data.reply = appendUniqueLine(current, extra);
      }

      if (intelligence.shouldAvoidRouting && intelligence.preferredAction === "none") {
        ctx.data.suggestedAction = "none";
      }

      if (
        intelligence.roomState === "tense" ||
        intelligence.momentum === "cooling" ||
        intelligence.momentum === "repetitive"
      ) {
        if (
          ctx.data.suggestedAction !== "/links" &&
          ctx.data.suggestedAction !== "/knowledge"
        ) {
          ctx.data.suggestedAction = "none";
        }
      }

      try {
        const state = inferGroupState(recentMessages);

        if (
          state !== "conflict" &&
          state !== "fud_risk" &&
          state !== "high_noise" &&
          state !== "hype_overheat"
        ) {
          if (
            shouldIgnite(state) &&
            !signals.meaningSignal &&
            !signals.verificationSignal &&
            !signals.capabilityQuestionSignal &&
            !signals.communityIdentityQuestionSignal &&
            !signals.systemQuestionSignal &&
            !signals.directQuestionSignal &&
            !signals.newsSignal &&
            !signals.pricingSignal &&
            !signals.xSignal &&
            !signals.webSignal &&
            !intelligence.shouldStayMinimal &&
            intelligence.responseDepth !== "full"
          ) {
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
                network.coordinationState,
                community,
                seed
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
        // ignore
      }

      ctx.data.reply = finalizeReplyLines(ctx.data.reply, lang);

      ctx.data = applyConstraintsOrFallback({
        data: ctx.data,
        input: ctx.input,
      }).data;

      ctx.data.reply = finalizeReplyLines(ctx.data.reply, lang);
      ctx.data.suggestedAction = ensureAllowedAction(ctx.data.suggestedAction ?? "none");

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "waoc_chat",
  def: waocChatWorkflowDef as any,
});