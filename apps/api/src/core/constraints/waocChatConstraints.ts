// src/core/constraints/waocChatConstraints.ts

export type WaocChatData = {
  reply: string;
  suggestedAction?: string;
};

function norm(s: any) {
  return String(s ?? "").trim();
}

function lower(s: any) {
  return norm(s).toLowerCase();
}

/**
 * 是否属于“需要外部验证”的问题
 * 不再一个个加 intent，而是统一规则
 */
function needsVerification(replyLower: string) {
  return /news|latest|update|updates|today|now|current|price|valuation|market|pump|dump|chart|contract|address|\bca\b|verify|official|scam|真假|最新|今天|现在|新闻|更新|价格|估值|市值|行情|合约|地址|验证|防骗/.test(
    replyLower
  );
}

/**
 * 是否包含“我无法验证/不会乱编”的声明
 */
function hasDisclosure(replyLower: string) {
  return /won't make (it|things) up|i can’t verify|i cannot verify|i don't have reliable access|can’t reliably know|i won't guess|不乱编|不会乱编|无法验证|我没法验证|不会猜|不猜/.test(
    replyLower
  );
}

/**
 * 是否包含“具体下一步”
 */
function hasConcreteNextStep(replyLower: string) {
  return /\/report|pinned|pin|official|website|x\.com|telegram|join|link|官网|置顶|官方|入口|链接|频道|公告|\/rank|\/mission/.test(
    replyLower
  );
}

/**
 * 是否属于 PR 空话
 */
function containsFluff(replyLower: string) {
  return /stay tuned|exciting developments|we're continuously building|keep the community engaged|it's important to stay informed|consider sharing|thriving|interconnected civilization|请关注官方渠道|敬请期待|持续建设|激动人心|保持关注/.test(
    replyLower
  );
}

export function checkWaocChatConstraints(data: WaocChatData) {
  const errors: string[] = [];

  const reply = norm(data?.reply);
  if (!reply) errors.push("reply must be non-empty");

  const lowerReply = lower(reply);

  /* -----------------------------
     1️⃣ 禁止机器人开场
  ----------------------------- */
  const bannedStarts = [
    "clarify",
    "focus on",
    "identify",
    "please clarify",
    "what specific area",
    "could you clarify",
    "can you clarify",
    "请问你需要了解",
    "你想了解哪个方面",
    "请具体说明",
  ];
  if (bannedStarts.some((s) => lowerReply.startsWith(s))) {
    errors.push("reply too generic/coaching; answer directly like a normal person");
  }

  /* -----------------------------
     2️⃣ WAOC 扩写必须唯一
  ----------------------------- */
  const asksMeaning =
    /waoc.*meaning|what.*waoc|stands for|acronym|全称|什么意思|含义|缩写|代表什么/.test(lowerReply);

  const mustPhrase = "we are one connection";
  if (asksMeaning && !lowerReply.includes(mustPhrase)) {
    errors.push('Must explicitly state: "WAOC = We Are One Connection"');
  }

  const bannedAcronyms = [
    "we are one community",
    "web of autonomous",
    "autonomous communities",
    "one community",
  ];
  if (bannedAcronyms.some((s) => lowerReply.includes(s))) {
    errors.push("WAOC acronym expansion is invalid (do not redefine WAOC)");
  }

  /* -----------------------------
     3️⃣ 禁止 PR 空话
  ----------------------------- */
  if (containsFluff(lowerReply)) {
    errors.push("reply contains PR-style fluff; must be concrete");
  }

  /* -----------------------------
     4️⃣ Truth Gate（一次性解决 news/price 等问题）
  ----------------------------- */
  if (needsVerification(lowerReply)) {
    if (!hasDisclosure(lowerReply)) {
      errors.push(
        "verification-type reply must disclose uncertainty (cannot verify / won't guess)"
      );
    }
    if (!hasConcreteNextStep(lowerReply)) {
      errors.push(
        "verification-type reply must provide a concrete next step (pinned, official links, /report)"
      );
    }
  }

  /* -----------------------------
     5️⃣ suggestedAction 长度限制
  ----------------------------- */
  if (data?.suggestedAction && data.suggestedAction.length > 200) {
    errors.push("suggestedAction too long (max 200 chars)");
  }

  return { ok: errors.length === 0, errors };
}