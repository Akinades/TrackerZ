import { NextResponse } from "next/server";

type QuoteResponse = {
  prices: Record<string, number>;
  partial: boolean;
  missing: string[];
};

function parseSymbols(url: string) {
  const u = new URL(url);
  const raw = (u.searchParams.get("symbols") ?? "").trim();
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toUpperCase());
  return Array.from(new Set(list));
}

function isCrypto(sym: string) {
  return ["BTC", "ETH", "BNB", "SOL", "ADA", "XRP", "DOGE"].includes(sym);
}

function isFx(sym: string) {
  return /^[A-Z]{6}$/.test(sym) && !isCrypto(sym) && sym !== "XAUUSD" && sym !== "XAGUSD";
}

function isMetal(sym: string) {
  return sym === "XAUUSD" || sym === "XAGUSD";
}

function isStock(sym: string) {
  return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(sym) && !isCrypto(sym) && !isFx(sym) && !isMetal(sym);
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin"
};

async function fetchCoinGecko(symbols: string[]) {
  const ids = symbols.map((s) => COINGECKO_IDS[s]).filter(Boolean);
  if (ids.length === 0) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    ids.join(",")
  )}&vs_currencies=usd`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return {};
  const json = (await res.json()) as Record<string, { usd?: number }>;
  const out: Record<string, number> = {};
  for (const sym of symbols) {
    const id = COINGECKO_IDS[sym];
    const usd = id ? json?.[id]?.usd : undefined;
    if (typeof usd === "number" && Number.isFinite(usd) && usd > 0) out[sym] = usd;
  }
  return out;
}

async function fetchStooqLatest(symbols: string[]) {
  if (symbols.length === 0) return {};

  // Stooq "q/l" CSV endpoint works reliably per-symbol.
  // Example: https://stooq.com/q/l/?s=aapl.us&f=sd2t2c&h&e=csv
  // We'll read "Close" as latest close.
  const out: Record<string, number> = {};

  await Promise.all(
    symbols.map(async (sym) => {
      const stooqSymbol = isStock(sym) ? `${sym}.US` : sym;
      const url = `https://stooq.com/q/l/?s=${encodeURIComponent(
        stooqSymbol.toLowerCase()
      )}&f=sd2t2c&h&e=csv`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return;

      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idxClose = header.indexOf("close");
      if (idxClose === -1) return;

      const cols = lines[1].split(",");
      const closeRaw = (cols[idxClose] ?? "").trim();
      const close = Number(closeRaw);
      if (!Number.isFinite(close) || close <= 0) return;

      out[sym] = close;
    })
  );

  return out;
}

export async function GET(req: Request) {
  const symbols = parseSymbols(req.url);
  if (symbols.length === 0) {
    return NextResponse.json({ prices: {}, partial: false, missing: [] } satisfies QuoteResponse);
  }

  const crypto = symbols.filter(isCrypto);
  const others = symbols.filter((s) => !isCrypto(s));

  const [cg, stooq] = await Promise.all([fetchCoinGecko(crypto), fetchStooqLatest(others)]);
  const prices = { ...stooq, ...cg };

  const missing = symbols.filter((s) => typeof prices[s] !== "number");
  const partial = missing.length > 0;

  return NextResponse.json({ prices, partial, missing } satisfies QuoteResponse);
}

