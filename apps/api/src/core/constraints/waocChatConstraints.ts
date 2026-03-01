// src/core/constraints/waocChatConstraints.ts
// WAOC Identity Enforcement (Minimal v1)
// Only 2 hard rules:
// 1) WAOC expansion MUST be only "We Are One Connection" (ban any other expansion anywhere).
// 2) For external real-time facts (CA/price/news/listing/partnership/verify): must disclose cannot verify + give official verification path.
// Additionally:
// - If USER asks acronym meaning, reply MUST include: "WAOC = We Are One Connection" (exact string in EN/keep lower match).
// - suggestedAction is optional but if present must be "none" or "/links" (prevent UI spam).

export type WaocSuggestedAction = "none" | "/links";

export type WaocChatData = {
  reply: string;
  suggestedAction?: WaocSuggestedAction | string;
};

export type WaocChatCheckInput = {
  data: WaocChatData;
  userMessage?: string;
  lang?: "en" | "zh";
};

function norm(s: any) {
  return String(s ?? "").trim();
}
function lower(s: any) {
  return norm(s).toLowerCase();
}

/** USER meaning intent (minimal but practical) */
function userAsksAcronymMeaning(userLower: string) {
  const mentionsWAOC = /\bwaoc\b/.test(userLower) || userLower.includes("waoc");
  if (!mentionsWAOC) return false;

  return (
    /\bstands?\s+for\b|\bstanding\s+for\b|\bacronym\b|\bmeaning\b|\bmeans\b|\bfull\s*form\b|\bexpand(ed)?\b/.test(
      userLower
    ) ||
    /\bwhat\s+does\s+waoc\s+(mean|stand\s+for)\b/.test(userLower) ||
    /\bwhat\s+(is|’s|'s)\s+waoc\b/.test(userLower) ||
    /^\s*waoc\s*\?\s*$/.test(userLower) ||
    /全称|缩写|代表什么|什么意思|含义|展开|啥意思/.test(userLower) ||
    /waoc.*(全称|缩写|代表什么|什么意思|含义|展开|啥意思)/.test(userLower)
  );
}

/** Hard-allow only this expansion */
const MUST_PHRASE = "we are one connection";

/** Known bad expansions */
const BANNED_ACRONYMS = [
  "we are one community",
  "web of autonomous",
  "autonomous communities",
  "one community",
  "web of all communities",
  "web of all community",
];

/** Detect wrong expansions anywhere in reply */
function containsInvalidExpansion(replyLower: string) {
  if (BANNED_ACRONYMS.some((s) => replyLower.includes(s))) return true;

  // Explicit "WAOC = ..." / "stands for" etc not matching the allowed phrase
  const explicitBad =
    /waoc\s*(=|stands?\s+for|standing\s+for|is\s+short\s+for|expanded\s+as|refers\s+to)\s*(?!we\s+are\s+one\s+connection)/.test(
      replyLower
    );

  return explicitBad;
}

/** TruthGate trigger: ONLY external verification topics (minimal, narrow) */
function needsVerification(textLower: string) {
  return /(\bca\b|contract\s*address|price|valuation|market\s*(now|today|current)|news|latest|update|listing|partner(ship)?|verify|scam|真假|合约|地址|价格|估值|市值|行情|新闻|最新|更新|上所|合作|验证|防骗)/.test(
    textLower
  );
}

/** TruthGate: must disclose cannot verify / won't guess */
function hasDisclosure(replyLower: string) {
  return /(i can’t verify|i cannot verify|i can't verify|i won’t guess|i won't guess|i won’t fabricate|i won't fabricate|cannot verify real-time|not real-time|不乱编|不会乱编|无法验证|我没法验证|不会猜|不猜)/.test(
    replyLower
  );
}

/** TruthGate: must give a concrete verification path */
function hasConcreteNextStep(replyLower: string) {
  return /(pinned|pin|official|website|x\.com|telegram|\/links|官网|置顶|官方|入口|链接|频道)/.test(
    replyLower
  );
}

/** suggestedAction validation */
function isValidSuggestedAction(x: any): x is WaocSuggestedAction | undefined {
  return x === undefined || x === "none" || x === "/links";
}

/** Optional lightweight auto-fix (use only if you want) */
export function waocIdentityAutoFix(args: {
  reply: string;
  userMessage?: string;
  lang?: "en" | "zh";
}) {
  const uLower = lower(args.userMessage || "");
  const asksMeaning = userAsksAcronymMeaning(uLower);

  const prefix =
    args.lang === "zh"
      ? "WAOC = We Are One Connection。\n"
      : "WAOC = We Are One Connection.\n";

  let r = norm(args.reply);
  if (!r) return asksMeaning ? prefix.trim() : "";

  const rLower = lower(r);

  if (asksMeaning && !rLower.includes(MUST_PHRASE)) {
    r = `${prefix}${r}`;
  }

  if (containsInvalidExpansion(lower(r))) {
    r = r.replace(
      /WAOC\s*(=|stands?\s+for|standing\s+for|is\s+short\s+for|expanded\s+as|refers\s+to)\s*[^.。\n]+/gi,
      "WAOC = We Are One Connection"
    );

    for (const bad of BANNED_ACRONYMS) {
      const re = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      r = r.replace(re, "We Are One Connection");
    }
  }

  return r.trim();
}

/** Main check (Minimal) */
export function checkWaocChatConstraints(input: WaocChatCheckInput) {
  const errors: string[] = [];

  const data = input?.data;
  const reply = norm(data?.reply);
  if (!reply) errors.push("reply must be non-empty");

  const lowerReply = lower(reply);
  const userLower = lower(input?.userMessage || "");

  // Meaning enforcement ONLY when user asks meaning
  const asksMeaning = userAsksAcronymMeaning(userLower);
  if (asksMeaning && !lowerReply.includes(MUST_PHRASE)) {
    errors.push('If user asks meaning, must include: "WAOC = We Are One Connection"');
  }

  // Never allow invalid expansion anywhere
  if (containsInvalidExpansion(lowerReply)) {
    errors.push("WAOC acronym expansion is invalid (do not redefine WAOC)");
  }

  // TruthGate ONLY for verification topics
  const verificationTopic =
    needsVerification(userLower) || needsVerification(lowerReply);

  if (verificationTopic) {
    if (!hasDisclosure(lowerReply)) {
      errors.push("TruthGate: must disclose cannot verify / won't guess");
    }
    if (!hasConcreteNextStep(lowerReply)) {
      errors.push("TruthGate: must provide verification path (pinned/website/official X or /links)");
    }
  }

  // suggestedAction safe enum (optional)
  if (!isValidSuggestedAction((data as any)?.suggestedAction)) {
    errors.push('suggestedAction must be "none" or "/links"');
  }

  // legacy safeguard
  if ((data as any)?.suggestedAction && String((data as any).suggestedAction).length > 200) {
    errors.push("suggestedAction too long (max 200 chars)");
  }

  return { ok: errors.length === 0, errors };
}