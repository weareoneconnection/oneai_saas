import { registerWorkflow } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

type NewsInput = {
  message?: string;
  lang?: "en" | "zh" | "mixed";
};

type NewsData = {
  reply: string;
  suggestedAction: "/news";
};

type NewsCtx = WorkflowContext<NewsInput, NewsData> & {
  templateVersion: number;
};

type NewsItem = {
  title: string;
  url?: string;
  source?: string;
};

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function lower(s: unknown) {
  return norm(s).toLowerCase();
}

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string) {
  return decodeXml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractTopic(message: string) {
  const msg = lower(message);

  const candidates = [
    "bitcoin",
    "btc",
    "ethereum",
    "eth",
    "solana",
    "sol",
    "binance",
    "bnb",
    "xrp",
    "ai",
    "defi",
    "nft",
    "layer 2",
    "l2",
  ];

  for (const c of candidates) {
    if (msg.includes(c)) return c;
  }

  return "";
}

async function fetchCryptoPanicNews(topic: string): Promise<NewsItem[]> {
  const key = process.env.CRYPTOPANIC_API_KEY?.trim();
  if (!key) return [];

  const url =
    "https://cryptopanic.com/api/v1/posts/" +
    `?auth_token=${encodeURIComponent(key)}` +
    "&public=true" +
    "&kind=news" +
    "&filter=important" +
    (topic ? `&currencies=${encodeURIComponent(topic.toUpperCase())}` : "");

  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      source?: { title?: string };
    }>;
  };

  return (json.results ?? [])
    .map((x) => ({
      title: norm(x.title),
      url: norm(x.url),
      source: norm(x.source?.title),
    }))
    .filter((x) => x.title)
    .slice(0, 3);
}

function extractRssItems(xml: string): NewsItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  return items
    .map((item) => {
      const title = item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "";
      const source =
        item.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "";

      return {
        title: stripTags(title),
        url: stripTags(link),
        source: stripTags(source),
      };
    })
    .filter((x) => x.title)
    .slice(0, 3);
}

async function fetchRssNews(): Promise<NewsItem[]> {
  const rssSources = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
  ];

  for (const url of rssSources) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/rss+xml, application/xml, text/xml" },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const items = extractRssItems(xml);
      if (items.length) return items;
    } catch {
      // continue
    }
  }

  return [];
}

function filterNewsByTopic(items: NewsItem[], topic: string) {
  if (!topic) return items;

  const t = topic.toLowerCase();
  return items.filter((x) => lower(`${x.title} ${x.source}`).includes(t));
}

function formatNewsReply(items: NewsItem[], lang: "en" | "zh" | "mixed", topic: string) {
  if (!items.length) {
    if (lang === "zh") {
      return "当前没有稳定拿到新闻结果。\n可以稍后再试，或接入更强的新闻源。";
    }
    return "I could not get a stable news result right now.\nTrying again later or adding a stronger news source would help.";
  }

  if (lang === "zh") {
    const lines = [
      topic ? `${topic.toUpperCase()} 相关新闻：` : "最新区块链新闻：",
      ...items.slice(0, 3).map((x, i) => `${i + 1}. ${x.title}`),
    ];
    return lines.join("\n");
  }

  const header = topic
    ? `${topic.toUpperCase()} news:`
    : "Latest crypto news:";

  return [
    header,
    ...items.slice(0, 3).map((x, i) => `${i + 1}. ${x.title}`),
  ].join("\n");
}

export const newsWorkflowDef: WorkflowDefinition<NewsCtx> = {
  name: "news_workflow",
  maxAttempts: 1,
  steps: [
    async (ctx: NewsCtx) => {
      const lang = ctx.input?.lang ?? "en";
      const message = norm(ctx.input?.message);
      const topic = extractTopic(message);

      let items = await fetchCryptoPanicNews(topic);
      if (!items.length) {
        items = await fetchRssNews();
        items = filterNewsByTopic(items, topic);
      }

      ctx.data = {
        reply: formatNewsReply(items, lang, topic),
        suggestedAction: "/news",
      };

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "news_agent",
  def: newsWorkflowDef,
});