"use client";

import * as React from "react";
import type { AppCurrency } from "@/store/useCurrency";
import { useTransactions } from "@/store/useTransactions";
import { useCurrency } from "@/store/useCurrency";
import { useFxRate } from "@/store/useFxRate";
import { usePreferences } from "@/store/usePreferences";
import { usePrices } from "@/store/usePrices";
import { ASSET_TYPES } from "@/lib/constants";
import { demoTransactions } from "@/lib/demoData";
import {
  computePositionsAvgCost,
  computePositionsFifo,
  currentValue,
  investedTotal,
  marketPriceUsd,
  positionUnrealizedPnlUsd,
  realizedPnlFromPositions,
  round2,
  totalFees,
  unrealizedPnl,
  type Position
} from "@/lib/calculations";

export type DashboardHoldingRow = {
  p: Position;
  costDisp: number;
  realizedDisp: number;
  unrealDisp: number | null;
  marketPxDisp: number | null;
  marketValueDisp: number | null;
  unrealPctOnCost: number | null;
};

export type DashboardAllocationRow = {
  type: string;
  pct: number;
  target: number;
};

export type DashboardPnlRow = {
  name: string;
  total: number;
  realized: number;
  unrealized: number;
};

export type DashboardPortfolioModel = {
  hydrated: boolean;
  currency: AppCurrency;
  txsLength: number;
  pieMode: "asset" | "type";
  setPieMode: React.Dispatch<React.SetStateAction<"asset" | "type">>;
  seedDemo: () => void;
  toDisplay: (nUsd: number) => number;
  invested: number;
  fees: number;
  realized: number;
  roiPct: number;
  openPositions: Position[];
  quotedOpenCount: number;
  unrealizedPctOnQuotedCost: number | null;
  investedDisp: number;
  openCostDisp: number;
  realizedDisp: number;
  feesDisp: number;
  marketValueOpenDisp: number;
  unrealizedTotalDisp: number;
  /** realized + unrealized (USD) */
  totalPnlUsd: number;
  totalPnlDisp: number;
  /** (totalPnl / invested) * 100 เมื่อ invested > 0 */
  totalReturnPct: number | null;
  allocationRows: DashboardAllocationRow[];
  allocationByAsset: { name: string; value: number }[];
  allocationByType: { name: string; value: number }[];
  allocation: { name: string; value: number }[];
  holdingRows: DashboardHoldingRow[];
  top5UnrealizedWinners: DashboardHoldingRow[];
  top5UnrealizedLosers: DashboardHoldingRow[];
  txBuyCount: number;
  txSellCount: number;
  pnlRows: DashboardPnlRow[];
  pricesStatus: "idle" | "loading" | "succeeded" | "failed";
  pricesError: string | null;
};

export function useDashboardPortfolio(): DashboardPortfolioModel {
  const { txs, hydrated, addMany } = useTransactions();
  const { currency } = useCurrency();
  const { usdThb } = useFxRate();
  const { prefs } = usePreferences();
  const {
    prices,
    refreshMarket,
    hydrated: pricesHydrated,
    status: pricesStatus,
    error: pricesErrorRaw
  } = usePrices();
  const pricesError = pricesErrorRaw ?? null;
  const [pieMode, setPieMode] = React.useState<"asset" | "type">("asset");

  const fx = React.useMemo(
    () => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36),
    [usdThb]
  );
  const toDisplay = React.useCallback(
    (nUsd: number) => {
      const v = Number.isFinite(nUsd) ? nUsd : 0;
      return currency === "THB" ? v * fx : v;
    },
    [currency, fx]
  );
  const txsUsd = React.useMemo(() => {
    return txs.map((t) => {
      const src = t.currency ?? "THB";
      if (src === "USD") return t;
      return {
        ...t,
        price: t.price / fx,
        fee: t.fee / fx,
        currency: "USD" as const
      };
    });
  }, [txs, fx]);

  const positions = React.useMemo(
    () => (prefs.costBasis === "fifo" ? computePositionsFifo(txsUsd) : computePositionsAvgCost(txsUsd)),
    [txsUsd, prefs.costBasis]
  );
  const invested = React.useMemo(() => investedTotal(txsUsd), [txsUsd]);
  const fees = React.useMemo(() => totalFees(txsUsd), [txsUsd]);
  const realized = React.useMemo(() => realizedPnlFromPositions(positions), [positions]);
  const openCostBasis = React.useMemo(
    () =>
      positions.reduce((sum, p) => {
        if (p.qty <= 0) return sum;
        return sum + p.costBasis;
      }, 0),
    [positions]
  );
  const roiPct = React.useMemo(() => (invested > 0 ? (realized / invested) * 100 : 0), [invested, realized]);

  const openPositions = React.useMemo(() => positions.filter((p) => p.qty > 0), [positions]);

  const quoteSymbols = React.useMemo(
    () => Array.from(new Set(openPositions.map((p) => p.assetName.trim().toUpperCase()).filter(Boolean))),
    [openPositions]
  );

  React.useEffect(() => {
    if (!hydrated || !pricesHydrated) return;
    if (quoteSymbols.length === 0) return;
    refreshMarket(quoteSymbols);
  }, [hydrated, pricesHydrated, quoteSymbols, refreshMarket]);

  const marketValueOpenUsd = React.useMemo(
    () => currentValue(openPositions, prices),
    [openPositions, prices]
  );
  const unrealizedTotalUsd = React.useMemo(
    () => unrealizedPnl(openPositions, prices),
    [openPositions, prices]
  );
  const quotedOpenCount = React.useMemo(
    () => openPositions.filter((p) => positionUnrealizedPnlUsd(p, prices) !== null).length,
    [openPositions, prices]
  );

  const quotedCostBasisUsd = React.useMemo(() => {
    return openPositions.reduce((sum, p) => {
      if (positionUnrealizedPnlUsd(p, prices) === null) return sum;
      return sum + p.costBasis;
    }, 0);
  }, [openPositions, prices]);

  const unrealizedPctOnQuotedCost = React.useMemo(() => {
    if (quotedCostBasisUsd <= 0 || quotedOpenCount === 0) return null;
    return round2((unrealizedTotalUsd / quotedCostBasisUsd) * 100);
  }, [quotedCostBasisUsd, unrealizedTotalUsd, quotedOpenCount]);

  const investedDisp = React.useMemo(() => toDisplay(invested), [invested, toDisplay]);
  const openCostDisp = React.useMemo(() => toDisplay(openCostBasis), [openCostBasis, toDisplay]);
  const realizedDisp = React.useMemo(() => toDisplay(realized), [realized, toDisplay]);
  const feesDisp = React.useMemo(() => toDisplay(fees), [fees, toDisplay]);
  const marketValueOpenDisp = React.useMemo(
    () => Math.round(toDisplay(marketValueOpenUsd) * 100) / 100,
    [marketValueOpenUsd, toDisplay]
  );
  const unrealizedTotalDisp = React.useMemo(
    () => Math.round(toDisplay(unrealizedTotalUsd) * 100) / 100,
    [unrealizedTotalUsd, toDisplay]
  );

  const totalPnlUsd = React.useMemo(
    () => realized + unrealizedTotalUsd,
    [realized, unrealizedTotalUsd]
  );
  const totalPnlDisp = React.useMemo(
    () => Math.round(toDisplay(totalPnlUsd) * 100) / 100,
    [totalPnlUsd, toDisplay]
  );
  const totalReturnPct = React.useMemo(() => {
    if (invested <= 0) return null;
    return round2((totalPnlUsd / invested) * 100);
  }, [invested, totalPnlUsd]);

  const allocationRows = React.useMemo(() => {
    const byType = new Map<string, number>();
    for (const p of positions) {
      if (p.qty <= 0) continue;
      const prev = byType.get(p.assetType) ?? 0;
      byType.set(p.assetType, prev + p.costBasis);
    }
    const totalUsd = Array.from(byType.values()).reduce((s, v) => s + v, 0);
    const keys = ["gold", "stock", "forex", "crypto", "other"] as const;
    return keys.map((k) => {
      const vUsd = byType.get(k) ?? 0;
      const pct = totalUsd > 0 ? (vUsd / totalUsd) * 100 : 0;
      const target = prefs.allocation?.[k] ?? 0;
      return { type: k, pct: Math.round(pct * 100) / 100, target };
    });
  }, [positions, prefs.allocation]);

  const allocationByAsset = React.useMemo(() => {
    return positions
      .filter((p) => p.qty > 0 && p.costBasis > 0)
      .map((p) => ({
        name: p.assetName,
        value: Math.round(toDisplay(p.costBasis) * 100) / 100
      }))
      .sort((a, b) => b.value - a.value);
  }, [positions, toDisplay]);

  const allocationByType = React.useMemo(() => {
    const labelOf = new Map(ASSET_TYPES.map((t) => [t.value, t.label] as const));
    const sum: Record<string, number> = {};
    for (const p of positions) {
      if (p.qty <= 0) continue;
      const label = labelOf.get(p.assetType) ?? p.assetType;
      sum[label] = (sum[label] ?? 0) + p.costBasis;
    }
    return Object.entries(sum)
      .map(([name, value]) => ({ name, value: Math.round(toDisplay(value) * 100) / 100 }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [positions, toDisplay]);

  const allocation = pieMode === "type" ? allocationByType : allocationByAsset;

  const holdingRows = React.useMemo(() => {
    return positions
      .filter((p) => p.qty > 0)
      .map((p) => {
        const pxUsd = marketPriceUsd(prices, p.assetName);
        const uUsd = positionUnrealizedPnlUsd(p, prices);
        const mvUsd = pxUsd !== undefined ? round2(pxUsd * p.qty) : null;
        const costDisp = Math.round(toDisplay(p.costBasis) * 100) / 100;
        const unrealDisp = uUsd === null ? null : Math.round(toDisplay(uUsd) * 100) / 100;
        const marketPxDisp = pxUsd === undefined ? null : Math.round(toDisplay(pxUsd) * 100) / 100;
        const marketValueDisp = mvUsd === null ? null : Math.round(toDisplay(mvUsd) * 100) / 100;
        const unrealPctOnCost =
          unrealDisp !== null && costDisp > 0
            ? Math.round((unrealDisp / costDisp) * 10000) / 100
            : null;
        return {
          p,
          costDisp,
          realizedDisp: Math.round(toDisplay(p.realizedPnl) * 100) / 100,
          unrealDisp,
          marketPxDisp,
          marketValueDisp,
          unrealPctOnCost
        };
      })
      .sort((a, b) => b.costDisp - a.costDisp);
  }, [positions, toDisplay, prices]);

  const top5UnrealizedWinners = React.useMemo(() => {
    return holdingRows
      .filter((r) => r.unrealDisp !== null && r.unrealDisp > 0)
      .sort((a, b) => (b.unrealDisp ?? 0) - (a.unrealDisp ?? 0))
      .slice(0, 5);
  }, [holdingRows]);

  const top5UnrealizedLosers = React.useMemo(() => {
    return holdingRows
      .filter((r) => r.unrealDisp !== null && r.unrealDisp < 0)
      .sort((a, b) => (a.unrealDisp ?? 0) - (b.unrealDisp ?? 0))
      .slice(0, 5);
  }, [holdingRows]);

  const txBuyCount = React.useMemo(() => txs.filter((t) => t.side === "buy").length, [txs]);
  const txSellCount = React.useMemo(() => txs.filter((t) => t.side === "sell").length, [txs]);

  const pnlRows = React.useMemo(() => {
    return positions
      .map((p) => {
        const uUsd = positionUnrealizedPnlUsd(p, prices);
        const unrealized = uUsd === null ? 0 : Math.round(toDisplay(uUsd) * 100) / 100;
        const realizedRow = Math.round(toDisplay(p.realizedPnl) * 100) / 100;
        const total = Math.round((realizedRow + unrealized) * 100) / 100;
        return {
          name: p.assetName,
          total,
          realized: realizedRow,
          unrealized
        };
      })
      .filter((r) => r.realized !== 0 || r.unrealized !== 0)
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
      .slice(0, 12);
  }, [positions, prices, toDisplay]);

  const seedDemo = React.useCallback(() => {
    const items = demoTransactions().map((t) => ({
      assetName: t.assetName,
      assetLabel: t.assetLabel,
      assetType: t.assetType,
      side: t.side,
      price: t.price,
      amount: t.amount,
      fee: t.fee,
      tax: t.tax ?? 0,
      currency: t.currency ?? ("USD" as AppCurrency),
      fxRateAtTrade: t.fxRateAtTrade ?? 1,
      tradedAt: t.tradedAt ?? t.createdAt,
      createdAt: t.createdAt
    }));
    void addMany(items);
  }, [addMany]);

  return {
    hydrated,
    currency,
    txsLength: txs.length,
    pieMode,
    setPieMode,
    seedDemo,
    toDisplay,
    invested,
    fees,
    realized,
    roiPct,
    openPositions,
    quotedOpenCount,
    unrealizedPctOnQuotedCost,
    investedDisp,
    openCostDisp,
    realizedDisp,
    feesDisp,
    marketValueOpenDisp,
    unrealizedTotalDisp,
    totalPnlUsd,
    totalPnlDisp,
    totalReturnPct,
    allocationRows,
    allocationByAsset,
    allocationByType,
    allocation,
    holdingRows,
    top5UnrealizedWinners,
    top5UnrealizedLosers,
    txBuyCount,
    txSellCount,
    pnlRows,
    pricesStatus,
    pricesError
  };
}
