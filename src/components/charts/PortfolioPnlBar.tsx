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
import { useCurrency } from "@/store/useCurrency";
import { formatMoney, formatNumber2 } from "@/lib/format";

export type PnlRow = {
  name: string;
  realized: number;
  unrealized: number;
};

export function PortfolioPnlBar({ data, height = 320 }: { data: PnlRow[]; height?: number }) {
  const { currency } = useCurrency();
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
        <BarChart
          data={cleaned}
          margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
          barGap={6}
          barCategoryGap={cleaned.length <= 3 ? "60%" : "28%"}
        >
          <CartesianGrid stroke="rgba(24,24,27,0.08)" strokeDasharray="4 6" />
          <XAxis
            type="category"
            dataKey="name"
            scale="band"
            interval={0}
            tick={{ fill: "rgb(113,113,122)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            type="number"
            tick={{ fill: "rgb(113,113,122)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatNumber2(Number(v), "th-TH")}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const v = typeof value === "number" ? value : Number(value);
              return [formatMoney(v, currency), String(name)];
            }}
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
          <Bar dataKey="realized" name="Realized" fill="#86efac" radius={[6, 6, 0, 0]} barSize={14} />
          <Bar dataKey="unrealized" name="Unrealized" fill="#c4b5fd" radius={[6, 6, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

