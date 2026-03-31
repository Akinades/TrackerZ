import { NextResponse } from "next/server";

type QuoteResponse = {
  prices: Record<string, number>;
  /** Quote currency (only when known/supported in-app) */
  currencies?: Record<string, "THB" | "USD">;
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
  return (
    /^[A-Z]{6}$/.test(sym) &&
    !isCrypto(sym) &&
    sym !== "XAUUSD" &&
    sym !== "XAGUSD"
  );
}

function isMetal(sym: string) {
  return sym === "XAUUSD" || sym === "XAGUSD";
}

function isUsStock(sym: string) {
  return (
    /^[A-Z][A-Z0-9.\-]{0,9}$/.test(sym) &&
    !isCrypto(sym) &&
    !isFx(sym) &&
    !isMetal(sym)
  );
}

// Stooq supports "exchange suffix" tickers like 700.HK, 9988.HK, 1299.HK, PTT.BK, etc.
function isExchangeStock(sym: string) {
  return (
    /^[0-9]{1,6}\.[A-Z]{2}$/.test(sym) &&
    !isCrypto(sym) &&
    !isFx(sym) &&
    !isMetal(sym)
  );
}

function isStock(sym: string) {
  return isUsStock(sym) || isExchangeStock(sym);
}

function inferQuoteCurrency(symRaw: string): "THB" | "USD" | undefined {
  const sym = symRaw.trim().toUpperCase();
  if (isCrypto(sym)) return "USD";
  if (isMetal(sym)) return "USD";
  if (isUsStock(sym)) return "USD";
  if (isExchangeStock(sym) && sym.endsWith(".BK")) return "THB";
  if (isFx(sym) && /^[A-Z]{6}$/.test(sym)) {
    const quote = sym.slice(3, 6);
    if (quote === "THB" || quote === "USD") return quote;
  }
  if (/^[A-Z]{3}$/.test(sym) && sym === "USD") return "USD";
  if (/^[A-Z]{3}$/.test(sym) && sym === "THB") return "THB";
  return undefined;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
};

async function fetchCoinGecko(symbols: string[]) {
  const ids = symbols.map((s) => COINGECKO_IDS[s]).filter(Boolean);
  if (ids.length === 0) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    ids.join(","),
  )}&vs_currencies=usd`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return {};
  const json = (await res.json()) as Record<string, { usd?: number }>;
  const out: Record<string, number> = {};
  for (const sym of symbols) {
    const id = COINGECKO_IDS[sym];
    const usd = id ? json?.[id]?.usd : undefined;
    if (typeof usd === "number" && Number.isFinite(usd) && usd > 0)
      out[sym] = usd;
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
      // If it's a plain US ticker (e.g. AAPL) Stooq expects AAPL.US
      // If it's already an exchange-suffixed ticker (e.g. 700.HK, PTT.BK), keep it.
      const stooqSymbol = isUsStock(sym) ? `${sym}.US` : sym;
      const url = `https://stooq.com/q/l/?s=${encodeURIComponent(
        stooqSymbol.toLowerCase(),
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
    }),
  );

  return out;
}

async function fetchForexLatest(symbols: string[]) {
  if (symbols.length === 0) return {};

  // open.er-api latest endpoint gives rates relative to USD:
  // `base=USD` => rates[X] = how many X you get for 1 USD.
  // We need pair price consistent with symbol notation:
  // - EURUSD => USD per 1 EUR
  // - USDJPY => JPY per 1 USD
  const url = "https://open.er-api.com/v6/latest/USD";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return {};
  const json = (await res.json().catch(() => null)) as any;
  const rates: Record<string, number> = json?.rates ?? {};

  const out: Record<string, number> = {};

  for (const sym of symbols) {
    // Expect 6-char pair like EURUSD, USDJPY
    if (!/^[A-Z]{6}$/.test(sym)) continue;
    const base = sym.slice(0, 3);
    const quote = sym.slice(3, 6);

    let price: number;
    if (quote === "USD") {
      // EURUSD: want USD per 1 EUR
      // rBase = EUR per 1 USD => USD per 1 EUR = 1 / rBase
      const rBase = Number(rates[base]);
      if (!Number.isFinite(rBase) || rBase <= 0) continue;
      price = 1 / rBase;
    } else if (base === "USD") {
      // USDJPY: want JPY per 1 USD
      // rQuote = JPY per 1 USD
      const rQuote = Number(rates[quote]);
      if (!Number.isFinite(rQuote) || rQuote <= 0) continue;
      price = rQuote;
    } else {
      // Cross via USD:
      // 1 base = (1 / rBase) USD
      // then in quote: quote per base = rQuote * (1 / rBase) = rQuote / rBase
      const rBase = Number(rates[base]);
      const rQuote = Number(rates[quote]);
      if (!Number.isFinite(rBase) || rBase <= 0) continue;
      if (!Number.isFinite(rQuote) || rQuote <= 0) continue;
      price = rQuote / rBase;
    }

    if (!Number.isFinite(price) || price <= 0) continue;
    out[sym] = price;
  }

  return out;
}

export async function GET(req: Request) {
  const symbols = parseSymbols(req.url);
  if (symbols.length === 0) {
    return NextResponse.json({
      prices: {},
      partial: false,
      missing: [],
    } satisfies QuoteResponse);
  }

  const crypto = symbols.filter(isCrypto);
  const fx = symbols.filter(isFx);
  const metals = symbols.filter(isMetal);
  const stocks = symbols.filter(isStock);
  // Treat 3-letter symbols as "cash currencies" only when they are NOT stocks.
  // Example: "AMD" is both a US stock ticker and Armenian Dram currency code.
  // If we include it in cash, FX rates would override stock quotes.
  const cash = symbols.filter(
    (s) => /^[A-Z]{3}$/.test(s) && !isCrypto(s) && !isStock(s),
  );

  // Stooq supports both stocks and metals in our symbol conventions.
  const stooqSyms = [...stocks, ...metals];

  const [cg, stooq, fxPrices] = await Promise.all([
    fetchCoinGecko(crypto),
    fetchStooqLatest(stooqSyms),
    fetchForexLatest(fx),
  ]);

  // For cash currency holdings (e.g. EUR, JPY, CNY), we return USD per 1 unit.
  // open.er-api gives rates[X] = X per 1 USD => USD per 1 X = 1 / rates[X]
  const cashPrices: Record<string, number> = {};
  if (cash.length > 0) {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } }).catch(
      () => null,
    );
    const json = res && res.ok ? await res.json().catch(() => null) : null;
    const rates: Record<string, number> = (json as any)?.rates ?? {};
    for (const c of cash) {
      if (c === "USD") {
        cashPrices[c] = 1;
        continue;
      }
      const r = Number(rates[c]);
      if (Number.isFinite(r) && r > 0) cashPrices[c] = 1 / r;
    }
  }

  const prices = { ...stooq, ...fxPrices, ...cg, ...cashPrices };

  const missing = symbols.filter((s) => typeof prices[s] !== "number");
  const partial = missing.length > 0;

  const currencies = symbols.reduce((acc, s) => {
    const c = inferQuoteCurrency(s);
    if (c) acc[s] = c;
    return acc;
  }, {} as Record<string, "THB" | "USD">);

  return NextResponse.json({
    prices,
    currencies: Object.keys(currencies).length ? currencies : undefined,
    partial,
    missing,
  } satisfies QuoteResponse);
}
