"use client";

import * as React from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/Button";
import type { AppCurrency } from "@/store/useCurrency";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney } from "@/lib/format";

export const SERIES_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#84cc16"
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
};

export type ChartPointPayload = PositionPoint | TradePoint;

export type AssetSeries = {
  assetName: string;
  color: string;
  points: PositionPoint[];
  buys: TradePoint[];
  sells: TradePoint[];
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
  payload?: ReadonlyArray<{ payload?: unknown; dataKey?: unknown }>
): ChartPointPayload[] {
  if (!payload?.length) return [];
  const out: ChartPointPayload[] = [];
  for (const p of payload) {
    const raw = p.payload;
    if (isChartPayload(raw)) {
      out.push(raw);
      continue;
    }
    if (raw != null && typeof raw === "object" && "ts" in raw) {
      const dk = p.dataKey;
      if (dk == null) continue;
      const name = typeof dk === "number" ? String(dk) : String(dk);
      const tip = (raw as Record<string, unknown>)[tipStoreKey(name)];
      if (isChartPayload(tip)) out.push(tip);
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

/** ณ เวลาเดียวกับจุดบนเส้น — มักเป็นจุดหลังเทรด; ถ้ามีซื้อ/ขายที่ timestamp เดียวกัน ให้โชว์ tooltip แบบเทรด */
function tradeAtSameTs(
  pos: PositionPoint,
  buys: readonly TradePoint[],
  sells: readonly TradePoint[]
): TradePoint | undefined {
  const sell = sells.find((t) => t.tipAsset === pos.tipAsset && t.ts === pos.ts);
  if (sell) return sell;
  return buys.find((t) => t.tipAsset === pos.tipAsset && t.ts === pos.ts);
}

/** จุดโฟกัสบนเส้น — ถ้า ณ เวลานั้นเป็นซื้อ/ขาย ให้ใช้สีจุดซื้อ/ขาย ไม่ใช่สีเส้นสินทรัพย์ */
function LineActiveDot(
  props: {
    cx?: number;
    cy?: number;
    payload?: unknown;
    dataKey?: unknown;
    lineColor: string;
    allBuys: readonly TradePoint[];
    allSells: readonly TradePoint[];
  }
) {
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
    const name = typeof dataKey === "number" ? String(dataKey) : String(dataKey);
    const tip = row[tipStoreKey(name)];
    if (isChartPayload(tip) && tip.tipKind === "position") {
      const tr = tradeAtSameTs(tip, allBuys, allSells);
      if (tr?.tipKind === "sell") fill = SELL_FILL;
      else if (tr?.tipKind === "buy") fill = BUY_FILL;
    }
  }

  return <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2.5} />;
}

function BuyDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={BUY_FILL} stroke="#ffffff" strokeWidth={2} />
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
      <circle cx={cx} cy={cy} r={7} fill={SELL_FILL} stroke="#ffffff" strokeWidth={2} />
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
      <circle cx={cx} cy={cy} r={10} fill={BUY_FILL} stroke="#ffffff" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={20} fill="transparent" style={{ cursor: "pointer" }} />
    </g>
  );
}

function ActiveSellDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={SELL_FILL} stroke="#ffffff" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={20} fill="transparent" style={{ cursor: "pointer" }} />
    </g>
  );
}

function TimelineTooltipBody({
  active,
  payload,
  currency,
  allBuys,
  allSells
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

  const trade = rows.find((r: ChartPointPayload) => r.tipKind === "buy" || r.tipKind === "sell");
  const pos = rows.find((r: ChartPointPayload) => r.tipKind === "position");
  const sameTsTrade = pos ? tradeAtSameTs(pos, allBuys, allSells) : undefined;
  const d = trade ?? sameTsTrade ?? pos;
  if (!d) return null;

  const timeStr = new Date(d.ts).toLocaleString("th-TH", {
    hour12: false,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

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
          <span className="font-medium text-zinc-900">{formatMoney(d.value, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">จำนวนคงเหลือ</span>
          <span className="font-medium text-zinc-900">{d.tipQty}</span>
        </div>
      </div>
    </div>
  );
}

export function AssetValueTimelineLine({
  series,
  height = 400
}: {
  series: AssetSeries[];
  height?: number;
}) {
  const { currency } = useCurrency();
  const [tooltipTrigger, setTooltipTrigger] = React.useState<"hover" | "click">("hover");

  const hasData = series.some(
    (s) => s.points.length > 0 || s.buys.length > 0 || s.sells.length > 0
  );

  const xDomain = React.useMemo<[number, number]>(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const s of series) {
      for (const p of [...s.points, ...s.buys, ...s.sells]) {
        if (p.ts < min) min = p.ts;
        if (p.ts > max) max = p.ts;
      }
    }
    return [min === Infinity ? 0 : min, max === -Infinity ? 0 : max];
  }, [series]);

  const xTicks = React.useMemo(() => {
    const uniq = new Set<number>();
    for (const s of series) {
      for (const p of s.points) uniq.add(p.ts);
      for (const p of s.buys) uniq.add(p.ts);
      for (const p of s.sells) uniq.add(p.ts);
    }
    const sorted = Array.from(uniq).sort((a, b) => a - b);
    if (sorted.length <= 8) return sorted;

    const target = 8;
    const step = (sorted.length - 1) / (target - 1);
    const sampled: number[] = [];
    for (let i = 0; i < target; i++) {
      sampled.push(sorted[Math.round(i * step)]);
    }
    return Array.from(new Set(sampled)).sort((a, b) => a - b);
  }, [series]);

  const allBuys = React.useMemo(() => series.flatMap((s) => s.buys), [series]);
  const allSells = React.useMemo(() => series.flatMap((s) => s.sells), [series]);

  const mergedLineData = React.useMemo(() => buildMergedLineData(series), [series]);

  const tooltipContent = React.useCallback(
    (props: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) => (
      <TimelineTooltipBody
        active={props.active}
        payload={props.payload}
        currency={currency}
        allBuys={allBuys}
        allSells={allSells}
      />
    ),
    [currency, allBuys, allSells]
  );

  if (!hasData) {
    return <div className="text-sm text-zinc-500">ยังไม่มีข้อมูลในช่วงเวลานี้</div>;
  }

  return (
    <div className="grid gap-3">
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
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[11px] text-zinc-500">คำอธิบาย:</span>
          <Button
            type="button"
            variant={tooltipTrigger === "hover" ? "secondary" : "ghost"}
            className="h-7 rounded-lg px-2.5 text-[11px] shadow-none"
            aria-pressed={tooltipTrigger === "hover"}
            onClick={() => setTooltipTrigger("hover")}
          >
            เลื่อนชี้
          </Button>
          <Button
            type="button"
            variant={tooltipTrigger === "click" ? "secondary" : "ghost"}
            className="h-7 rounded-lg px-2.5 text-[11px] shadow-none"
            aria-pressed={tooltipTrigger === "click"}
            onClick={() => setTooltipTrigger("click")}
          >
            คลิกตรึง
          </Button>
        </div>
      </div>
      {tooltipTrigger === "click" ? (
        <p className="text-center text-[11px] text-zinc-500 sm:text-left">
          คลิกบนเส้นหรือจุดซื้อ/ขายเพื่อเปิด — คลิกจุดอื่นเพื่อย้าย — คลิกพื้นที่ว่างของกราฟเพื่อปิด
        </p>
      ) : null}

      <div
        style={{ height }}
        className="outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-wrapper:focus-visible]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-surface:focus-visible]:outline-none [&_.recharts-surface>svg]:outline-none [&_.recharts-surface>svg:focus]:outline-none"
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
            <CartesianGrid stroke="rgba(24,24,27,0.06)" strokeDasharray="4 6" vertical={false} />
            <XAxis
              type="number"
              dataKey="ts"
              domain={xDomain}
              ticks={xTicks}
              scale="time"
              tick={{ fill: "rgb(113,113,122)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => new Date(Number(v)).toLocaleDateString("th-TH")}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              type="number"
              tick={{ fill: "rgb(113,113,122)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatMoney(Number(v), currency)}
              width={76}
            />
            <Tooltip
              content={tooltipContent}
              trigger={tooltipTrigger}
              cursor={{ stroke: "rgba(113,113,122,0.35)", strokeWidth: 1, strokeDasharray: "4 4" }}
              isAnimationActive={false}
              animationDuration={0}
              offset={18}
              allowEscapeViewBox={{ x: true, y: true }}
              shared={false}
              wrapperStyle={{
                pointerEvents: tooltipTrigger === "click" ? "auto" : "none",
                zIndex: 20
              }}
            />
            {series.length > 1 ? (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 4 }}
                formatter={(value: string) => (
                  <span className="text-[11px] font-medium text-zinc-500">{value}</span>
                )}
              />
            ) : null}

            {series.map((s) => (
              <Line
                key={`line-${s.assetName}`}
                type="natural"
                dataKey={s.assetName}
                name={s.assetName}
                stroke={s.color}
                strokeWidth={3.25}
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

            {allBuys.length > 0 && (
              <Scatter
                data={allBuys}
                dataKey="value"
                name="ซื้อ"
                fill={BUY_FILL}
                shape={BuyDot}
                activeShape={ActiveBuyDot}
                isAnimationActive={false}
              />
            )}

            {allSells.length > 0 && (
              <Scatter
                data={allSells}
                dataKey="value"
                name="ขาย"
                fill={SELL_FILL}
                shape={SellDot}
                activeShape={ActiveSellDot}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
