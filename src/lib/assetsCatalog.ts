import type { AssetType } from "@/types/transactions";

export type AssetCatalogItem = {
  symbol: string;
  label: string;
  type: AssetType;
};

export const ASSETS_CATALOG: AssetCatalogItem[] = [
  { symbol: "AAPL", label: "Apple Inc.", type: "stock" },
  { symbol: "MSFT", label: "Microsoft Corp.", type: "stock" },
  { symbol: "NVDA", label: "NVIDIA Corp.", type: "stock" },
  { symbol: "TSLA", label: "Tesla, Inc.", type: "stock" },
  { symbol: "AMZN", label: "Amazon.com, Inc.", type: "stock" },
  { symbol: "GOOGL", label: "Alphabet Inc. (Class A)", type: "stock" },
  { symbol: "META", label: "Meta Platforms, Inc.", type: "stock" },
  { symbol: "AMD", label: "Advanced Micro Devices", type: "stock" },
  { symbol: "INTC", label: "Intel Corporation", type: "stock" },
  { symbol: "NFLX", label: "Netflix, Inc.", type: "stock" },
  { symbol: "ORCL", label: "Oracle Corporation", type: "stock" },
  { symbol: "IBM", label: "IBM", type: "stock" },
  { symbol: "JPM", label: "JPMorgan Chase", type: "stock" },
  { symbol: "BAC", label: "Bank of America", type: "stock" },
  { symbol: "DIS", label: "The Walt Disney Company", type: "stock" },
  { symbol: "V", label: "Visa Inc.", type: "stock" },
  { symbol: "MA", label: "Mastercard Incorporated", type: "stock" },
  { symbol: "KO", label: "Coca-Cola", type: "stock" },
  { symbol: "PEP", label: "PepsiCo", type: "stock" },
  { symbol: "CSCO", label: "Cisco Systems", type: "stock" },
  { symbol: "PYPL", label: "PayPal", type: "stock" },
  { symbol: "ADBE", label: "Adobe Inc.", type: "stock" },
  { symbol: "ABNB", label: "Airbnb, Inc.", type: "stock" },
  // Thai market (Bangkok)
  { symbol: "PTT.BK", label: "PTT Public Company Limited", type: "stock" },
  { symbol: "AOT.BK", label: "Airports of Thailand Public Company Limited", type: "stock" },
  { symbol: "CPALL.BK", label: "CP ALL Public Company Limited", type: "stock" },
  { symbol: "ADVANC.BK", label: "Advanced Info Service Public Company Limited", type: "stock" },
  { symbol: "KBANK.BK", label: "Kasikornbank Public Company Limited", type: "stock" },
  { symbol: "BBL.BK", label: "Bangkok Bank Public Company Limited", type: "stock" },

  { symbol: "BTC", label: "Bitcoin", type: "crypto" },
  { symbol: "ETH", label: "Ethereum", type: "crypto" },
  { symbol: "BNB", label: "BNB", type: "crypto" },
  { symbol: "SOL", label: "Solana", type: "crypto" },
  { symbol: "ADA", label: "Cardano", type: "crypto" },
  { symbol: "XRP", label: "Ripple", type: "crypto" },
  { symbol: "DOGE", label: "Dogecoin", type: "crypto" },

  { symbol: "EURUSD", label: "Euro / U.S. Dollar", type: "forex" },
  { symbol: "USDJPY", label: "U.S. Dollar / Japanese Yen", type: "forex" },
  { symbol: "GBPUSD", label: "British Pound / U.S. Dollar", type: "forex" },
  { symbol: "USDTHB", label: "U.S. Dollar / Thai Baht", type: "forex" },
  { symbol: "THBUSD", label: "Thai Baht / U.S. Dollar", type: "forex" },
  { symbol: "EURTHB", label: "Euro / Thai Baht", type: "forex" },
  { symbol: "THBEUR", label: "Thai Baht / Euro", type: "forex" },
  { symbol: "GBPTHB", label: "British Pound / Thai Baht", type: "forex" },
  { symbol: "THBGBP", label: "Thai Baht / British Pound", type: "forex" },
  { symbol: "EURJPY", label: "Euro / Japanese Yen", type: "forex" },
  { symbol: "JPYUSD", label: "Japanese Yen / U.S. Dollar", type: "forex" },
  { symbol: "GBPJPY", label: "British Pound / Japanese Yen", type: "forex" },
  { symbol: "USDGBP", label: "U.S. Dollar / British Pound", type: "forex" },

  // China (Hong Kong / HKEX)
  // Note: Stooq supports these as 700.HK, 9988.HK, etc.
  { symbol: "700.HK", label: "Tencent Holdings Limited", type: "stock" },
  { symbol: "9988.HK", label: "Alibaba Group Holding Limited", type: "stock" },
  { symbol: "9618.HK", label: "JD.com Inc.", type: "stock" },
  { symbol: "1299.HK", label: "AIA Group Limited", type: "stock" },
  { symbol: "3690.HK", label: "Meituan", type: "stock" },
  { symbol: "1024.HK", label: "Xiaomi Corp. (HK:1024)", type: "stock" },

  { symbol: "XAUUSD", label: "Gold / U.S. Dollar", type: "gold" },
  { symbol: "XAGUSD", label: "Silver / U.S. Dollar", type: "gold" }
];

export function findAssetCatalogItem(queryRaw: string) {
  const q = queryRaw.trim().toUpperCase();
  if (!q) return null;
  return ASSETS_CATALOG.find((x) => x.symbol === q) ?? null;
}

