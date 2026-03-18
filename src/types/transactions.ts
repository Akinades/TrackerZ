import type { AppCurrency } from "@/store/useCurrency";

export type AssetType = "gold" | "stock" | "forex" | "crypto" | "other";
export type TransactionSide = "buy" | "sell";

export type Transaction = {
  id: string;
  assetName: string;
  assetLabel?: string;
  assetType: AssetType;
  side: TransactionSide;
  price: number; // per unit
  amount: number; // units
  fee: number; // in THB (or account currency)
  tax?: number; // in transaction currency (optional)
  currency?: AppCurrency; // currency of price/fee in this transaction
  fxRateAtTrade?: number; // USDTHB at trade time (optional, for consistent history)
  createdAt: string; // ISO
};

