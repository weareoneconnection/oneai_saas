// src/core/agents/price_agent.ts
import { fetchCoinGeckoPrice } from "../services/priceService.js";

function extractSymbol(message: string): string | null {
  const text = message.toLowerCase();

  const candidates = ["btc", "eth", "sol", "bnb", "xrp"];
  for (const c of candidates) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) return c;
  }

  return null;
}

export async function runPriceAgent(input: {
  message: string;
  lang?: "en" | "zh" | "mixed";
}) {
  const lang = input.lang ?? "en";
  const symbol = extractSymbol(input.message);

  if (!symbol) {
    return {
      reply:
        lang === "zh"
          ? "我还没识别出具体币种。\n可以直接发 BTC、ETH、SOL 这类符号。"
          : "I could not identify the token symbol.\nTry a direct symbol like BTC, ETH, or SOL.",
      suggestedAction: "/price",
    };
  }

  try {
    const result = await fetchCoinGeckoPrice(symbol, "usd");

    if (result.price == null) {
      return {
        reply:
          lang === "zh"
            ? `${result.symbol} 价格暂时没有查到。\n可以补充更明确的币种或映射规则。`
            : `${result.symbol} price is not available yet.\nA clearer symbol mapping would help.`,
        suggestedAction: "/price",
      };
    }

    const change =
      typeof result.change24h === "number"
        ? `${result.change24h >= 0 ? "+" : ""}${result.change24h.toFixed(2)}%`
        : "N/A";

    if (lang === "zh") {
      return {
        reply:
          `${result.symbol} 价格：$${result.price}\n` +
          `24h 变化：${change}\n` +
          `来源：CoinGecko`,
        suggestedAction: "/price",
      };
    }

    return {
      reply:
        `${result.symbol} price: $${result.price}\n` +
        `24h change: ${change}\n` +
        `Source: CoinGecko`,
      suggestedAction: "/price",
    };
  } catch {
    return {
      reply:
        lang === "zh"
          ? "当前价格源暂时不可用。\n稍后再试会更稳。"
          : "The price source is temporarily unavailable.\nTrying again later should be more reliable.",
      suggestedAction: "/price",
    };
  }
}