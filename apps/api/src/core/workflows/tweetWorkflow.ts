import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

import { preparePromptStep } from "./steps/preparePromptStep.js";
import { generateLLMStep } from "./steps/generateLLMStep.js";
import { parseJsonStep } from "./steps/parseJsonStep.js";
import { validateSchemaStep } from "./steps/validateSchemaStep.js";
import { refineJsonStep } from "./steps/refineJsonStep.js";
import { normalizeTweetStep } from "./steps/normalizeTweetStep.js";

import { tweetValidator } from "../validators/tweetValidator.js";
import { registerWorkflow } from "./registry.js";
import { checkTweetConstraints } from "../constraints/tweetConstraints.js";

export type TweetInput = {
  topic: string;
  audience?: string;
  tone?: string;
  brand?: string;
  link?: string;
};

export type TweetData = {
  tweet_zh: string;
  tweet_en: string;
  hashtags: string[];
  cta: string;
};

type TweetCtx = WorkflowContext<TweetInput, TweetData> & { templateVersion: number };

export const tweetWorkflowDef: WorkflowDefinition<TweetCtx> = {
  name: "tweet_workflow",
  maxAttempts: 3,
  steps: [
    preparePromptStep<TweetInput, TweetData>({
      task: "tweet",
      templateVersion: 1,
      variables: (input) => ({
        topic: input.topic,
        audience: input.audience ?? "builders / creators / founders",
        tone: input.tone ?? "civilization-scale but practical",
        brand: input.brand ?? "OneAI",
        link: input.link ?? ""
      })
    }),

    generateLLMStep<TweetInput, TweetData>(),
    parseJsonStep<TweetInput, TweetData>(),

    // ✅ 先用代码兜底关键字段（避免 schema 因 cta="" 直接爆）
    normalizeTweetStep<TweetInput>(),

    validateSchemaStep<TweetInput, TweetData>(tweetValidator),

    // ✅ 若业务规则仍不满足 → 让模型修（主要用于“超字/表达不佳”等）
    refineJsonStep<TweetInput, TweetData>({
      check: (ctx) => checkTweetConstraints(ctx.data as any, ctx.input.link),
      extraInstruction: "Keep tweet_zh and tweet_en under 260 chars each. Keep hashtags 3-6. cta must include link if provided."
    }),

    // refine 后再 parse + normalize + validate + constraints
    parseJsonStep<TweetInput, TweetData>(),
    normalizeTweetStep<TweetInput>(),
    validateSchemaStep<TweetInput, TweetData>(tweetValidator),

    async (ctx: TweetCtx) => {
  const r = checkTweetConstraints(ctx.data as any, ctx.input.link);
  if (!r.ok) return { ok: false, error: r.errors };

  // ✅ TS 保险：确保 data 存在
  if (!ctx.data) return { ok: false, error: ["internal: data undefined"] };

  const link = (ctx.input.link ?? "").trim();

  // 1) 如果没传 link：绝不允许输出任何 http(s) 链接
  if (!link) {
    const stripLinks = (s: string) => s.replace(/https?:\/\/\S+/g, "").trim();

    ctx.data.tweet_zh = stripLinks(ctx.data.tweet_zh);
    ctx.data.tweet_en = stripLinks(ctx.data.tweet_en);

    // cta 也去掉链接（避免模型补默认地址）
    ctx.data.cta = stripLinks(ctx.data.cta);

    // 如果 cta 被清空，给一个无链接 CTA
    if (!ctx.data.cta) {
      ctx.data.cta = "Join the WAOC community.";
    }

    return { ok: true };
  }

  // 2) 如果传了 link：确保 cta 一定包含这个 link（并去掉其他错误 link）
  const hasLink = ctx.data.cta.includes(link);
  const cleanedCta = ctx.data.cta.replace(/https?:\/\/\S+/g, "").trim();
  ctx.data.cta = hasLink ? ctx.data.cta : `${cleanedCta} ${link}`.trim();

  // tweet 中若出现了别的链接，全部替换成正确 link
  const replaceAnyLinkWith = (s: string) => s.replace(/https?:\/\/\S+/g, link);
  ctx.data.tweet_zh = replaceAnyLinkWith(ctx.data.tweet_zh);
  ctx.data.tweet_en = replaceAnyLinkWith(ctx.data.tweet_en);

  return { ok: true };
}
  ]
};

registerWorkflow({
  task: "tweet",
  def: tweetWorkflowDef as any
});