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
import { useCurrency } from "@/store/useCurrency";
import { formatMoney, formatNumber2 } from "@/lib/format";

export const SERIES_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16"  // lime
];

export type AssetSeries = {
  assetName: string;
  color: string;
  /** Timeline points: one per transaction, value = qty * lastPrice for this asset */
  points: { ts: number; value: number }[];
  /** Buy event positions on the line */
  buys: { ts: number; value: number }[];
  /** Sell event positions on the line */
  sells: { ts: number; value: number }[];
};

export function AssetValueTimelineLine({
  series,
  height = 360
}: {
  series: AssetSeries[];
  height?: number;
}) {
  const { currency } = useCurrency();

  const hasData = series.some((s) => s.points.length > 0);

  // Compute x domain from all data points across all series
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

  // Recharts can emit duplicate axis tick keys when many series share identical timestamps.
  // Build explicit unique ticks to keep React keys stable.
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

  // Merge all buy/sell events into single scatter datasets (shared BUY/SELL legend)
  const allBuys = React.useMemo(() => series.flatMap((s) => s.buys), [series]);
  const allSells = React.useMemo(() => series.flatMap((s) => s.sells), [series]);

  if (!hasData) {
    return <div className="text-sm text-zinc-500">ยังไม่มีข้อมูลในช่วงเวลานี้</div>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="rgba(24,24,27,0.08)" strokeDasharray="4 6" />
          <XAxis
            type="number"
            dataKey="ts"
            domain={xDomain}
            ticks={xTicks}
            scale="time"
            tick={{ fill: "rgb(113,113,122)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Date(Number(v)).toLocaleDateString("th-TH")}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            type="number"
            tick={{ fill: "rgb(113,113,122)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatNumber2(Number(v), "th-TH")}
            width={72}
          />
          <Tooltip
            labelFormatter={(label) =>
              new Date(Number(label)).toLocaleString("th-TH", { hour12: false })
            }
            formatter={(value, name) => [formatMoney(Number(value), currency), String(name)]}
            contentStyle={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgb(228,228,231)",
              borderRadius: 12,
              color: "rgb(24,24,27)"
            }}
          />
          <Legend
            formatter={(value: string) => <span className="text-xs text-zinc-600">{value}</span>}
          />

          {/* One line per asset */}
          {series.map((s) => (
            <Line
              key={`line-${s.assetName}`}
              data={s.points}
              type="monotone"
              dataKey="value"
              name={s.assetName}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}

          {/* BUY markers across all assets (green circle) */}
          {allBuys.length > 0 && (
            <Scatter
              data={allBuys}
              dataKey="value"
              name="BUY"
              fill="#10b981"
              isAnimationActive={false}
            />
          )}

          {/* SELL markers across all assets (red) */}
          {allSells.length > 0 && (
            <Scatter
              data={allSells}
              dataKey="value"
              name="SELL"
              fill="#f43f5e"
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
