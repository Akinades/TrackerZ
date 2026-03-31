"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppCurrency } from "@/store/useCurrency";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney } from "@/lib/format";
import type { RangePreset } from "@/lib/assetTimeline";
import { endOfDay, endOfMonth, startOfDay } from "@/lib/assetTimeline";

export const SERIES_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

export type PositionPoint = {
  ts: number;
  value: number;
  tipKind: "position";
  tipAsset: string;
  tipQty: number;
};

export type TradePoint = {
  ts: number;
  value: number;
  tipKind: "buy" | "sell";
  tipAsset: string;
  tipAmount: number;
  tipUnitPrice: number;
  tipCount?: number;
};

export type ChartPointPayload = PositionPoint | TradePoint;

export type AssetSeries = {
  assetName: string;
  color: string;
  points: PositionPoint[];
  buys: TradePoint[];
  sells: TradePoint[];
};

type TradeClusterPoint = {
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

const BUY_FILL = "#22c55e";
const SELL_FILL = "#f43f5e";

/** Merged-row key for PositionPoint tooltip (avoids colliding with `dataKey` / `ts`). */
function tipStoreKey(assetName: string): string {
  return `__tip__${assetName}`;
}

/**
 * Single `data` array for ComposedChart so Recharts aligns tooltip indices across lines.
 * Each row holds stepped Y per asset plus `__tip__{name}` for the active position snapshot.
 */
function buildMergedLineData(series: AssetSeries[]): Record<string, unknown>[] {
  const tsSet = new Set<number>();
  for (const s of series) {
    for (const p of s.points) tsSet.add(p.ts);
    for (const p of s.buys) tsSet.add(p.ts);
    for (const p of s.sells) tsSet.add(p.ts);
  }
  const allTs = Array.from(tsSet).sort((a, b) => a - b);
  if (allTs.length === 0) return [];

  const indices = series.map(() => -1);
  const rows: Record<string, unknown>[] = [];

  for (const ts of allTs) {
    const row: Record<string, unknown> = { ts };
    let any = false;
    series.forEach((s, si) => {
      const pts = s.points;
      let j = indices[si]!;
      while (j + 1 < pts.length && pts[j + 1]!.ts <= ts) {
        j += 1;
      }
      indices[si] = j;
      if (j >= 0) {
        const pt = pts[j]!;
        row[s.assetName] = pt.value;
        row[tipStoreKey(s.assetName)] = pt;
        any = true;
      }
    });
    if (any) rows.push(row);
  }
  return rows;
}

function tooltipRowsFromPayload(
  payload?: ReadonlyArray<{ payload?: unknown; dataKey?: unknown }>,
): Array<ChartPointPayload | TradeClusterPoint> {
  if (!payload?.length) return [];
  const out: Array<ChartPointPayload | TradeClusterPoint> = [];
  for (const p of payload) {
    const raw = p.payload;
    if (isChartPayload(raw)) {
      out.push(raw);
      continue;
    }
    if (isTradeClusterPayload(raw)) {
      out.push(raw);
      continue;
    }
    if (raw != null && typeof raw === "object" && "ts" in raw) {
      const dk = p.dataKey;
      if (dk == null) continue;
      const name = typeof dk === "number" ? String(dk) : String(dk);
      const tip = (raw as Record<string, unknown>)[tipStoreKey(name)];
      if (isChartPayload(tip) || isTradeClusterPayload(tip)) out.push(tip as any);
    }
  }
  return out;
}

function isChartPayload(x: unknown): x is ChartPointPayload {
  return (
    x != null &&
    typeof x === "object" &&
    "tipKind" in x &&
    typeof (x as ChartPointPayload).ts === "number" &&
    typeof (x as ChartPointPayload).value === "number"
  );
}

function isTradeClusterPayload(x: unknown): x is TradeClusterPoint {
  return (
    x != null &&
    typeof x === "object" &&
    (x as any).tipKind === "trade" &&
    typeof (x as any).ts === "number" &&
    typeof (x as any).value === "number" &&
    typeof (x as any).tipAsset === "string"
  );
}

/** ณ เวลาเดียวกับจุดบนเส้น — มักเป็นจุดหลังเทรด; ถ้ามีซื้อ/ขายที่ timestamp เดียวกัน ให้โชว์ tooltip แบบเทรด */
function tradeAtSameTs(
  pos: PositionPoint,
  buys: readonly TradePoint[],
  sells: readonly TradePoint[],
): TradePoint | undefined {
  const sell = sells.find(
    (t) => t.tipAsset === pos.tipAsset && t.ts === pos.ts,
  );
  if (sell) return sell;
  return buys.find((t) => t.tipAsset === pos.tipAsset && t.ts === pos.ts);
}

/** จุดโฟกัสบนเส้น — ถ้า ณ เวลานั้นเป็นซื้อ/ขาย ให้ใช้สีจุดซื้อ/ขาย ไม่ใช่สีเส้นสินทรัพย์ */
function LineActiveDot(props: {
  cx?: number;
  cy?: number;
  payload?: unknown;
  dataKey?: unknown;
  lineColor: string;
  allBuys: readonly TradePoint[];
  allSells: readonly TradePoint[];
}) {
  const { cx, cy, payload, dataKey, lineColor, allBuys, allSells } = props;
  if (cx == null || cy == null) return null;

  let fill = lineColor;
  if (
    payload != null &&
    typeof payload === "object" &&
    dataKey != null &&
    !Array.isArray(payload)
  ) {
    const row = payload as Record<string, unknown>;
    const name =
      typeof dataKey === "number" ? String(dataKey) : String(dataKey);
    const tip = row[tipStoreKey(name)];
    if (isChartPayload(tip) && tip.tipKind === "position") {
      const tr = tradeAtSameTs(tip, allBuys, allSells);
      if (tr?.tipKind === "sell") fill = SELL_FILL;
      else if (tr?.tipKind === "buy") fill = BUY_FILL;
    }
  }

  return (
    <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#fff" strokeWidth={2.5} />
  );
}

function BuyDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={BUY_FILL}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={18}
        fill="transparent"
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

function SellDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={SELL_FILL}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={18}
        fill="transparent"
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

/** Recharts 3 ใช้ `activeShape` (ไม่ใช่ activeDot) — สีต้องตรง buy/sell ไม่ให้กลายเป็นวงเขียวค่าเริ่มต้น */
function ActiveBuyDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill={BUY_FILL}
        stroke="#ffffff"
        strokeWidth={3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={20}
        fill="transparent"
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

function ActiveSellDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill={SELL_FILL}
        stroke="#ffffff"
        strokeWidth={3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={20}
        fill="transparent"
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

function TimelineTooltipBody({
  active,
  payload,
  currency,
  allBuys,
  allSells,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }> | undefined;
  currency: AppCurrency;
  allBuys: readonly TradePoint[];
  allSells: readonly TradePoint[];
}) {
  if (!active || !payload?.length) return null;

  const rows = tooltipRowsFromPayload(payload);

  if (rows.length === 0) return null;

  const cluster = rows.find((r) => (r as any).tipKind === "trade") as
    | TradeClusterPoint
    | undefined;
  const trade = rows.find(
    (r: any) => r.tipKind === "buy" || r.tipKind === "sell",
  ) as TradePoint | PositionPoint | undefined;
  const pos = rows.find((r: any) => r.tipKind === "position") as
    | PositionPoint
    | undefined;
  const sameTsTrade = pos ? tradeAtSameTs(pos, allBuys, allSells) : undefined;
  const d: any = cluster ?? trade ?? sameTsTrade ?? pos;
  if (!d) return null;

  const timeStr = new Date(d.ts).toLocaleString("th-TH", {
    hour12: false,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (cluster) {
    const showBadge = cluster.tipCount > 1;
    return (
      <div
        className="min-w-[220px] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs shadow-lg"
        style={{ color: "rgb(24,24,27)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              {cluster.tipAsset}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">{timeStr}</div>
          </div>
          {showBadge ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
              {cluster.tipCount}
            </div>
          ) : null}
        </div>

        <div className="mt-2 space-y-2 border-t border-zinc-100 pt-2 tabular-nums">
          {cluster.buyCount > 0 ? (
            <div className="grid gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-emerald-800">
                  BUY
                </span>
                {cluster.buyCount > 1 ? (
                  <span className="text-[11px] text-zinc-500">
                    ×{cluster.buyCount}
                  </span>
                ) : null}
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">จำนวน</span>
                <span className="font-medium text-zinc-900">
                  {cluster.buyAmount}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">ราคา/หน่วย</span>
                <span className="font-medium text-zinc-900">
                  {cluster.buyUnitPrice == null
                    ? "-"
                    : formatMoney(cluster.buyUnitPrice, currency)}
                </span>
              </div>
            </div>
          ) : null}

          {cluster.sellCount > 0 ? (
            <div className="grid gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-rose-800">
                  SELL
                </span>
                {cluster.sellCount > 1 ? (
                  <span className="text-[11px] text-zinc-500">
                    ×{cluster.sellCount}
                  </span>
                ) : null}
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">จำนวน</span>
                <span className="font-medium text-zinc-900">
                  {cluster.sellAmount}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">ราคา/หน่วย</span>
                <span className="font-medium text-zinc-900">
                  {cluster.sellUnitPrice == null
                    ? "-"
                    : formatMoney(cluster.sellUnitPrice, currency)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (d.tipKind === "buy" || d.tipKind === "sell") {
    return (
      <div
        className="min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs shadow-lg"
        style={{ color: "rgb(24,24,27)" }}
      >
        <div className="text-sm font-semibold text-zinc-900">{d.tipAsset}</div>
        <div className="mt-0.5 text-[11px] text-zinc-500">{timeStr}</div>
        <div
          className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide ${
            d.tipKind === "buy"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800"
          }`}
        >
          {d.tipKind === "buy" ? "BUY" : "SELL"}
        </div>
        <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 tabular-nums">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">จำนวน</span>
            <span className="font-medium text-zinc-900">{d.tipAmount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">ราคา/หน่วย</span>
            <span className="font-medium text-zinc-900">
              {formatMoney(d.tipUnitPrice, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (d.tipKind !== "position") return null;
  return (
    <div
      className="min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs shadow-lg"
      style={{ color: "rgb(24,24,27)" }}
    >
      <div className="text-sm font-semibold text-zinc-900">{d.tipAsset}</div>
      <div className="mt-0.5 text-[11px] text-zinc-500">{timeStr}</div>
      <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 tabular-nums">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">มูลค่าถือ (โดยประมาณ)</span>
          <span className="font-medium text-zinc-900">
            {formatMoney(d.value, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">จำนวนคงเหลือ</span>
          <span className="font-medium text-zinc-900">{d.tipQty}</span>
        </div>
      </div>
    </div>
  );
}

function buildTradeClusters(
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

    // Always snap to final position value at that timestamp (if available).
    base.value = posByAssetTs.get(key) ?? base.value;
    m.set(key, base);
  };

  for (const p of allBuys) add(p);
  for (const p of allSells) add(p);

  return Array.from(m.values()).sort((a, b) => a.ts - b.ts);
}

function TradeDot(props: { cx?: number; cy?: number; payload?: unknown }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const p = payload as any;
  const isCluster = isTradeClusterPayload(p);
  const hasBuy = isCluster ? p.buyCount > 0 : p?.tipKind === "buy";
  const hasSell = isCluster ? p.sellCount > 0 : p?.tipKind === "sell";
  const fill =
    hasBuy && hasSell ? "#0f172a" : hasSell ? SELL_FILL : hasBuy ? BUY_FILL : "#0f172a";
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={fill} stroke="#ffffff" strokeWidth={2} />
      <circle
        cx={cx}
        cy={cy}
        r={18}
        fill="transparent"
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

function ActiveTradeDot(props: { cx?: number; cy?: number; payload?: unknown }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const p = payload as any;
  const isCluster = isTradeClusterPayload(p);
  const hasBuy = isCluster ? p.buyCount > 0 : p?.tipKind === "buy";
  const hasSell = isCluster ? p.sellCount > 0 : p?.tipKind === "sell";
  const fill =
    hasBuy && hasSell ? "#0f172a" : hasSell ? SELL_FILL : hasBuy ? BUY_FILL : "#0f172a";
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={fill} stroke="#ffffff" strokeWidth={3} />
      <circle
        cx={cx}
        cy={cy}
        r={20}
        fill="transparent"
        style={{ cursor: "pointer" }}
      />
    </g>
  );
}

export function AssetValueTimelineLine({
  series,
  height = 400,
  rangePreset,
  from,
  to,
  locale = "th",
  showTradeLegend = true,
  showArea = false,
}: {
  series: AssetSeries[];
  height?: number;
  rangePreset?: RangePreset;
  from?: Date | null;
  to?: Date | null;
  locale?: "th" | "en";
  showTradeLegend?: boolean;
  showArea?: boolean;
}) {
  const { currency } = useCurrency();

  const hasData = series.some(
    (s) => s.points.length > 0 || s.buys.length > 0 || s.sells.length > 0,
  );

  const xDomain = React.useMemo<[number, number]>(() => {
    const hasFrom = from instanceof Date && Number.isFinite(from.getTime());
    const hasTo = to instanceof Date && Number.isFinite(to.getTime());
    if (hasFrom || hasTo) {
      const start = hasFrom ? startOfDay(from!).getTime() : undefined;
      const end = hasTo ? endOfDay(to!).getTime() : undefined;
      if (start != null && end != null) return [start, end];
      if (start != null) return [start, start];
      if (end != null) return [end, end];
    }

    let min = Infinity;
    let max = -Infinity;
    for (const s of series) {
      for (const p of [...s.points, ...s.buys, ...s.sells]) {
        if (p.ts < min) min = p.ts;
        if (p.ts > max) max = p.ts;
      }
    }
    return [min === Infinity ? 0 : min, max === -Infinity ? 0 : max];
  }, [series, from, to]);

  const xAxis = React.useMemo(() => {
    const [d0, d1] = xDomain;
    const start = Number(d0);
    const end = Number(d1);
    const safeStart = Number.isFinite(start) ? start : 0;
    const safeEnd = Number.isFinite(end) ? end : safeStart;
    const span = Math.max(0, safeEnd - safeStart);

    const thWeekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;
    const enWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    const weekdayLabel = (d: Date) =>
      locale === "th" ? thWeekdays[d.getDay()] : enWeekdays[d.getDay()];

    const monthLabel = (d: Date) =>
      d.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
        month: "short",
      });

    const sameDay =
      new Date(safeStart).toDateString() === new Date(safeEnd).toDateString();
    const shouldShowHours =
      rangePreset === "today" ||
      rangePreset === "yesterday" ||
      (sameDay && span <= 36 * 60 * 60 * 1000);

    const format = (v: number) => {
      const d = new Date(Number(v));
      if (shouldShowHours) {
        return d.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (rangePreset === "last7") {
        const wd = d.getDay(); // 0 Sun ... 6 Sat
        if (wd === 0 || wd === 6) return "";
        return weekdayLabel(d);
      }
      if (rangePreset === "last30") return String(d.getDate());
      if (rangePreset === "last90") return monthLabel(d);
      if (rangePreset === "ytd" || rangePreset === "lastYear") return monthLabel(d);
      return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US");
    };

    const sampleTicks = (ticks: number[], max: number) => {
      if (ticks.length <= max) return ticks;
      const step = (ticks.length - 1) / (max - 1);
      const sampled: number[] = [];
      for (let i = 0; i < max; i++) sampled.push(ticks[Math.round(i * step)]!);
      return Array.from(new Set(sampled)).sort((a, b) => a - b);
    };

    // Build "calendar" ticks so points don't look scattered on same-day ranges.
    const ticks: number[] = [];
    if (shouldShowHours) {
      const d = new Date(safeStart);
      d.setMinutes(0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const x = new Date(d);
        x.setHours(h, 0, 0, 0);
        const ms = x.getTime();
        if (ms >= safeStart && ms <= safeEnd) ticks.push(ms);
      }
      return { ticks: sampleTicks(ticks, 8), format };
    }

    if (
      rangePreset === "last7" ||
      rangePreset === "last30" ||
      rangePreset === "ytd" ||
      rangePreset === "lastYear" ||
      rangePreset === "last90"
    ) {
      // Month-based
      if (
        rangePreset === "ytd" ||
        rangePreset === "lastYear" ||
        rangePreset === "last90"
      ) {
        const cur = new Date(safeStart);
        cur.setDate(1);
        cur.setHours(0, 0, 0, 0);
        while (cur.getTime() <= safeEnd) {
          // Use month-end ticks to avoid clipping the first month label at far-left,
          // and to align with month-sampled series points.
          ticks.push(endOfDay(endOfMonth(cur)).getTime());
          cur.setMonth(cur.getMonth() + 1, 1);
          cur.setHours(0, 0, 0, 0);
        }
        return { ticks: sampleTicks(ticks, 12), format };
      }

      // Day-based
      const cur = new Date(safeStart);
      cur.setHours(0, 0, 0, 0);
      while (cur.getTime() <= safeEnd) {
        ticks.push(cur.getTime());
        cur.setDate(cur.getDate() + 1);
      }
      return { ticks: sampleTicks(ticks, rangePreset === "last7" ? 7 : 10), format };
    }

    // Fallback: sample existing point timestamps.
    const uniq = new Set<number>();
    for (const s of series) {
      for (const p of s.points) uniq.add(p.ts);
      for (const p of s.buys) uniq.add(p.ts);
      for (const p of s.sells) uniq.add(p.ts);
    }
    const sorted = Array.from(uniq).sort((a, b) => a - b);
    if (sorted.length === 0) {
      const target = 8;
      const step = target > 1 ? span / (target - 1) : 0;
      const gen = Array.from({ length: target }, (_, i) =>
        Math.round(safeStart + i * step),
      );
      return { ticks: gen, format };
    }
    return { ticks: sampleTicks(sorted, 8), format };
  }, [xDomain, rangePreset, locale, series]);

  const allBuys = React.useMemo(() => series.flatMap((s) => s.buys), [series]);
  const allSells = React.useMemo(() => series.flatMap((s) => s.sells), [series]);
  const tradeClusters = React.useMemo(
    () => buildTradeClusters(series, allBuys, allSells),
    [series, allBuys, allSells],
  );

  const mergedLineData = React.useMemo(
    () => buildMergedLineData(series),
    [series],
  );

  const tooltipContent = React.useCallback(
    (props: {
      active?: boolean;
      payload?: ReadonlyArray<{ payload?: unknown }>;
    }) => (
      <TimelineTooltipBody
        active={props.active}
        payload={props.payload}
        currency={currency}
        allBuys={allBuys}
        allSells={allSells}
      />
    ),
    [currency, allBuys, allSells],
  );

  if (!hasData) {
    return (
      <div className="text-sm text-zinc-500">ยังไม่มีข้อมูลในช่วงเวลานี้</div>
    );
  }

  return (
    <div className="grid gap-3">
      {showTradeLegend ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-zinc-600">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded-full border-[2.5px] border-white shadow-md"
                style={{ background: BUY_FILL }}
              />
              จุดซื้อ
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded-full border-[2.5px] border-white shadow-md"
                style={{ background: SELL_FILL }}
              />
              จุดขาย
            </span>
          </div>
        </div>
      ) : null}

      <div
        style={{ height }}
        className="outline-none [&_.recharts-wrapper]:overflow-visible [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-wrapper:focus-visible]:outline-none [&_.recharts-tooltip-wrapper]:overflow-visible [&_.recharts-surface]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-surface:focus-visible]:outline-none [&_.recharts-surface>svg]:outline-none [&_.recharts-surface>svg:focus]:outline-none"
        onMouseDown={(e) => {
          const t = e.target as HTMLElement | null;
          if (t?.closest(".recharts-wrapper")) {
            e.preventDefault();
          }
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            accessibilityLayer={false}
            data={mergedLineData}
            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              stroke="rgba(24,24,27,0.06)"
              strokeDasharray="4 6"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="ts"
              domain={xDomain}
              ticks={xAxis.ticks}
              scale="time"
              tick={{ fill: "rgb(113,113,122)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => xAxis.format(Number(v))}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              type="number"
              tick={{ fill: "rgb(113,113,122)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, "auto"]}
              tickFormatter={(v) => formatMoney(Number(v), currency)}
              width={76}
            />
            <Tooltip
              content={tooltipContent}
              trigger="hover"
              cursor={{
                stroke: "rgba(113,113,122,0.35)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              isAnimationActive={false}
              animationDuration={0}
              offset={18}
              allowEscapeViewBox={{ x: false, y: true }}
              shared={false}
              wrapperStyle={{
                pointerEvents: "none",
                zIndex: 20,
              }}
            />
            {series.length > 1 ? (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 4 }}
                formatter={(value: string) => (
                  <span className="text-[11px] font-medium text-zinc-500">
                    {value}
                  </span>
                )}
              />
            ) : null}

            {showArea && series.length === 1 ? (
              <Area
                type="monotoneX"
                dataKey={series[0]!.assetName}
                stroke="transparent"
                fill={series[0]!.color}
                fillOpacity={0.12}
                isAnimationActive={false}
                connectNulls={false}
              />
            ) : null}

            {series.map((s) => (
              <Line
                key={`line-${s.assetName}`}
                type="monotoneX"
                dataKey={s.assetName}
                name={s.assetName}
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                activeDot={(dotProps) => (
                  <LineActiveDot
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    payload={dotProps.payload}
                    dataKey={dotProps.dataKey}
                    lineColor={s.color}
                    allBuys={allBuys}
                    allSells={allSells}
                  />
                )}
              />
            ))}

            {tradeClusters.length > 0 && (
              <Scatter
                data={tradeClusters}
                dataKey="value"
                name="ซื้อ/ขาย"
                fill="#0f172a"
                shape={TradeDot}
                activeShape={ActiveTradeDot}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
