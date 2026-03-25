// src/core/workflow/priceWorkflow.ts
import { registerWorkflow } from "./registry.js";
import type { WorkflowContext } from "./types.js";
import type { WorkflowDefinition } from "./engine.js";

type PriceInput = {
  symbol?: string;
  message?: string;
  lang?: "en" | "zh" | "mixed";
};

type PriceData = {
  reply: string;
  suggestedAction: "/price";
};

type PriceCtx = WorkflowContext<PriceInput, PriceData> & {
  templateVersion: number;
};

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function lower(s: unknown) {
  return norm(s).toLowerCase();
}

function extractSymbol(input: PriceInput): string {
  const direct = lower(input.symbol);
  if (direct) return direct;

  const msg = lower(input.message);

  const candidates = ["btc", "eth", "sol", "bnb", "xrp"];
  for (const c of candidates) {
    if (new RegExp(`\\b${c}\\b`, "i").test(msg)) return c;
  }

  return "btc";
}

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  bnb: "binancecoin",
  xrp: "ripple",
};

export const priceWorkflowDef: WorkflowDefinition<PriceCtx> = {
  name: "price_workflow",
  maxAttempts: 1,
  steps: [
    async (ctx: PriceCtx) => {
      const symbol = extractSymbol(ctx.input);
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
      const lang = ctx.input?.lang ?? "en";

      if (!coinId) {
        ctx.data = {
          reply:
            lang === "zh"
              ? `暂时不支持 ${symbol.toUpperCase()} 的价格查询。\n可以先补充 symbol 映射。`
              : `Price lookup for ${symbol.toUpperCase()} is not supported yet.\nA symbol mapping can be added.`,
          suggestedAction: "/price",
        };
        return { ok: true };
      }

      try {
        const url =
          "https://api.coingecko.com/api/v3/simple/price" +
          `?ids=${encodeURIComponent(coinId)}` +
          "&vs_currencies=usd" +
          "&include_24hr_change=true";

        const res = await fetch(url, {
          headers: { accept: "application/json" },
        });

        if (!res.ok) {
          ctx.data = {
            reply:
              lang === "zh"
                ? "价格源暂时不可用。\n稍后再试会更稳。"
                : "The price source is temporarily unavailable.\nTrying again later should be more reliable.",
            suggestedAction: "/price",
          };
          return { ok: true };
        }

        const json = (await res.json()) as Record<
          string,
          { usd?: number; usd_24h_change?: number }
        >;

        const row = json[coinId] || {};
        const price = row.usd;
        const change = row.usd_24h_change;

        if (typeof price !== "number") {
          ctx.data = {
            reply:
              lang === "zh"
                ? `${symbol.toUpperCase()} 的价格暂时没有查到。\n可以稍后再试。`
                : `${symbol.toUpperCase()} price is not available right now.\nTrying again later may help.`,
            suggestedAction: "/price",
          };
          return { ok: true };
        }

        const changeText =
          typeof change === "number"
            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
            : "N/A";

        ctx.data = {
          reply:
            lang === "zh"
              ? `${symbol.toUpperCase()} 价格：$${price}\n24h 变化：${changeText}\n来源：CoinGecko`
              : `${symbol.toUpperCase()} price: $${price}\n24h change: ${changeText}\nSource: CoinGecko`,
          suggestedAction: "/price",
        };

        return { ok: true };
      } catch {
        ctx.data = {
          reply:
            lang === "zh"
              ? "价格查询暂时失败。\n稍后再试会更稳。"
              : "Price lookup failed for now.\nTrying again later should be more reliable.",
          suggestedAction: "/price",
        };
        return { ok: true };
      }
    },
  ],
};

registerWorkflow({
  task: "price_agent",
  def: priceWorkflowDef,
});