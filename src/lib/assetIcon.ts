import type { AssetType } from "@/types/transactions";
import { STOCK_ICON_FILES } from "@/lib/stockIcons";

export function getForexFlags(symbolRaw: string) {
  const s = symbolRaw.trim().toUpperCase();
  // Expect pairs like EURUSD, USDJPY, GBPUSD
  if (!/^[A-Z]{6}$/.test(s)) return null;
  const base = s.slice(0, 3);
  const quote = s.slice(3, 6);

  const flagOf = (ccy: string) => {
    switch (ccy) {
      case "THB":
        return "🇹🇭";
      case "USD":
        return "🇺🇸";
      case "EUR":
        return "🇪🇺";
      case "JPY":
        return "🇯🇵";
      case "GBP":
        return "🇬🇧";
      case "CNY":
        return "🇨🇳";
      case "AUD":
        return "🇦🇺";
      case "CAD":
        return "🇨🇦";
      case "CHF":
        return "🇨🇭";
      case "NZD":
        return "🇳🇿";
      default:
        return null;
    }
  };

  const f1 = flagOf(base);
  const f2 = flagOf(quote);
  if (!f1 || !f2) return null;

  // Convention for this app: if USD is present, show the non-USD currency
  // EURUSD -> EUR, USDJPY -> JPY, GBPUSD -> GBP
  let primary = base;
  let flag = f1;
  if (base === "USD" && quote !== "USD") {
    primary = quote;
    flag = f2;
  } else if (quote === "USD" && base !== "USD") {
    primary = base;
    flag = f1;
  }

  return { base, quote, f1, f2, primary, flag };
}

export function getCurrencyFlagIconSrc(ccyRaw: string): string | null {
  const ccy = ccyRaw.trim().toUpperCase();
  const supported = new Set(["USD", "EUR", "JPY", "GBP", "THB", "CNY"]);
  if (!supported.has(ccy)) return null;
  return `/asset-icons/flags/${ccy.toLowerCase()}.svg`;
}

export function getLocaleFlagIconSrc(localeRaw: string): string | null {
  const locale = localeRaw.trim().toLowerCase();
  if (locale === "th") return getCurrencyFlagIconSrc("THB");
  if (locale === "en") return getCurrencyFlagIconSrc("USD");
  return null;
}

export function getAssetIconSrc(symbolRaw: string, type: AssetType): string | null {
  const symbol = symbolRaw.trim().toLowerCase();
  if (!symbol) return null;

  // Symbol-specific stock logos
  if (type === "stock") {
    const ext = STOCK_ICON_FILES[symbol];
    if (ext) return `/asset-icons/stocks/${symbol}.${ext}`;
  }

  // Type icons (for a consistent "specific" look)
  if (type === "gold") return "/asset-icons/types/gold.svg";
  if (type === "stock") return "/asset-icons/types/stock.svg";

  // Crypto: use bundled svg icons in public/
  if (type === "crypto") {
    const supported = new Set(["btc", "eth", "bnb", "sol", "usdt", "bch"]);
    if (supported.has(symbol)) return `/asset-icons/crypto/${symbol}.svg`;
  }

  return null;
}

