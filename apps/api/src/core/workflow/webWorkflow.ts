import { registerWorkflow } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";
console.log("✅ webWorkflow loaded");

type WebInput = {
  message?: string;
  lang?: "en" | "zh" | "mixed";
};

type WebData = {
  reply: string;
  suggestedAction: "/web";
};

type WebCtx = WorkflowContext<WebInput, WebData> & {
  templateVersion: number;
};

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUrl(message: string): string {
  return message.match(/https?:\/\/[^\s]+/i)?.[0] ?? "";
}

function extractTitle(html: string) {
  return (
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i)?.[1]?.trim() ||
    ""
  );
}

function extractDescription(html: string) {
  return (
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1]?.trim() ||
    ""
  );
}

function extractMainText(html: string) {
  const clean = stripTags(html);
  if (clean.length <= 400) return clean;
  return clean.slice(0, 600);
}

function formatWebReply(
  title: string,
  desc: string,
  body: string,
  lang: "en" | "zh" | "mixed"
) {
  if (lang === "zh") {
    const lines = [
      title ? `标题：${title.slice(0, 90)}` : "标题：未稳定读取到。",
      desc
        ? `摘要：${desc.slice(0, 110)}`
        : body
        ? `摘要：${body.slice(0, 110)}`
        : "摘要：当前没有稳定拿到正文。",
      "如果要更准确摘要，可以继续做正文抽取。",
    ];
    return lines.join("\n");
  }

  const lines = [
    title ? `Title: ${title.slice(0, 100)}` : "Title: not reliably available.",
    desc
      ? `Summary: ${desc.slice(0, 120)}`
      : body
      ? `Summary: ${body.slice(0, 120)}`
      : "Summary: main content is not reliably available yet.",
    "A deeper content extractor would make this more accurate.",
  ];

  return lines.join("\n");
}

export const webWorkflowDef: WorkflowDefinition<WebCtx> = {
  name: "web_workflow",
  maxAttempts: 1,
  steps: [
    async (ctx: WebCtx) => {
      console.log("✅ web_agent step running", ctx.input);
      const lang = ctx.input?.lang ?? "en";
      const message = norm(ctx.input?.message);
      const url = extractUrl(message);
      
      if (!url) {
        ctx.data = {
          reply:
            lang === "zh"
              ? "我还没识别出网页链接。\n可以直接发完整 URL。"
              : "I could not identify the URL.\nTry sending a full link.",
          suggestedAction: "/web",
        };
        return { ok: true };
      }

      try {
        const res = await fetch(url, {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36",
            accept: "text/html,application/xhtml+xml",
          },
        });

        if (!res.ok) {
          ctx.data = {
            reply:
              lang === "zh"
                ? "这个网页当前没有稳定读取成功。\n稍后再试会更稳。"
                : "That page could not be read reliably right now.\nTrying again later may help.",
            suggestedAction: "/web",
          };
          return { ok: true };
        }

        const html = await res.text();
        const title = extractTitle(html);
        const desc = extractDescription(html);
        const body = extractMainText(html);

        ctx.data = {
        reply: "[WEB_AGENT_FAIL]\nWeb page fetch failed for now.\nTrying again later should be more reliable.",
        suggestedAction: "/web",
        };

        return { ok: true };
      } catch {
        ctx.data = {
          reply:
            lang === "zh"
              ? "网页读取暂时失败。\n稍后再试会更稳。"
              : "Web page fetch failed for now.\nTrying again later should be more reliable.",
          suggestedAction: "/web",
        };
        return { ok: true };
      }
    },
  ],
};

registerWorkflow({
  task: "web_agent",
  def: webWorkflowDef,
});