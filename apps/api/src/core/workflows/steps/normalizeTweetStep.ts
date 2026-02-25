import type { WorkflowContext, WorkflowStep } from "../types.js";

type TweetData = {
  tweet_zh: string;
  tweet_en: string;
  hashtags: string[];
  cta: string;
};

export function normalizeTweetStep<TInput extends { link?: string }>(
): WorkflowStep<WorkflowContext<TInput, TweetData>> {
  return async (ctx) => {
    try {
      const data = ctx.data as any;
      if (!data || typeof data !== "object") return { ok: true };

      const link = ctx.input?.link ? String(ctx.input.link) : "";

      // --- hashtags normalize ---
      if (!Array.isArray(data.hashtags)) data.hashtags = [];
      data.hashtags = data.hashtags
        .map((h: any) => String(h || "").trim())
        .filter((h: string) => h.length > 0)
        .map((h: string) => (h.startsWith("#") ? h : `#${h}`));

      // clamp 3-6 (add defaults if too few)
      if (data.hashtags.length < 3) {
        const defaults = ["#OneAI", "#Web3", "#AI", "#Infrastructure", "#Innovation"];
        for (const d of defaults) {
          if (data.hashtags.length >= 3) break;
          if (!data.hashtags.includes(d)) data.hashtags.push(d);
        }
      }
      if (data.hashtags.length > 6) data.hashtags = data.hashtags.slice(0, 6);

      // --- cta normalize ---
      data.cta = String(data.cta ?? "").trim();

      if (!data.cta) {
        data.cta = link ? `Learn more: ${link}` : "Learn more.";
      } else if (link && !data.cta.includes(link)) {
        // 如果 cta 有内容但没包含 link，就补上
        data.cta = `${data.cta} ${link}`.trim();
      }

      ctx.data = data;
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
}