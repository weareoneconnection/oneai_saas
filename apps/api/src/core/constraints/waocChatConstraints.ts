// src/core/constraints/waocChatConstraints.ts
export type WaocChatData = {
  reply: string;
  suggestedAction?: string;
};

function norm(s: any) {
  return String(s ?? "").trim();
}

export function checkWaocChatConstraints(data: WaocChatData) {
  const errors: string[] = [];

  const reply = norm(data?.reply);
  if (!reply) errors.push("reply must be non-empty");

  // 不要“请澄清/聚焦/你想了解哪方面”这种机器人开场
  const lowerReply = reply.toLowerCase();
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

  // ✅ WAOC acronym MUST be fixed
  // 只要提到 WAOC meaning / stands for / 是什么含义，就必须包含 We Are One Connection
  const asksMeaning =
    /waoc.*meaning|what.*waoc|stands for|acronym|全称|什么意思|含义|缩写|代表什么/.test(lowerReply);

  const mustPhrase = "we are one connection";
  if (asksMeaning && !lowerReply.includes(mustPhrase)) {
    errors.push('Must explicitly state: "WAOC = We Are One Connection"');
  }

  // ❌ 禁止错误扩写（你截图里的两个都在这里）
  const banned = [
    "we are one community",
    "web of autonomous",
    "autonomous communities",
    "one community",
  ];
  if (banned.some((s) => lowerReply.includes(s))) {
    errors.push("WAOC acronym expansion is invalid (do not redefine WAOC)");
  }

  // suggestedAction 长度限制
  if (data?.suggestedAction && data.suggestedAction.length > 200) {
    errors.push("suggestedAction too long (max 200 chars)");
  }

  return { ok: errors.length === 0, errors };
}