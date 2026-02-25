export type TweetData = {
  tweet_zh: string;
  tweet_en: string;
  hashtags: string[];
  cta: string;
};

function len(s: string) {
  return [...(s || "")].length;
}

export function checkTweetConstraints(data: TweetData, link?: string) {
  const errors: string[] = [];

  if (!data?.tweet_zh || !data?.tweet_en) errors.push("tweet_zh and tweet_en are required.");

  if (len(data.tweet_zh) > 260) errors.push(`tweet_zh too long: ${len(data.tweet_zh)} > 260`);
  if (len(data.tweet_en) > 260) errors.push(`tweet_en too long: ${len(data.tweet_en)} > 260`);

  const n = data.hashtags?.length ?? 0;
  if (n < 3 || n > 6) errors.push(`hashtags count must be 3-6, got ${n}`);

  for (const h of data.hashtags || []) {
    if (!h.startsWith("#")) errors.push(`hashtag must start with '#': ${h}`);
    if (len(h) > 24) errors.push(`hashtag too long (>24 chars): ${h}`);
  }

  if (!data.cta) errors.push("cta is required.");
  if (link && data.cta && !data.cta.includes(link)) errors.push("cta must include the provided link.");

  return { ok: errors.length === 0, errors };
}