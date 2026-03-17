import type { PriceMap } from "@/lib/storage";
import type { Transaction } from "@/types/transactions";

function isoDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function demoTransactions(): Transaction[] {
  // Intentionally includes multiple buys/sells across types for meaningful charts.
  return [
    {
      id: "demo-1",
      assetName: "XAUUSD",
      assetType: "gold",
      side: "buy",
      price: 2050,
      amount: 1.5,
      fee: 15,
      createdAt: isoDaysAgo(14)
    },
    {
      id: "demo-2",
      assetName: "XAUUSD",
      assetType: "gold",
      side: "buy",
      price: 2120,
      amount: 0.7,
      fee: 10,
      createdAt: isoDaysAgo(10)
    },
    {
      id: "demo-3",
      assetName: "XAUUSD",
      assetType: "gold",
      side: "sell",
      price: 2180,
      amount: 0.6,
      fee: 10,
      createdAt: isoDaysAgo(7)
    },
    {
      id: "demo-4",
      assetName: "AAPL",
      assetType: "stock",
      side: "buy",
      price: 180,
      amount: 10,
      fee: 3,
      createdAt: isoDaysAgo(20)
    },
    {
      id: "demo-5",
      assetName: "AAPL",
      assetType: "stock",
      side: "sell",
      price: 195,
      amount: 4,
      fee: 3,
      createdAt: isoDaysAgo(9)
    },
    {
      id: "demo-6",
      assetName: "BTC",
      assetType: "crypto",
      side: "buy",
      price: 64000,
      amount: 0.06,
      fee: 8,
      createdAt: isoDaysAgo(12)
    },
    {
      id: "demo-7",
      assetName: "EURUSD",
      assetType: "forex",
      side: "buy",
      price: 1.08,
      amount: 1500,
      fee: 2,
      createdAt: isoDaysAgo(8)
    }
  ];
}

export function demoPrices(): PriceMap {
  return {
    XAUUSD: 2240,
    AAPL: 202,
    BTC: 69000,
    EURUSD: 1.09
  };
}

