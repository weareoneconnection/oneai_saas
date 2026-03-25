// src/core/constraints/waocChatConstraints.ts

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

/* -------------------------
helpers
------------------------- */

function norm(s: any) {
  return String(s ?? "").trim();
}

function lower(s: any) {
  return norm(s).toLowerCase();
}

function normalizeBlankLines(s: string) {
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function removeCodeFences(s: string) {
  return s.replace(/```[\s\S]*?```/g, "").trim();
}

function splitLines(s: string) {
  return normalizeBlankLines(s)
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function makeNaturalPaddingLine(first: string, lang: "en" | "zh" = "en") {
  const f = lower(first);

  if (lang === "zh") {
    if (/价格|币价|市值|行情/.test(f)) return "如果要实时数据，还需要接价格源。";
    if (/新闻|动态|公告/.test(f)) return "如果要最新动态，还需要接新闻源。";
    if (/推特|账号|推文|x/.test(f)) return "如果要继续分析，最好直接读取该账号内容。";
    if (/网页|文章|链接|网站/.test(f)) return "如果要更准确总结，最好先抓取正文。";
    if (/任务|mission/.test(f)) return "这个方向可以继续收敛成一个更具体的任务。";
    if (/builder|构建|开发/.test(f)) return "这类进展通常值得继续往下一步推进。";
    return "这个方向可以继续往下展开。";
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
  if (/builder|build|developer|dev/.test(f)) {
    return "That is usually worth pushing one step further.";
  }

  return "This could be taken one step further.";
}

function trimReplyLines(
  reply: string,
  minLines = 2,
  maxLines = 5,
  lang: "en" | "zh" = "en"
) {
  const lines = splitLines(reply);

  if (lines.length === 0) {
    return lang === "zh"
      ? "收到。\n这个方向可以继续往下展开。"
      : "Got it.\nThis could be taken one step further.";
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join("\n");
  }

  if (lines.length >= minLines) {
    return lines.join("\n");
  }

  if (lines.length === 1) {
    const first = lines[0];
    return [first, makeNaturalPaddingLine(first, lang)].join("\n");
  }

  return lines.join("\n");
}

function sanitizeReply(reply: any, lang: "en" | "zh" = "en") {
  let r = norm(reply);

  if (!r) {
    r =
      lang === "zh"
        ? "收到。\n先保留这个方向。\n后面再继续推进。"
        : "Got it.\nKeeping this direction noted.\nWe can refine it from here.";
  }

  r = removeCodeFences(r);
  r = normalizeBlankLines(r);

  if (!r) {
    r =
      lang === "zh"
        ? "收到。\n先保留这个方向。\n后面再继续推进。"
        : "Got it.\nKeeping this direction noted.\nWe can refine it from here.";
  }

  if (r.length > 800) {
    r = r.slice(0, 800).trim();
  }

  r = trimReplyLines(r, 2, 5, lang);

  if (!r) {
    r =
      lang === "zh"
        ? "收到。\n先保留这个方向。\n后面再继续推进。"
        : "Got it.\nKeeping this direction noted.\nWe can refine it from here.";
  }

  return r;
}

function normalizeAction(a: any): WaocSuggestedAction {
  const v = norm(a) as WaocSuggestedAction;
  return ACTIONS.includes(v) ? v : "none";
}

/* -------------------------
meaning detection
------------------------- */

function userExplicitlyAsksMeaning(msgLower: string) {
  return (
    /\bwaoc\b.*(\bmeaning\b|\bmean\b|\bmeans\b|\bacronym\b|\bfull\s*form\b|\bexpand(ed)?\b|\bstands?\s+for\b)/.test(
      msgLower
    ) ||
    /\bwhat\s+does\s+waoc\s+(mean|stand\s+for)\b/.test(msgLower) ||
    /\bwhat\s+(is|’s|'s)\s+waoc\b/.test(msgLower) ||
    /^\s*waoc\s*\?\s*$/.test(msgLower) ||
    /全称|什么意思|含义|缩写|代表什么|展开|啥意思/.test(msgLower)
  );
}

function ensureFirstLineFullForm(reply: string, lang: "en" | "zh") {
  const required =
    lang === "zh"
      ? "WAOC = We Are One Connection。"
      : "WAOC = We Are One Connection.";

  const cleaned = sanitizeReply(reply, lang)
    .replace(/^WAOC\s*=\s*We\s+Are\s+One\s+Connection[。.]?\s*/i, "")
    .trim();

  const merged = cleaned ? `${required}\n${cleaned}` : required;
  return sanitizeReply(merged, lang);
}

function stripUnnecessaryMeaning(reply: string, lang: "en" | "zh") {
  const stripped = reply
    .replace(/^WAOC\s*=\s*We\s+Are\s+One\s+Connection[。.]?\s*/i, "")
    .trim();

  return sanitizeReply(
    stripped ||
      (lang === "zh"
        ? "收到。\n先保留这个方向。\n后面再继续推进。"
        : "Got it.\nKeeping this direction noted.\nWe can refine it from here."),
    lang
  );
}

/* -------------------------
intent detection
------------------------- */

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

function looksLikeExternalVerification(msgLower: string) {
  return (
    looksLikeCAQuestion(msgLower) ||
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

/* -------------------------
fabrication detection
------------------------- */

function looksLikeFabricatedClaim(replyLower: string) {
  return (
    /\b(contract address|official contract|listed on|listed at|partnership with|partnered with|audit by|audited by)\b/.test(
      replyLower
    ) ||
    /(合约地址是|官方合约|已经上线|上线于|合作伙伴|已合作|审计方|由.+审计)/.test(
      replyLower
    )
  );
}

/* -------------------------
fallback action inference
------------------------- */

function inferFallbackActionFromUserMessage(
  msgLower: string
): WaocSuggestedAction {
  if (looksLikeNewsQuestion(msgLower)) return "/news";
  if (looksLikePriceQuestion(msgLower)) return "/price";
  if (looksLikeXQuestion(msgLower)) return "/x";
  if (looksLikeWebQuestion(msgLower)) return "/web";
  if (looksLikeExternalVerification(msgLower)) return "/links";
  if (/mission|task|objective|execute|execution|任务|目标|执行|交付/.test(msgLower))
    return "/mission";
  if (
    /builder|developer|dev|build|building|repo|code|开发者|构建者|开发|代码/.test(
      msgLower
    )
  )
    return "/builders";
  if (
    /knowledge|guide|faq|playbook|lesson|strategy|insight|知识|指南|经验|方法|洞察|文档/.test(
      msgLower
    )
  )
    return "/knowledge";
  if (/growth|campaign|retention|distribution|增长|传播|留存|活动/.test(msgLower))
    return "/growth";
  if (/report|summary|summarize|weekly|daily|总结|报告|周报|日报/.test(msgLower))
    return "/report";
  if (/rank|leaderboard|score|points|排行榜|排名|积分/.test(msgLower))
    return "/rank";
  return "none";
}

/* -------------------------
core check
------------------------- */

export function checkWaocChatConstraints(args: CheckArgs): CheckResult {
  const data = args?.data ?? ({ reply: "" } as any);
  const userMessage = norm(args?.userMessage);
  const msgLower = lower(userMessage);
  const lang: "en" | "zh" = args?.lang === "zh" ? "zh" : "en";

  const fixed: WaocChatData = {
    reply: sanitizeReply(data.reply, lang),
    suggestedAction: normalizeAction(data.suggestedAction ?? "none"),
  };

  /* enforce or strip WAOC acronym line */

  if (userMessage && userExplicitlyAsksMeaning(msgLower)) {
    fixed.reply = ensureFirstLineFullForm(fixed.reply, lang);
  } else {
    fixed.reply = stripUnnecessaryMeaning(fixed.reply, lang);
  }

  /* strict fabricated external claims guard */

  const replyLower = lower(fixed.reply);

  if (looksLikeExternalVerification(msgLower) && looksLikeFabricatedClaim(replyLower)) {
    fixed.reply =
      lang === "zh"
        ? "这类外部信息我无法在这里直接验证。\n建议只以官方渠道为准。\n先看官方链接入口。"
        : "I cannot verify that external information here.\nUse official sources only.\nStart from the official links.";

    fixed.suggestedAction = "/links";
  }

  /* route news / price / x / web first */

  if (looksLikeNewsQuestion(msgLower)) {
    fixed.suggestedAction = "/news";
  } else if (looksLikePriceQuestion(msgLower)) {
    fixed.suggestedAction = "/price";
  } else if (looksLikeXQuestion(msgLower)) {
    fixed.suggestedAction = "/x";
  } else if (looksLikeWebQuestion(msgLower)) {
    fixed.suggestedAction = "/web";
  } else if (looksLikeExternalVerification(msgLower)) {
    fixed.suggestedAction = "/links";
  }

  /* fallback action inference */

  if (fixed.suggestedAction === "none") {
    fixed.suggestedAction = inferFallbackActionFromUserMessage(msgLower);
  }

  /* final sanitize */

  fixed.reply = sanitizeReply(fixed.reply, lang);
  fixed.suggestedAction = normalizeAction(fixed.suggestedAction ?? "none");

  /* hard guarantee: 2–5 lines */

  fixed.reply = trimReplyLines(fixed.reply, 2, 5);

  if (!fixed.reply) {
    return { ok: false, reason: "empty_reply", data: fixed };
  }

  if (!ACTIONS.includes(fixed.suggestedAction ?? "none")) {
    return { ok: false, reason: "bad_action", data: fixed };
  }

  return { ok: true, data: fixed };
}

/* -------------------------
safe wrapper
------------------------- */

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
      reply:
        lang === "zh"
          ? "收到。\n先保留这个方向。\n后面再继续推进。"
          : "Got it.\nKeeping this direction noted.\nWe can refine it from here.",
      suggestedAction: "none",
    },
  };
}