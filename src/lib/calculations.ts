import type { Transaction } from "@/types/transactions";

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function txValue(tx: Transaction) {
  return tx.price * tx.amount;
}

export function totalFees(txs: Transaction[]) {
  return round2(txs.reduce((sum, t) => sum + (Number.isFinite(t.fee) ? t.fee : 0), 0));
}

export function investedTotal(txs: Transaction[]) {
  // Sum buy notional + buy fee (simple MVP view)
  const total = txs.reduce((sum, t) => {
    if (t.side !== "buy") return sum;
    return sum + txValue(t) + t.fee;
  }, 0);
  return round2(total);
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
        // If position goes flat/short, reset basis (MVP behavior)
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

export function currentValue(positions: Position[], prices: Record<string, number>) {
  const total = positions.reduce((sum, p) => {
    const px = prices[p.assetName];
    if (!Number.isFinite(px) || px <= 0) return sum;
    return sum + p.qty * px;
  }, 0);
  return round2(total);
}

export function unrealizedPnl(positions: Position[], prices: Record<string, number>) {
  const total = positions.reduce((sum, p) => {
    const px = prices[p.assetName];
    if (!Number.isFinite(px) || px <= 0) return sum;
    return sum + (px - p.avgCost) * p.qty;
  }, 0);
  return round2(total);
}

export function realizedPnlFromPositions(positions: Position[]) {
  return round2(positions.reduce((sum, p) => sum + p.realizedPnl, 0));
}

