// src/core/constraints/waocChatConstraints.ts

export type WaocSuggestedAction =
  | "none"
  | "/links"
  | "/mission"
  | "/rank"
  | "/report"
  | "/builders"
  | "/knowledge"
  | "/growth";

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

function trimReplyLines(reply: string, maxLines = 6) {
  const lines = reply
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  if (lines.length <= maxLines) return lines.join("\n");
  return lines.slice(0, maxLines).join("\n");
}

function sanitizeReply(reply: any) {
  let r = norm(reply);

  if (!r) r = "Got it.";

  // remove accidental code fences
  r = r.replace(/```[\s\S]*?```/g, "").trim();

  // normalize repeated blank lines
  r = r.replace(/\n{3,}/g, "\n\n").trim();

  if (!r) r = "Got it.";

  // prevent extremely long outputs
  if (r.length > 2000) {
    r = r.slice(0, 2000);
  }

  // keep replies compact
  r = trimReplyLines(r, 6);

  if (!r) r = "Got it.";

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

  const r = sanitizeReply(reply);

  if (r.startsWith(required)) return r;

  const cleaned = r
    .replace(/^WAOC\s*=\s*We\s+Are\s+One\s+Connection[。.]?\s*/i, "")
    .trim();

  return cleaned ? `${required}\n${cleaned}` : required;
}

function stripUnnecessaryMeaning(reply: string) {
  return reply
    .replace(/^WAOC\s*=\s*We\s+Are\s+One\s+Connection[。.]?\s*/i, "")
    .trim();
}

/* -------------------------
verification detection
------------------------- */

function looksLikeExternalVerification(msgLower: string) {
  return (
    /\bca\b/.test(msgLower) ||
    msgLower.includes("contract") ||
    msgLower.includes("address") ||
    msgLower.includes("price") ||
    msgLower.includes("listing") ||
    msgLower.includes("listed") ||
    msgLower.includes("partner") ||
    msgLower.includes("partnership") ||
    msgLower.includes("audit") ||
    msgLower.includes("news") ||
    msgLower.includes("latest") ||
    msgLower.includes("update") ||
    msgLower.includes("verify") ||
    msgLower.includes("scam") ||
    msgLower.includes("合约") ||
    msgLower.includes("地址") ||
    msgLower.includes("价格") ||
    msgLower.includes("上线") ||
    msgLower.includes("上所") ||
    msgLower.includes("合作") ||
    msgLower.includes("审计") ||
    msgLower.includes("新闻") ||
    msgLower.includes("最新") ||
    msgLower.includes("更新") ||
    msgLower.includes("真假")
  );
}

/* -------------------------
fabrication detection
------------------------- */

function looksLikeFabricatedClaim(replyLower: string) {
  return (
    /\b(contract address|official contract|price is|listed on|listed at|partnership with|partnered with|audit by|audited by)\b/.test(
      replyLower
    ) ||
    /(合约地址是|官方合约|价格是|已经上线|上线于|合作伙伴|已合作|审计方|由.+审计)/.test(
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
    reply: sanitizeReply(data.reply),
    suggestedAction: normalizeAction(data.suggestedAction ?? "none"),
  };

  /* enforce or strip WAOC acronym line */

  if (userMessage && userExplicitlyAsksMeaning(msgLower)) {
    fixed.reply = ensureFirstLineFullForm(fixed.reply, lang);
  } else {
    fixed.reply = stripUnnecessaryMeaning(fixed.reply);
    fixed.reply = sanitizeReply(fixed.reply);
  }

  /* prevent fabricated claims — strict only when the user is asking verification-like questions */

  const replyLower = lower(fixed.reply);
  const strictVerificationMode =
    !!userMessage && looksLikeExternalVerification(msgLower);

  if (strictVerificationMode && looksLikeFabricatedClaim(replyLower)) {
    fixed.reply =
      lang === "zh"
        ? "我无法在这里验证这些外部信息。请查看官方渠道。"
        : "I can't verify that here. Check official sources.";

    fixed.suggestedAction = "/links";
  }

  /* verification routing */

  if (userMessage && looksLikeExternalVerification(msgLower)) {
    if (fixed.suggestedAction === "none") {
      fixed.suggestedAction = "/links";
    }
  }

  /* light fallback action inference */

  if (userMessage && fixed.suggestedAction === "none") {
    fixed.suggestedAction = inferFallbackActionFromUserMessage(msgLower);
  }

  /* final sanitize after mutations */

  fixed.reply = sanitizeReply(fixed.reply);
  fixed.suggestedAction = normalizeAction(fixed.suggestedAction ?? "none");

  /* minimal validity */

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

  const d = r.data ?? {
    reply: "Got it.",
    suggestedAction: "none",
  };

  return {
    ok: true,
    data: {
      reply: sanitizeReply(d.reply),
      suggestedAction: normalizeAction(d.suggestedAction ?? "none"),
    },
  };
}