import type { AssetType, TransactionSide } from "@/types/transactions";

export type TransactionFormState = {
  assetName: string;
  assetLabel: string;
  assetType: AssetType;
  side: TransactionSide;
  price: string;
  amount: string;
  fee: string;
  tax: string;
  tradeDate: string;
  tradeTime: string;
};

export type TransactionFormErrors = Partial<
  Record<keyof Pick<TransactionFormState, "assetName" | "price" | "amount" | "tradeDate">, string>
>;
