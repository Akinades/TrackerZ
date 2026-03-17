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
  createdAt: string; // ISO
};

