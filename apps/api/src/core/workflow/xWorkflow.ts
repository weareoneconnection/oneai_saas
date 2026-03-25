import { registerWorkflow } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

type XInput = {
  message?: string;
  lang?: "en" | "zh" | "mixed";
};

type XData = {
  reply: string;
  suggestedAction: "/x";
};

type XCtx = WorkflowContext<XInput, XData> & {
  templateVersion: number;
};

type XUser = {
  username: string;
  name?: string;
  description?: string;
  followers?: number | null;
};

type XPost = {
  text: string;
};

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function lower(s: unknown) {
  return norm(s).toLowerCase();
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractUsername(message: string): string {
  const raw = norm(message);

  const byUrl =
    raw.match(/x\.com\/([A-Za-z0-9_]+)/i)?.[1] ||
    raw.match(/twitter\.com\/([A-Za-z0-9_]+)/i)?.[1];
  if (byUrl) return byUrl;

  const byHandle = raw.match(/@([A-Za-z0-9_]{1,15})/)?.[1];
  if (byHandle) return byHandle;

  return "";
}

async function fetchXWithApi(username: string): Promise<{
  user: XUser | null;
  posts: XPost[];
}> {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token || !username) return { user: null, posts: [] };

  const userRes = await fetch(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}?user.fields=description,public_metrics,name`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!userRes.ok) return { user: null, posts: [] };

  const userJson = (await userRes.json()) as {
    data?: {
      id?: string;
      username?: string;
      name?: string;
      description?: string;
      public_metrics?: { followers_count?: number };
    };
  };

  const userId = userJson.data?.id;
  if (!userId) {
    return { user: null, posts: [] };
  }

  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${encodeURIComponent(userId)}/tweets?max_results=5&tweet.fields=text`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let posts: XPost[] = [];
  if (tweetsRes.ok) {
    const tweetsJson = (await tweetsRes.json()) as {
      data?: Array<{ text?: string }>;
    };
    posts = (tweetsJson.data ?? [])
      .map((x) => ({ text: norm(x.text) }))
      .filter((x) => x.text);
  }

  return {
    user: {
      username: userJson.data?.username || username,
      name: userJson.data?.name,
      description: userJson.data?.description,
      followers: userJson.data?.public_metrics?.followers_count ?? null,
    },
    posts,
  };
}

async function fetchXPublicFallback(username: string): Promise<{
  user: XUser | null;
  posts: XPost[];
}> {
  if (!username) return { user: null, posts: [] };

  const urls = [
    `https://x.com/${username}`,
    `https://twitter.com/${username}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36",
        },
      });
      if (!res.ok) continue;

      const html = await res.text();

      const title =
        html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      const desc =
        html.match(
          /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i
        )?.[1] ??
        html.match(
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i
        )?.[1] ??
        "";

      const user: XUser = {
        username,
        name: stripTags(title).replace(/\s*\/\s*X.*$/i, "").trim(),
        description: stripTags(desc),
      };

      return { user, posts: [] };
    } catch {
      // continue
    }
  }

  return { user: null, posts: [] };
}

function summarizePosts(posts: XPost[]) {
  const joined = posts.map((x) => x.text).join(" ");
  const text = lower(joined);

  const themes: string[] = [];
  if (/builder|build|ship|launch|tool|product/.test(text)) themes.push("builder updates");
  if (/community|mission|collaboration/.test(text)) themes.push("community coordination");
  if (/ai|agent|automation/.test(text)) themes.push("AI / automation");
  if (/market|price|token|btc|eth|sol/.test(text)) themes.push("market commentary");

  return themes.length ? themes.join(", ") : "general ecosystem updates";
}

function formatXReply(
  user: XUser | null,
  posts: XPost[],
  lang: "en" | "zh" | "mixed",
  username: string
) {
  if (!user) {
    if (lang === "zh") {
      return "当前没能稳定读取这个 X 账号。\n如果接入官方 X API，会更可靠。";
    }
    return "I could not read that X account reliably right now.\nAn official X API connection would make this stronger.";
  }

  if (lang === "zh") {
    const lines = [
      `账号：@${user.username || username}`,
      user.description
        ? `简介：${user.description.slice(0, 90)}`
        : "简介：当前未稳定拿到。",
      posts.length
        ? `近期内容偏向：${summarizePosts(posts)}`
        : "近期内容：当前只拿到基础账号信息。",
    ];
    return lines.join("\n");
  }

  const lines = [
    `Account: @${user.username || username}`,
    user.description
      ? `Profile: ${user.description.slice(0, 100)}`
      : "Profile: basic account info only.",
    posts.length
      ? `Recent focus: ${summarizePosts(posts)}`
      : "Recent focus: public profile only right now.",
  ];

  return lines.join("\n");
}

export const xWorkflowDef: WorkflowDefinition<XCtx> = {
  name: "x_workflow",
  maxAttempts: 1,
  steps: [
    async (ctx: XCtx) => {
      const lang = ctx.input?.lang ?? "en";
      const message = norm(ctx.input?.message);
      const username = extractUsername(message);

      if (!username) {
        ctx.data = {
          reply:
            lang === "zh"
              ? "我还没识别出 X 用户名。\n可以直接发 @username 或 x.com/username。"
              : "I could not identify the X username.\nTry @username or x.com/username.",
          suggestedAction: "/x",
        };
        return { ok: true };
      }

      let result = await fetchXWithApi(username);
      if (!result.user) {
        result = await fetchXPublicFallback(username);
      }

      ctx.data = {
        reply: formatXReply(result.user, result.posts, lang, username),
        suggestedAction: "/x",
      };

      return { ok: true };
    },
  ],
};

registerWorkflow({
  task: "x_agent",
  def: xWorkflowDef,
});