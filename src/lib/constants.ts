import type { AssetType } from "@/types/transactions";

export const ASSET_TYPES: Array<{ value: AssetType; label: string }> = [
  { value: "gold", label: "ทอง" },
  { value: "stock", label: "หุ้น" },
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "cash", label: "สกุลเงิน" },
  { value: "other", label: "อื่นๆ" }
];

