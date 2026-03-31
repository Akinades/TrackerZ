import { round2 } from "@/lib/calculations";
import {
  SERIES_COLORS,
  type AssetSeries,
  type PositionPoint,
} from "@/components/charts/AssetValueTimelineLine";
import type { Transaction } from "@/types/transactions";
import { txExecutedAtIso, txExecutedAtMs } from "@/lib/transactionTime";

export type RangePreset =
  | ""
  | "today"
  | "yesterday"
  | "custom"
  | "last7"
  | "last30"
  | "last90"
  | "ytd"
  | "lastYear";

export type ToDisplayMoneyFn = (
  value: number,
  from?: import("@/store/useCurrency").AppCurrency,
  fxAtTrade?: number,
) => number;

export type RangeAnalytics = {
  netCashflow: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  closedTrades: number;
  winRatePct: number | null;
  profitFactor: number | null;
};

export function unitDisplayForTx(
  t: Transaction,
  toDisplayMoney: ToDisplayMoneyFn,
) {
  const baseCur = (t.currency ?? "THB") as import("@/store/useCurrency").AppCurrency;
  return round2(toDisplayMoney(t.price, baseCur, t.fxRateAtTrade));
}

export function txBase(t: Transaction) {
  return (t.currency ?? "THB") as import("@/store/useCurrency").AppCurrency;
}

export function txBuyOutflowDisplay(
  t: Transaction,
  toDisplayMoney: ToDisplayMoneyFn,
) {
  const base = txBase(t);
  const fx = t.fxRateAtTrade;
  const notional = round2(unitDisplayForTx(t, toDisplayMoney) * t.amount);
  const fee = round2(toDisplayMoney(Number(t.fee ?? 0), base, fx));
  const tax = round2(toDisplayMoney(Number(t.tax ?? 0), base, fx));
  return round2(notional + fee + tax);
}

export function txSellGrossDisplay(
  t: Transaction,
  toDisplayMoney: ToDisplayMoneyFn,
) {
  return round2(unitDisplayForTx(t, toDisplayMoney) * t.amount);
}

export function txFeeTaxDisplay(
  t: Transaction,
  toDisplayMoney: ToDisplayMoneyFn,
) {
  const base = txBase(t);
  const fx = t.fxRateAtTrade;
  return round2(
    toDisplayMoney(Number(t.fee ?? 0), base, fx) +
      toDisplayMoney(Number(t.tax ?? 0), base, fx),
  );
}

export function formatHourSlot(h: number) {
  const next = (h + 1) % 24;
  return `${String(h).padStart(2, "0")}:00–${String(next).padStart(2, "0")}:00 น.`;
}

export function topHourPhrases(txs: Transaction[], maxSlots: number): string[] {
  const map = new Map<number, number>();
  for (const t of txs) {
    const h = new Date(txExecutedAtIso(t)).getHours();
    map.set(h, (map.get(h) ?? 0) + 1);
  }
  const sorted = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSlots);
  return sorted.map(([h, c]) => `${formatHourSlot(h)} (${c} ครั้ง)`);
}

export function computeRangeAnalytics(
  txs: Transaction[],
  toDisplayMoney: ToDisplayMoneyFn,
  rangeStartMs?: number,
  rangeEndMs?: number,
): RangeAnalytics {
  const sorted = [...txs].sort((a, b) => txExecutedAtMs(a) - txExecutedAtMs(b));
  const lots = new Map<string, Array<{ qty: number; unitCost: number }>>();
  const latestUnitByAsset = new Map<string, number>();

  let netCashflow = 0;
  let realizedPnl = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let closedTrades = 0;
  let winners = 0;

  const hasStart = Number.isFinite(rangeStartMs);
  const hasEnd = Number.isFinite(rangeEndMs);

  const inRange = (ts: number) => {
    if (hasStart && ts < (rangeStartMs as number)) return false;
    if (hasEnd && ts > (rangeEndMs as number)) return false;
    return true;
  };

  for (const t of sorted) {
    const ts = txExecutedAtMs(t);
    if (hasEnd && ts > (rangeEndMs as number)) break;

    const asset = t.assetName?.trim().toUpperCase();
    if (!asset) continue;

    const unit = unitDisplayForTx(t, toDisplayMoney);
    const feeTax = txFeeTaxDisplay(t, toDisplayMoney);
    latestUnitByAsset.set(asset, unit);

    const trackPeriodMetrics = inRange(ts);

    if (t.side === "buy") {
      const buyOutflow = txBuyOutflowDisplay(t, toDisplayMoney);
      if (trackPeriodMetrics) netCashflow -= buyOutflow;
      const buyLots = lots.get(asset) ?? [];
      buyLots.push({
        qty: t.amount,
        unitCost: t.amount > 0 ? buyOutflow / t.amount : 0,
      });
      lots.set(asset, buyLots);
      continue;
    }

    const sellGross = txSellGrossDisplay(t, toDisplayMoney);
    const sellNet = round2(sellGross - feeTax);
    if (trackPeriodMetrics) netCashflow += sellNet;

    let remaining = t.amount;
    let costOut = 0;
    const sellLots = lots.get(asset) ?? [];

    while (remaining > 0 && sellLots.length > 0) {
      const lot = sellLots[0]!;
      const used = Math.min(remaining, lot.qty);
      costOut += used * lot.unitCost;
      lot.qty -= used;
      remaining -= used;
      if (lot.qty <= 1e-12) sellLots.shift();
    }

    if (remaining > 0) {
      costOut += remaining * unit;
      remaining = 0;
    }

    if (trackPeriodMetrics) {
      const thisPnl = round2(sellNet - costOut);
      realizedPnl += thisPnl;
      closedTrades += 1;
      if (thisPnl > 0) {
        winners += 1;
        grossProfit += thisPnl;
      } else if (thisPnl < 0) {
        grossLoss += Math.abs(thisPnl);
      }
    }
    lots.set(asset, sellLots);
  }

  let unrealizedPnl = 0;
  lots.forEach((assetLots, asset) => {
    const lastUnit = latestUnitByAsset.get(asset);
    if (!Number.isFinite(lastUnit)) return;
    for (const lot of assetLots) {
      if (!Number.isFinite(lot.qty) || lot.qty <= 0) continue;
      const lotPnl = (lastUnit! - lot.unitCost) * lot.qty;
      unrealizedPnl += lotPnl;
    }
  });

  const safeRealized = round2(realizedPnl);
  const safeUnrealized = round2(unrealizedPnl);
  const totalPnl = round2(safeRealized + safeUnrealized);
  const winRatePct =
    closedTrades > 0 ? round2((winners / closedTrades) * 100) : null;
  const profitFactor =
    grossLoss > 0
      ? round2(grossProfit / grossLoss)
      : grossProfit > 0
        ? Number.POSITIVE_INFINITY
        : null;

  return {
    netCashflow: round2(netCashflow),
    realizedPnl: safeRealized,
    unrealizedPnl: safeUnrealized,
    totalPnl,
    closedTrades,
    winRatePct,
    profitFactor,
  };
}

export function toDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function startOfYear(d: Date) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfMonth(d: Date) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function monthsAgo(n: number, base: Date = new Date()) {
  const x = new Date(base);
  x.setMonth(x.getMonth() - n);
  return x;
}

export function startOfPrevYear(base: Date = new Date()) {
  const x = new Date(base);
  x.setFullYear(x.getFullYear() - 1, 0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfPrevYear(base: Date = new Date()) {
  const x = new Date(base);
  x.setFullYear(x.getFullYear() - 1, 11, 31);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function buildSeriesForAsset(
  assetTxs: Transaction[],
  assetName: string,
  color: string,
  toDisplayMoney: ToDisplayMoneyFn,
): AssetSeries {
  const sorted = assetTxs
    .filter(
      (t) =>
        txExecutedAtIso(t) &&
        Number.isFinite(t.amount) &&
        Number.isFinite(t.price),
    )
    .sort((a, b) => txExecutedAtMs(a) - txExecutedAtMs(b));

  let qty = 0;
  const points: AssetSeries["points"] = [];
  const buys: AssetSeries["buys"] = [];
  const sells: AssetSeries["sells"] = [];

  const tradeAgg = new Map<string, (typeof buys)[number]>();
  const tradeKey = (ts: number, kind: "buy" | "sell") => `${ts}|${kind}`;
  const upsertTrade = (marker: (typeof buys)[number]) => {
    const key = tradeKey(marker.ts, marker.tipKind);
    const prev = tradeAgg.get(key);
    if (!prev) {
      tradeAgg.set(key, marker);
      return;
    }
    const prevAmt = Number(prev.tipAmount) || 0;
    const nextAmt = Number(marker.tipAmount) || 0;
    const totalAmt = prevAmt + nextAmt;
    const weighted =
      totalAmt > 0
        ? (prev.tipUnitPrice * prevAmt + marker.tipUnitPrice * nextAmt) / totalAmt
        : marker.tipUnitPrice;
    prev.tipAmount = round2(totalAmt);
    prev.tipUnitPrice = round2(weighted);
    prev.value = marker.value; // align to latest position value at this ts
    prev.tipCount = (Number(prev.tipCount) || 1) + (Number(marker.tipCount) || 1);
  };

  for (const t of sorted) {
    const baseCur = (t.currency ?? "THB") as "THB" | "USD";
    const fx = t.fxRateAtTrade;
    const unitDisplay = round2(toDisplayMoney(t.price, baseCur, fx));
    qty = t.side === "buy" ? qty + t.amount : qty - t.amount;
    const rawTs = txExecutedAtMs(t);
    // Merge "same time" trades as users see them (minute-level), not exact milliseconds.
    const ts = Math.floor(rawTs / 60_000) * 60_000;
    const value = round2(qty * unitDisplay);

    const lastPos = points[points.length - 1];
    if (lastPos && lastPos.ts === ts) {
      lastPos.value = value;
      lastPos.tipQty = round2(qty);
    } else {
      points.push({
        ts,
        value,
        tipKind: "position",
        tipAsset: assetName,
        tipQty: round2(qty),
      });
    }

    const marker = {
      ts,
      value,
      tipKind: t.side === "buy" ? ("buy" as const) : ("sell" as const),
      tipAsset: assetName,
      tipAmount: t.amount,
      tipUnitPrice: unitDisplay,
      tipCount: 1,
    };
    upsertTrade(marker);
  }

  // Flush aggregated trade markers (order by time).
  const allTrades = Array.from(tradeAgg.values()).sort((a, b) => a.ts - b.ts);
  for (const m of allTrades) {
    if (m.tipKind === "buy") buys.push(m);
    else sells.push(m);
  }

  return { assetName, color, points, buys, sells };
}

export function buildTimelines(
  txs: Transaction[],
  assetFilter: string,
  toDisplayMoney: ToDisplayMoneyFn,
): AssetSeries[] {
  if (assetFilter !== "__all__") {
    const assetTxs = txs.filter((t) => t.assetName === assetFilter);
    return [
      buildSeriesForAsset(
        assetTxs,
        assetFilter,
        SERIES_COLORS[0],
        toDisplayMoney,
      ),
    ];
  }

  const grouped = new Map<string, Transaction[]>();
  for (const t of txs) {
    if (!grouped.has(t.assetName)) grouped.set(t.assetName, []);
    grouped.get(t.assetName)!.push(t);
  }

  const assetNames = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b),
  );
  return assetNames.map((name, i) =>
    buildSeriesForAsset(
      grouped.get(name)!,
      name,
      SERIES_COLORS[i % SERIES_COLORS.length],
      toDisplayMoney,
    ),
  );
}

/** จำนวนเส้นสูงสุดบนกราฟโหมด “ทั้งหมด” ก่อนรวมที่เหลือเป็นเส้น “อื่นๆ” */
export const ALL_ASSETS_CHART_MAX_LINES = 6;
const ALL_ASSETS_TOP_LINES = 5;

function latestPositionValue(s: AssetSeries): number {
  const n = s.points.length;
  return n > 0 ? s.points[n - 1]!.value : 0;
}

/** รวมหลายสินทรัพย์เป็นเส้นเดียว (มูลค่า + จำนวนคงเหลือรวม) — จุดซื้อ/ขายยังแยกตามเหรียญ */
export function buildAggregatedOthersSeries(
  parts: AssetSeries[],
  label: string,
  color: string,
): AssetSeries {
  if (parts.length === 0) {
    return { assetName: label, color, points: [], buys: [], sells: [] };
  }

  const tsSet = new Set<number>();
  for (const s of parts) {
    for (const p of s.points) tsSet.add(p.ts);
    for (const p of s.buys) tsSet.add(p.ts);
    for (const p of s.sells) tsSet.add(p.ts);
  }
  const allTs = Array.from(tsSet).sort((a, b) => a - b);
  const indices = parts.map(() => -1);
  const points: PositionPoint[] = [];

  for (const ts of allTs) {
    let sumVal = 0;
    let sumQty = 0;
    let any = false;
    parts.forEach((s, si) => {
      const pts = s.points;
      let j = indices[si]!;
      while (j + 1 < pts.length && pts[j + 1]!.ts <= ts) {
        j += 1;
      }
      indices[si] = j;
      if (j >= 0) {
        const pt = pts[j]!;
        sumVal += pt.value;
        sumQty += pt.tipQty;
        any = true;
      }
    });
    if (any) {
      points.push({
        ts,
        value: round2(sumVal),
        tipKind: "position",
        tipAsset: label,
        tipQty: round2(sumQty),
      });
    }
  }

  return {
    assetName: label,
    color,
    points,
    buys: parts.flatMap((s) => s.buys),
    sells: parts.flatMap((s) => s.sells),
  };
}

export function limitAllAssetSeriesForChart(series: AssetSeries[]): {
  series: AssetSeries[];
  usedAggregation: boolean;
  othersCount: number;
} {
  if (series.length <= ALL_ASSETS_CHART_MAX_LINES) {
    return { series, usedAggregation: false, othersCount: 0 };
  }

  const sorted = [...series].sort(
    (a, b) => latestPositionValue(b) - latestPositionValue(a),
  );
  const top = sorted.slice(0, ALL_ASSETS_TOP_LINES);
  const rest = sorted.slice(ALL_ASSETS_TOP_LINES);
  const othersLabel = `อื่นๆ (${rest.length})`;
  const others = buildAggregatedOthersSeries(rest, othersLabel, "#64748b");

  const recoloredTop = top.map((s, i) => ({
    ...s,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return {
    series: [
      ...recoloredTop,
      {
        ...others,
        color: SERIES_COLORS[ALL_ASSETS_TOP_LINES % SERIES_COLORS.length],
      },
    ],
    usedAggregation: true,
    othersCount: rest.length,
  };
}
