import type { AssetSeries, PositionPoint, TradePoint } from "./assetTimelineTypes";

export type TradeClusterPoint = {
  ts: number;
  value: number;
  tipKind: "trade";
  tipAsset: string;
  tipCount: number;
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
  buyUnitPrice: number | null;
  sellUnitPrice: number | null;
};

export function tradesAtTimestamp(
  ts: number,
  allBuys: readonly TradePoint[],
  allSells: readonly TradePoint[],
): TradePoint[] {
  const out: TradePoint[] = [
    ...allBuys.filter((t) => t.ts === ts),
    ...allSells.filter((t) => t.ts === ts),
  ];
  out.sort((a, b) => a.tipAsset.localeCompare(b.tipAsset));
  return out;
}

export function tradeAtSameTs(
  pos: PositionPoint,
  buys: readonly TradePoint[],
  sells: readonly TradePoint[],
): TradePoint | undefined {
  const sell = sells.find((t) => t.tipAsset === pos.tipAsset && t.ts === pos.ts);
  if (sell) return sell;
  return buys.find((t) => t.tipAsset === pos.tipAsset && t.ts === pos.ts);
}

export function lastPositionAtOrBefore(
  points: readonly PositionPoint[],
  ts: number,
): PositionPoint | null {
  let best: PositionPoint | null = null;
  for (const p of points) {
    if (p.ts <= ts) best = p;
    else break;
  }
  return best;
}

export function buildTradeClusters(
  series: AssetSeries[],
  allBuys: readonly TradePoint[],
  allSells: readonly TradePoint[],
): TradeClusterPoint[] {
  const posByAssetTs = new Map<string, number>();
  for (const s of series) {
    for (const p of s.points) posByAssetTs.set(`${s.assetName}|${p.ts}`, p.value);
  }

  const m = new Map<string, TradeClusterPoint>();
  const add = (p: TradePoint) => {
    const key = `${p.tipAsset}|${p.ts}`;
    const base =
      m.get(key) ??
      ({
        ts: p.ts,
        value: posByAssetTs.get(key) ?? p.value,
        tipKind: "trade",
        tipAsset: p.tipAsset,
        tipCount: 0,
        buyCount: 0,
        sellCount: 0,
        buyAmount: 0,
        sellAmount: 0,
        buyUnitPrice: null,
        sellUnitPrice: null,
      } satisfies TradeClusterPoint);

    const c = Number(p.tipCount) || 1;
    base.tipCount += c;

    if (p.tipKind === "buy") {
      base.buyCount += c;
      const prevAmt = base.buyAmount;
      const nextAmt = Number(p.tipAmount) || 0;
      const totalAmt = prevAmt + nextAmt;
      if (totalAmt > 0) {
        const prevPx = base.buyUnitPrice ?? p.tipUnitPrice;
        const weighted = (prevPx * prevAmt + p.tipUnitPrice * nextAmt) / totalAmt;
        base.buyUnitPrice = weighted;
      } else {
        base.buyUnitPrice = p.tipUnitPrice;
      }
      base.buyAmount = prevAmt + nextAmt;
    } else {
      base.sellCount += c;
      const prevAmt = base.sellAmount;
      const nextAmt = Number(p.tipAmount) || 0;
      const totalAmt = prevAmt + nextAmt;
      if (totalAmt > 0) {
        const prevPx = base.sellUnitPrice ?? p.tipUnitPrice;
        const weighted = (prevPx * prevAmt + p.tipUnitPrice * nextAmt) / totalAmt;
        base.sellUnitPrice = weighted;
      } else {
        base.sellUnitPrice = p.tipUnitPrice;
      }
      base.sellAmount = prevAmt + nextAmt;
    }

    base.value = posByAssetTs.get(key) ?? base.value;
    m.set(key, base);
  };

  for (const p of allBuys) add(p);
  for (const p of allSells) add(p);

  return Array.from(m.values()).sort((a, b) => a.ts - b.ts);
}
