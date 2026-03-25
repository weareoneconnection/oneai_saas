// src/core/services/priceService.ts
export type PriceResult = {
  symbol: string;
  vsCurrency: string;
  price: number | null;
  marketCap?: number | null;
  change24h?: number | null;
  lastUpdatedAt?: number | null;
  source: "coingecko";
};

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  bnb: "binancecoin",
  xrp: "ripple",
};

function normalizeSymbol(symbol: string): string {
  return String(symbol || "").trim().toLowerCase();
}

export async function fetchCoinGeckoPrice(
  symbol: string,
  vsCurrency = "usd"
): Promise<PriceResult> {
  const normalized = normalizeSymbol(symbol);
  const id = SYMBOL_TO_COINGECKO_ID[normalized];

  if (!id) {
    return {
      symbol: normalized,
      vsCurrency,
      price: null,
      source: "coingecko",
    };
  }

  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    `?ids=${encodeURIComponent(id)}` +
    `&vs_currencies=${encodeURIComponent(vsCurrency)}` +
    "&include_market_cap=true" +
    "&include_24hr_change=true" +
    "&include_last_updated_at=true";

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status}`);
  }

  const json = (await res.json()) as Record<
    string,
    {
      [k: string]: number | undefined;
    }
  >;

  const row = json[id] || {};

  return {
    symbol: normalized.toUpperCase(),
    vsCurrency: vsCurrency.toUpperCase(),
    price: row[vsCurrency] ?? null,
    marketCap: row[`${vsCurrency}_market_cap`] ?? null,
    change24h: row[`${vsCurrency}_24h_change`] ?? null,
    lastUpdatedAt: row["last_updated_at"] ?? null,
    source: "coingecko",
  };
}