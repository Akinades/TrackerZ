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

  { symbol: "BTC", label: "Bitcoin", type: "crypto" },
  { symbol: "ETH", label: "Ethereum", type: "crypto" },
  { symbol: "BNB", label: "BNB", type: "crypto" },
  { symbol: "SOL", label: "Solana", type: "crypto" },

  { symbol: "EURUSD", label: "Euro / U.S. Dollar", type: "forex" },
  { symbol: "USDJPY", label: "U.S. Dollar / Japanese Yen", type: "forex" },
  { symbol: "GBPUSD", label: "British Pound / U.S. Dollar", type: "forex" },

  { symbol: "XAUUSD", label: "Gold / U.S. Dollar", type: "gold" },
  { symbol: "XAGUSD", label: "Silver / U.S. Dollar", type: "gold" }
];

export function findAssetCatalogItem(queryRaw: string) {
  const q = queryRaw.trim().toUpperCase();
  if (!q) return null;
  return ASSETS_CATALOG.find((x) => x.symbol === q) ?? null;
}

