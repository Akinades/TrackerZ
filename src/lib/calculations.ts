import type { Transaction } from "@/types/transactions";

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function txValue(tx: Transaction) {
  return tx.price * tx.amount;
}

export function txTotalCost(tx: Transaction) {
  // Buy cost basis includes fee + tax; sell proceeds handled elsewhere.
  const fee = Number.isFinite(tx.fee) ? tx.fee : 0;
  const tax = Number.isFinite(tx.tax ?? 0) ? (tx.tax ?? 0) : 0;
  return txValue(tx) + fee + tax;
}

export function totalFees(txs: Transaction[]) {
  return round2(
    txs.reduce((sum, t) => sum + (Number.isFinite(t.fee) ? t.fee : 0) + (Number.isFinite(t.tax ?? 0) ? (t.tax ?? 0) : 0), 0)
  );
}

export function investedTotal(txs: Transaction[]) {
  // Sum buy notional + buy fee
  const total = txs.reduce((sum, t) => {
    if (t.side !== "buy") return sum;
    return sum + txTotalCost(t);
  }, 0);
  return round2(total);
}

export function computePositionsFifo(txs: Transaction[]) {
  // FIFO lots per asset. This returns Position[] with realizedPnl accumulated.
  const sorted = [...txs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  type Lot = { qty: number; unitCost: number; totalCost: number };
  const lots = new Map<string, Lot[]>();
  const map = new Map<string, Position>();

  for (const tx of sorted) {
    const key = tx.assetName.trim();
    if (!key) continue;
    const amount = Number(tx.amount);
    const price = Number(tx.price);
    const fee = Number(tx.fee || 0);
    const tax = Number(tx.tax || 0);
    if (!Number.isFinite(amount) || !Number.isFinite(price) || !Number.isFinite(fee) || !Number.isFinite(tax)) continue;
    if (amount <= 0 || price <= 0 || fee < 0 || tax < 0) continue;

    const pos =
      map.get(key) ??
      ({
        assetName: key,
        assetType: tx.assetType,
        qty: 0,
        avgCost: 0,
        costBasis: 0,
        realizedPnl: 0
      } satisfies Position);

    const q = amount;
    if (tx.side === "buy") {
      const totalCost = price * q + fee + tax;
      const unitCost = totalCost / q;
      const arr = lots.get(key) ?? [];
      arr.push({ qty: q, unitCost, totalCost });
      lots.set(key, arr);
      pos.qty += q;
      pos.costBasis += totalCost;
      pos.avgCost = pos.qty > 0 ? pos.costBasis / pos.qty : 0;
      pos.assetType = tx.assetType;
    } else {
      // Sell: realized P/L vs FIFO lots; fee+tax reduce proceeds.
      let remaining = q;
      let costOut = 0;
      const arr = lots.get(key) ?? [];
      while (remaining > 0 && arr.length > 0) {
        const lot = arr[0];
        const use = Math.min(remaining, lot.qty);
        costOut += use * lot.unitCost;
        lot.qty -= use;
        remaining -= use;
        if (lot.qty <= 1e-12) arr.shift();
      }
      lots.set(key, arr);
      const proceeds = price * q - fee - tax;
      pos.realizedPnl += proceeds - costOut;
      pos.qty -= q;
      pos.costBasis = Math.max(0, pos.costBasis - costOut);
      pos.avgCost = pos.qty > 0 ? pos.costBasis / pos.qty : 0;
      pos.assetType = tx.assetType;
      if (pos.qty <= 0) {
        pos.qty = Math.max(0, pos.qty);
        pos.avgCost = 0;
        pos.costBasis = 0;
      }
    }

    map.set(key, pos);
  }

  return [...map.values()].sort((a, b) => a.assetName.localeCompare(b.assetName));
}

export type Position = {
  assetName: string;
  assetType: Transaction["assetType"];
  qty: number;
  avgCost: number; // per unit, includes buy fees allocated
  costBasis: number; // qty * avgCost
  realizedPnl: number; // accumulated
};

export function computePositionsAvgCost(txs: Transaction[]) {
  const sorted = [...txs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const map = new Map<string, Position>();

  for (const tx of sorted) {
    const key = tx.assetName.trim();
    if (!key) continue;

    const pos =
      map.get(key) ??
      ({
        assetName: key,
        assetType: tx.assetType,
        qty: 0,
        avgCost: 0,
        costBasis: 0,
        realizedPnl: 0
      } satisfies Position);

    const amount = Number(tx.amount);
    const price = Number(tx.price);
    const fee = Number(tx.fee || 0);
    if (!Number.isFinite(amount) || !Number.isFinite(price) || !Number.isFinite(fee)) continue;
    if (amount <= 0 || price <= 0 || fee < 0) continue;

    if (tx.side === "buy") {
      const totalCost = price * amount + fee;
      const nextQty = pos.qty + amount;
      const nextCostBasis = pos.costBasis + totalCost;
      pos.qty = nextQty;
      pos.avgCost = nextQty > 0 ? nextCostBasis / nextQty : 0;
      pos.costBasis = pos.qty * pos.avgCost;
      pos.assetType = tx.assetType;
    } else {
      // Sell: realized P/L uses current avgCost; sell fee reduces proceeds.
      const proceeds = price * amount - fee;
      const costOut = pos.avgCost * amount;
      pos.realizedPnl += proceeds - costOut;
      pos.qty -= amount;
      if (pos.qty <= 0) {
        // If position goes flat/short, reset basis
        pos.qty = Math.max(0, pos.qty);
        pos.avgCost = 0;
        pos.costBasis = 0;
      } else {
        pos.costBasis = pos.qty * pos.avgCost;
      }
      pos.assetType = tx.assetType;
    }

    map.set(key, pos);
  }

  return [...map.values()].sort((a, b) => a.assetName.localeCompare(b.assetName));
}

/** ราคา/หน่วยใน USD จากแผนที่ quotes (ไม่สนตัวพิมพ์ใหญ่เล็กของชื่อสินทรัพย์) */
export function marketPriceUsd(prices: Record<string, number>, assetName: string) {
  const k = assetName.trim();
  if (!k) return undefined;
  const u = k.toUpperCase();
  const v = prices[u] ?? prices[k];
  if (!Number.isFinite(v) || v <= 0) return undefined;
  return v;
}

/** กำไร/ขาดทุนที่ยังไม่รับรู้ของหนึ่งรายการ (USD) — ไม่มีราคาตลาดจะได้ null */
export function positionUnrealizedPnlUsd(p: Position, prices: Record<string, number>) {
  if (p.qty <= 0) return null;
  const px = marketPriceUsd(prices, p.assetName);
  if (px === undefined) return null;
  return round2((px - p.avgCost) * p.qty);
}

export function currentValue(positions: Position[], prices: Record<string, number>) {
  const total = positions.reduce((sum, p) => {
    const px = marketPriceUsd(prices, p.assetName);
    if (px === undefined) return sum;
    return sum + p.qty * px;
  }, 0);
  return round2(total);
}

export function unrealizedPnl(positions: Position[], prices: Record<string, number>) {
  const total = positions.reduce((sum, p) => {
    const px = marketPriceUsd(prices, p.assetName);
    if (px === undefined) return sum;
    return sum + (px - p.avgCost) * p.qty;
  }, 0);
  return round2(total);
}

export function realizedPnlFromPositions(positions: Position[]) {
  return round2(positions.reduce((sum, p) => sum + p.realizedPnl, 0));
}

