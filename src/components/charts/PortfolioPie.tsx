"use client";

import * as React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type PieSlice = {
  name: string;
  value: number;
};

const COLORS = [
  "#22c55e", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#a855f7", // purple
  "#14b8a6", // teal
  "#e11d48", // rose
  "#eab308" // yellow
];

function formatNumber(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(v);
}

export function PortfolioPie({
  data,
  height = 260
}: {
  data: PieSlice[];
  height?: number;
}) {
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
        <PieChart>
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
              return [`${formatNumber(v)} (${formatNumber(pct)}%)`, String(name)];
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

