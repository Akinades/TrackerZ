"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type PnlRow = {
  name: string;
  realized: number;
  unrealized: number;
};

function formatNumber(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(v);
}

export function PortfolioPnlBar({ data, height = 320 }: { data: PnlRow[]; height?: number }) {
  const cleaned = React.useMemo(
    () =>
      data
        .filter((d) => d && d.name && (d.realized !== 0 || d.unrealized !== 0))
        .map((d) => ({
          name: d.name,
          realized: Number.isFinite(d.realized) ? d.realized : 0,
          unrealized: Number.isFinite(d.unrealized) ? d.unrealized : 0
        })),
    [data]
  );

  if (cleaned.length === 0) {
    return <div className="text-sm text-zinc-400">ยังไม่มีข้อมูล P/L (ลองใส่ราคาปัจจุบันก่อน)</div>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={cleaned} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="rgba(63,63,70,0.5)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgb(161,161,170)", fontSize: 12 }}
            axisLine={{ stroke: "rgb(39,39,42)" }}
            tickLine={{ stroke: "rgb(39,39,42)" }}
          />
          <YAxis
            tick={{ fill: "rgb(161,161,170)", fontSize: 12 }}
            axisLine={{ stroke: "rgb(39,39,42)" }}
            tickLine={{ stroke: "rgb(39,39,42)" }}
            tickFormatter={(v) => formatNumber(Number(v))}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const v = typeof value === "number" ? value : Number(value);
              return [formatNumber(v), String(name)];
            }}
            contentStyle={{
              background: "rgba(9,9,11,0.9)",
              border: "1px solid rgb(39,39,42)",
              borderRadius: 12
            }}
          />
          <Legend
            formatter={(value: string) => <span className="text-xs text-zinc-300">{value}</span>}
          />
          <Bar dataKey="realized" name="Realized" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="unrealized" name="Unrealized" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

