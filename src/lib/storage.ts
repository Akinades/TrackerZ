import type { Transaction } from "@/types/transactions";

const KEY = "trackerz.transactions.v1";
const PRICES_KEY = "trackerz.prices.v1";

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Transaction[];
  } catch {
    return [];
  }
}

export function saveTransactions(txs: Transaction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(txs));
}

export type PriceMap = Record<string, number>;

export function loadPrices(): PriceMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PRICES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as PriceMap;
  } catch {
    return {};
  }
}

export function savePrices(prices: PriceMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRICES_KEY, JSON.stringify(prices));
}

export function clearAllData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(PRICES_KEY);
}

