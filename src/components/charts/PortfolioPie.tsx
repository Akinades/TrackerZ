"use client";

import * as React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney, formatNumber2 } from "@/lib/format";

export type PieSlice = {
  name: string;
  value: number;
};

const COLORS = [
  "#86efac", // emerald-300
  "#93c5fd", // blue-300
  "#fcd34d", // amber-300
  "#f9a8d4", // pink-300
  "#c4b5fd", // violet-300
  "#5eead4", // teal-300
  "#fda4af", // rose-300
  "#bef264" // lime-300
];

export function PortfolioPie({
  data,
  height = 260
}: {
  data: PieSlice[];
  height?: number;
}) {
  const { currency } = useCurrency();
  const cleaned = React.useMemo(
    () => data.filter((d) => Number.isFinite(d.value) && d.value > 0),
    [data]
  );
  const total = React.useMemo(
    () => cleaned.reduce((s, d) => s + d.value, 0),
    [cleaned]
  );

  if (cleaned.length === 0) {
    return <div className="text-sm text-zinc-500">ยังไม่มีข้อมูลมูลค่าปัจจุบัน (ใส่ราคาให้ครบก่อน)</div>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer={false}>
          <Pie
            data={cleaned}
            dataKey="value"
            nameKey="name"
            innerRadius={0}
            outerRadius={105}
            paddingAngle={1}
            stroke="#ffffff"
            strokeWidth={3}
            isAnimationActive={false}
          >
            {cleaned.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const v = typeof value === "number" ? value : Number(value);
              const pct = total > 0 ? (v / total) * 100 : 0;
              return [`${formatMoney(v, currency)} (${formatNumber2(pct, "th-TH")}%)`, String(name)];
            }}
            contentStyle={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgb(228,228,231)",
              borderRadius: 12
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string) => (
              <span className="text-xs text-zinc-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

