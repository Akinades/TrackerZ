import type { AppCurrency } from "@/store/useCurrency";
import type { AssetSeries, PositionPoint, TradePoint } from "./assetTimelineTypes";
import {
  lastPositionAtOrBefore,
  tradeAtSameTs,
  tradesAtTimestamp,
  type TradeClusterPoint,
} from "./assetTimelineChartModel";

function esc(x: string | number): string {
  return String(x)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function timeStr(ts: number): string {
  return new Date(ts).toLocaleString("th-TH", {
    hour12: false,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const card =
  "min-width:200px;max-width:min(92vw,320px);padding:10px 12px;border:1px solid #e4e4e7;border-radius:12px;background:#fff;font-size:12px;color:#18181b;box-shadow:0 10px 15px -3px rgba(0,0,0,0.08)";

function row(k: string, v: string): string {
  return `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:4px"><span style="color:#71717a">${esc(k)}</span><span style="font-weight:600">${v}</span></div>`;
}

function formatCluster(
  cluster: TradeClusterPoint,
  ts: number,
  formatMoney: (n: number, c: AppCurrency) => string,
  currency: AppCurrency,
): string {
  const t = timeStr(ts);
  const badge = cluster.tipCount > 1
    ? `<div style="flex-shrink:0;width:24px;height:24px;border-radius:9999px;background:#18181b;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">${cluster.tipCount}</div>`
    : "";
  let body = "";
  if (cluster.buyCount > 0) {
    body += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f4f4f5">`;
    body += `<span style="display:inline-block;background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">BUY</span>`;
    if (cluster.buyCount > 1)
      body += ` <span style="font-size:11px;color:#71717a">×${cluster.buyCount}</span>`;
    body += row("จำนวน", esc(cluster.buyAmount));
    body += row(
      "ราคา/หน่วย",
      cluster.buyUnitPrice == null ? "-" : esc(formatMoney(cluster.buyUnitPrice, currency)),
    );
    body += `</div>`;
  }
  if (cluster.sellCount > 0) {
    body += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f4f4f5">`;
    body += `<span style="display:inline-block;background:#ffe4e6;color:#9f1239;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">SELL</span>`;
    if (cluster.sellCount > 1)
      body += ` <span style="font-size:11px;color:#71717a">×${cluster.sellCount}</span>`;
    body += row("จำนวน", esc(cluster.sellAmount));
    body += row(
      "ราคา/หน่วย",
      cluster.sellUnitPrice == null ? "-" : esc(formatMoney(cluster.sellUnitPrice, currency)),
    );
    body += `</div>`;
  }
  return `<div style="${card}"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div style="font-size:14px;font-weight:600">${esc(cluster.tipAsset)}</div><div style="font-size:11px;color:#71717a;margin-top:2px">${esc(t)}</div></div>${badge}</div>${body}</div>`;
}

function formatSingleTrade(
  d: TradePoint,
  ts: number,
  formatMoney: (n: number, c: AppCurrency) => string,
  currency: AppCurrency,
): string {
  const t = timeStr(ts);
  const pill =
    d.tipKind === "buy"
      ? "background:#d1fae5;color:#065f46"
      : "background:#ffe4e6;color:#9f1239";
  return `<div style="${card}"><div style="font-size:14px;font-weight:600">${esc(d.tipAsset)}</div><div style="font-size:11px;color:#71717a;margin-top:2px">${esc(t)}</div><div style="margin-top:8px"><span style="display:inline-block;${pill};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">${d.tipKind === "buy" ? "BUY" : "SELL"}</span></div><div style="margin-top:8px;padding-top:8px;border-top:1px solid #f4f4f5">${row("จำนวน", esc(d.tipAmount))}${row("ราคา/หน่วย", esc(formatMoney(d.tipUnitPrice, currency)))}</div></div>`;
}

function formatPosition(
  d: PositionPoint,
  ts: number,
  formatMoney: (n: number, c: AppCurrency) => string,
  currency: AppCurrency,
  valueLabelBySeries?: Record<string, string>,
): string {
  const t = timeStr(ts);
  const valueLabel =
    (valueLabelBySeries && valueLabelBySeries[d.tipAsset]) || "มูลค่าถือ (โดยประมาณ)";
  const valueToShow =
    typeof d.tipValue === "number" && Number.isFinite(d.tipValue) ? d.tipValue : d.value;
  let inner = row(valueLabel, esc(formatMoney(valueToShow, currency)));
  if (Number.isFinite(d.tipQty) && d.tipQty !== 0) {
    inner += row("จำนวนคงเหลือ", esc(d.tipQty));
  }
  return `<div style="${card}"><div style="font-size:14px;font-weight:600">${esc(d.tipAsset)}</div><div style="font-size:11px;color:#71717a;margin-top:2px">${esc(t)}</div><div style="margin-top:8px;padding-top:8px;border-top:1px solid #f4f4f5">${inner}</div></div>`;
}

export function formatAssetTimelineAxisTooltipHtml(input: {
  ts: number;
  series: AssetSeries[];
  allBuys: readonly TradePoint[];
  allSells: readonly TradePoint[];
  tradeClusters: TradeClusterPoint[];
  legendHidden: ReadonlySet<string>;
  formatMoney: (n: number, c: AppCurrency) => string;
  currency: AppCurrency;
  valueLabelBySeries?: Record<string, string>;
}): string {
  const {
    ts,
    series,
    allBuys,
    allSells,
    tradeClusters,
    legendHidden,
    formatMoney,
    currency,
    valueLabelBySeries,
  } = input;

  const tradesHere = tradesAtTimestamp(ts, allBuys, allSells).filter(
    (t) => !legendHidden.has(t.tipAsset),
  );

  if (tradesHere.length > 1) {
    const t = timeStr(ts);
    const parts = tradesHere.map((trade, idx) => {
      const top =
        idx > 0 ? `style="margin-top:12px;padding-top:12px;border-top:1px solid #f4f4f5"` : "";
      const pill =
        trade.tipKind === "buy"
          ? "background:#d1fae5;color:#065f46"
          : "background:#ffe4e6;color:#9f1239";
      return `<div ${top}><div style="font-size:14px;font-weight:600">${esc(trade.tipAsset)}</div><span style="display:inline-block;margin-top:6px;${pill};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">${trade.tipKind === "buy" ? "BUY" : "SELL"}</span>${row("จำนวน", esc(trade.tipAmount))}${row("ราคา/หน่วย", esc(formatMoney(trade.tipUnitPrice, currency)))}</div>`;
    });
    return `<div style="${card};max-height:min(70vh,420px);overflow-y:auto"><div style="font-size:11px;font-weight:500;color:#71717a">${esc(t)}</div>${parts.join("")}</div>`;
  }

  const clustersHere = tradeClusters.filter(
    (c) => c.ts === ts && !legendHidden.has(c.tipAsset),
  );

  if (clustersHere.length === 1) {
    return formatCluster(clustersHere[0]!, ts, formatMoney, currency);
  }
  if (clustersHere.length > 1) {
    return clustersHere
      .map((c) => formatCluster(c, ts, formatMoney, currency))
      .join(
        '<div style="height:8px"></div>',
      );
  }

  if (tradesHere.length === 1) {
    return formatSingleTrade(tradesHere[0]!, ts, formatMoney, currency);
  }

  const blocks: string[] = [];
  for (const s of series) {
    if (legendHidden.has(s.assetName)) continue;
    const pos = lastPositionAtOrBefore(s.points, ts);
    if (!pos) continue;
    const st = tradeAtSameTs(pos, allBuys, allSells);
    if (st && !legendHidden.has(st.tipAsset)) {
      blocks.push(formatSingleTrade(st, ts, formatMoney, currency));
    } else {
      blocks.push(formatPosition(pos, ts, formatMoney, currency, valueLabelBySeries));
    }
  }

  if (blocks.length === 0) return "";
  if (blocks.length === 1) return blocks[0]!;
  return blocks.join('<div style="height:8px"></div>');
}
