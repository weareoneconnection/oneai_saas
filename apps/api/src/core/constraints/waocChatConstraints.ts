// src/core/constraints/waocChatConstraints.ts

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

type CheckArgs = {
  data: WaocChatData;
  userMessage?: string;
  lang?: "en" | "zh";
};

type CheckResult =
  | { ok: true; data: WaocChatData }
  | { ok: false; reason: string; data?: WaocChatData };

const ACTIONS: WaocSuggestedAction[] = [
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

/* =========================
   helpers
========================= */

function norm(v: unknown): string {
  return String(v ?? "").trim();
}

function lower(v: unknown): string {
  return norm(v).toLowerCase();
}

function normalizeBlankLines(s: string): string {
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function stripCodeFences(s: string): string {
  return s.replace(/```[\s\S]*?```/g, "").trim();
}

function sanitizeReply(reply: unknown, lang: "en" | "zh" = "en"): string {
  let r = norm(reply);
  r = stripCodeFences(r);
  r = normalizeBlankLines(r);

  if (!r) {
    return lang === "zh" ? "收到。" : "Got it.";
  }

  // 只做长度保护，不强行补句、不强行凑行数
  if (r.length > 900) {
    r = r.slice(0, 900).trim();
  }

  return r || (lang === "zh" ? "收到。" : "Got it.");
}

function normalizeAction(action: unknown): WaocSuggestedAction {
  const a = norm(action) as WaocSuggestedAction;
  return ACTIONS.includes(a) ? a : "none";
}

/* =========================
   intent detection
========================= */

function userExplicitlyAsksMeaning(msgLower: string): boolean {
  return (
    /\bwaoc\b.*(\bmeaning\b|\bmean\b|\bmeans\b|\bacronym\b|\bfull\s*form\b|\bstands?\s+for\b)/.test(
      msgLower
    ) ||
    /\bwhat\s+does\s+waoc\s+(mean|stand\s+for)\b/.test(msgLower) ||
    /\bwhat\s+(is|’s|'s)\s+waoc\b/.test(msgLower) ||
    /^\s*waoc\s*\?\s*$/.test(msgLower) ||
    /全称|什么意思|含义|缩写|代表什么|啥意思/.test(msgLower)
  );
}

function looksLikeCAQuestion(msgLower: string): boolean {
  return (
    /\bca\b/.test(msgLower) ||
    msgLower.includes("contract") ||
    msgLower.includes("address") ||
    msgLower.includes("合约") ||
    msgLower.includes("地址")
  );
}

function looksLikeNewsQuestion(msgLower: string): boolean {
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
    msgLower.includes("进展") ||
    msgLower.includes("更新")
  );
}

function looksLikePriceQuestion(msgLower: string): boolean {
  return (
    /\bprice\b/.test(msgLower) ||
    /\bmarket cap\b/.test(msgLower) ||
    /\bchart\b/.test(msgLower) ||
    /\bvaluation\b/.test(msgLower) ||
    /\btoken price\b/.test(msgLower) ||
    /价格|币价|行情|市值|估值|走势图/.test(msgLower)
  );
}

function looksLikeXQuestion(msgLower: string): boolean {
  return (
    /\bx\.com\b/.test(msgLower) ||
    /\btwitter\b/.test(msgLower) ||
    /\btweet\b/.test(msgLower) ||
    /推特|推文|x账号|x 帐号/.test(msgLower)
  );
}

function looksLikeWebQuestion(msgLower: string): boolean {
  return (
    /\bhttps?:\/\//.test(msgLower) ||
    /\bwebsite\b/.test(msgLower) ||
    /\bweb page\b/.test(msgLower) ||
    /\barticle\b/.test(msgLower) ||
    /\blink\b/.test(msgLower) ||
    /网页|文章|网址|链接|网站/.test(msgLower)
  );
}

function looksLikeHelpQuestion(msgLower: string): boolean {
  return (
    msgLower === "/help" ||
    /\bhelp\b/.test(msgLower) ||
    /how to use|what can i do|commands|帮助|怎么用|指令|功能/.test(msgLower)
  );
}

function looksLikeMissionIntent(msgLower: string): boolean {
  return /mission|task|objective|deliver|execution|任务|目标|执行|交付|落地/.test(msgLower);
}

function looksLikeRankIntent(msgLower: string): boolean {
  return /rank|ranking|leaderboard|score|points|排行榜|排名|积分/.test(msgLower);
}

function looksLikeReportIntent(msgLower: string): boolean {
  return /report|summary|summarize|weekly|daily|报告|总结|日报|周报/.test(msgLower);
}

function looksLikeBuilderIntent(msgLower: string): boolean {
  return /builder|developer|dev|contributor|开发者|构建者|贡献者/.test(msgLower);
}

function looksLikeKnowledgeIntent(msgLower: string): boolean {
  return /knowledge|guide|faq|playbook|docs|documentation|知识|指南|文档|原理/.test(msgLower);
}

function looksLikeGrowthIntent(msgLower: string): boolean {
  return /growth|marketing|promotion|campaign|增长|推广|传播/.test(msgLower);
}

function looksLikeEventsIntent(msgLower: string): boolean {
  return /event|events|space|ama|meetup|workshop|活动|会议|日程/.test(msgLower);
}

function looksLikeToolsIntent(msgLower: string): boolean {
  return /tools|tooling|stack|resources|工具|资源|工具栈/.test(msgLower);
}

function looksLikeExternalVerification(msgLower: string): boolean {
  return (
    looksLikeCAQuestion(msgLower) ||
    looksLikeNewsQuestion(msgLower) ||
    looksLikePriceQuestion(msgLower) ||
    msgLower.includes("listing") ||
    msgLower.includes("listed") ||
    msgLower.includes("partner") ||
    msgLower.includes("partnership") ||
    msgLower.includes("audit") ||
    msgLower.includes("verify") ||
    msgLower.includes("scam") ||
    msgLower.includes("真假") ||
    msgLower.includes("上所") ||
    msgLower.includes("合作") ||
    msgLower.includes("审计") ||
    msgLower.includes("验证")
  );
}

/* =========================
   fabrication guard
========================= */

function looksLikeFabricatedClaim(replyLower: string): boolean {
  return (
    /\b(contract address|official contract|listed on|listed at|partnership with|partnered with|audit by|audited by)\b/.test(
      replyLower
    ) ||
    /(合约地址是|官方合约|已经上线|上线于|合作伙伴|已合作|审计方|由.+审计)/.test(
      replyLower
    )
  );
}

/* =========================
   waoc meaning handling
========================= */

function ensureFirstLineFullForm(reply: string, lang: "en" | "zh"): string {
  const required =
    lang === "zh"
      ? "WAOC = We Are One Connection。"
      : "WAOC = We Are One Connection.";

  const cleaned = sanitizeReply(reply, lang)
    .replace(/^WAOC\s*=\s*We\s+Are\s+One\s+Connection[。.]?\s*/i, "")
    .trim();

  return cleaned ? `${required}\n${cleaned}` : required;
}

/* =========================
   fallback action inference
========================= */

function inferFallbackActionFromUserMessage(msgLower: string): WaocSuggestedAction {
  if (looksLikeHelpQuestion(msgLower)) return "/help";
  if (looksLikeNewsQuestion(msgLower)) return "/news";
  if (looksLikePriceQuestion(msgLower)) return "/price";
  if (looksLikeXQuestion(msgLower)) return "/x";
  if (looksLikeWebQuestion(msgLower)) return "/web";
  if (looksLikeExternalVerification(msgLower)) return "/links";
  if (looksLikeMissionIntent(msgLower)) return "/mission";
  if (looksLikeRankIntent(msgLower)) return "/rank";
  if (looksLikeReportIntent(msgLower)) return "/report";
  if (looksLikeBuilderIntent(msgLower)) return "/builders";
  if (looksLikeKnowledgeIntent(msgLower)) return "/knowledge";
  if (looksLikeGrowthIntent(msgLower)) return "/growth";
  if (looksLikeEventsIntent(msgLower)) return "/events";
  if (looksLikeToolsIntent(msgLower)) return "/tools";
  return "none";
}

/* =========================
   core check
========================= */

export function checkWaocChatConstraints(args: CheckArgs): CheckResult {
  const input = args?.data ?? ({ reply: "" } as WaocChatData);
  const userMessage = norm(args?.userMessage);
  const msgLower = lower(userMessage);
  const lang: "en" | "zh" = args?.lang === "zh" ? "zh" : "en";

  const fixed: WaocChatData = {
    reply: sanitizeReply(input.reply, lang),
    suggestedAction: normalizeAction(input.suggestedAction ?? "none"),
  };

  // 仅在“明确问 WAOC 含义”时才强制首行
  if (userMessage && userExplicitlyAsksMeaning(msgLower)) {
    fixed.reply = ensureFirstLineFullForm(fixed.reply, lang);
  }

  // 外部验证型问题：如果回复里像在乱报事实，就强制回退
  if (looksLikeExternalVerification(msgLower) && looksLikeFabricatedClaim(lower(fixed.reply))) {
    fixed.reply =
      lang === "zh"
        ? "这类外部信息我无法在这里直接验证。\n建议只以官方渠道为准。"
        : "I can’t verify that external information here.\nUse official sources only.";
    fixed.suggestedAction = "/links";
  }

  // 优先路由外部 agent 类动作
  if (looksLikeNewsQuestion(msgLower)) {
    fixed.suggestedAction = "/news";
  } else if (looksLikePriceQuestion(msgLower)) {
    fixed.suggestedAction = "/price";
  } else if (looksLikeXQuestion(msgLower)) {
    fixed.suggestedAction = "/x";
  } else if (looksLikeWebQuestion(msgLower)) {
    fixed.suggestedAction = "/web";
  } else if (looksLikeHelpQuestion(msgLower)) {
    fixed.suggestedAction = "/help";
  } else if (looksLikeExternalVerification(msgLower)) {
    fixed.suggestedAction = "/links";
  }

  if (fixed.suggestedAction === "none") {
    fixed.suggestedAction = inferFallbackActionFromUserMessage(msgLower);
  }

  fixed.reply = sanitizeReply(fixed.reply, lang);
  fixed.suggestedAction = normalizeAction(fixed.suggestedAction);

  if (!fixed.reply) {
    return { ok: false, reason: "empty_reply", data: fixed };
  }

  if (!ACTIONS.includes(fixed.suggestedAction)) {
    return { ok: false, reason: "bad_action", data: fixed };
  }

  return { ok: true, data: fixed };
}

/* =========================
   safe wrapper
========================= */

export function checkWaocChatConstraintsSafe(
  args: CheckArgs
): { ok: true; data: WaocChatData } {
  const r = checkWaocChatConstraints(args);

  if (r.ok) {
    return { ok: true, data: r.data };
  }

  const lang: "en" | "zh" = args?.lang === "zh" ? "zh" : "en";

  return {
    ok: true,
    data: {
      reply: lang === "zh" ? "收到。" : "Got it.",
      suggestedAction: "none",
    },
  };
}