"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber2 } from "@/lib/format";

/** กราฟแท่งแนวนอน: แต่ละแถว = Buy หรือ Sell */
export function BuySellCountBar({
  buyCount,
  sellCount,
  height = 140,
}: {
  buyCount: number;
  sellCount: number;
  height?: number;
}) {
  const data = React.useMemo(
    () => [
      { name: "Buy (ซื้อ)", จำนวน: buyCount, fill: "rgb(52 211 153)" },
      { name: "Sell (ขาย)", จำนวน: sellCount, fill: "rgb(248 113 113)" },
    ],
    [buyCount, sellCount],
  );

  const maxVal = Math.max(buyCount, sellCount, 1);

  return (
    <div style={{ height }} className="w-full min-w-0 max-w-xl">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke="rgba(24,24,27,0.06)" strokeDasharray="4 6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, maxVal]}
            allowDecimals={false}
            tick={{ fill: "rgb(113,113,122)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ fill: "rgb(82,82,91)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [
              formatNumber2(typeof v === "number" ? v : Number(v), "th-TH"),
              "รายการ",
            ]}
            contentStyle={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgb(228,228,231)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey="จำนวน" radius={[0, 8, 8, 0]} barSize={26}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
