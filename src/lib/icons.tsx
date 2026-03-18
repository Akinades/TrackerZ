"use client";

import type { AssetType } from "@/types/transactions";
import {
  Banknote,
  Building2,
  Coins,
  Gem,
  Globe,
  LineChart,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";

export type IconType = React.ComponentType<{ className?: string }>;

export function metricIcon(name: "invested" | "value" | "net" | "roi"): IconType {
  switch (name) {
    case "invested":
      return Wallet;
    case "value":
      return LineChart;
    case "net":
      return Banknote;
    case "roi":
      return Percent;
  }
}

export function assetTypeIcon(type: AssetType): IconType {
  switch (type) {
    case "gold":
      return Gem;
    case "stock":
      return Building2;
    case "forex":
      return Globe;
    case "crypto":
      return Coins;
    default:
      return LineChart;
  }
}

export function pnlIcon(pnl: number): IconType {
  if (pnl > 0) return TrendingUp;
  if (pnl < 0) return TrendingDown;
  return LineChart;
}

