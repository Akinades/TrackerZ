"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney, formatNumber2 } from "@/lib/format";

export type PnlRow = {
  name: string;
  /** ผลรวมกำไร/ขาดทุนต่อสินทรัพย์ = ขายแล้ว + ค้างตามตลาด (สกุลเงินที่แสดง) */
  total: number;
  /** รายละเอียดใน tooltip */
  realized?: number;
  unrealized?: number;
};

/** โทนพาสเทล — ไม่เข้ม */
const COLOR_PROFIT = "#a8e6cf";
const COLOR_LOSS = "#f5b5b5";

function rowTotal(row: PnlRow): number {
  if (Number.isFinite(row.total)) return row.total;
  const r = Number.isFinite(row.realized ?? NaN) ? (row.realized as number) : 0;
  const u = Number.isFinite(row.unrealized ?? NaN) ? (row.unrealized as number) : 0;
  return r + u;
}

export function PortfolioPnlBar({ data, height }: { data: PnlRow[]; height?: number }) {
  const { currency } = useCurrency();
  const cleaned = React.useMemo(() => {
    return data
      .filter((d) => d && d.name)
      .map((d) => {
        const realized = Number.isFinite(d.realized ?? NaN) ? (d.realized as number) : 0;
        const unrealized = Number.isFinite(d.unrealized ?? NaN) ? (d.unrealized as number) : 0;
        const total = rowTotal(d);
        return { name: d.name, total, realized, unrealized };
      })
      .filter((d) => d.total !== 0 || d.realized !== 0 || d.unrealized !== 0);
  }, [data]);

  const chartHeight = React.useMemo(() => {
    if (typeof height === "number" && height > 0) return height;
    return 340;
  }, [height]);

  if (cleaned.length === 0) {
    return (
      <div className="text-sm text-zinc-400">
        ยังไม่มีข้อมูลกำไร/ขาดทุน — ต้องมีรายการซื้อขาย หรือกำไรค้างจากราคาตลาด
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm border border-zinc-200/80"
            style={{ background: COLOR_PROFIT }}
          />
          <span className="text-[#4a8f72]">กำไรรวม (บวก)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm border border-zinc-200/80"
            style={{ background: COLOR_LOSS }}
          />
          <span className="text-[#b56b6b]">ขาดทุนรวม (ลบ)</span>
        </span>
        <span className="text-zinc-500">แท่งแนวตั้ง = ขายแล้ว + ค้างตามราคาตลาด</span>
      </div>

      <div style={{ height: chartHeight }} className="w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer={false}
            data={cleaned}
            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
            barCategoryGap="14%"
          >
            <CartesianGrid stroke="rgba(24,24,27,0.06)" strokeDasharray="4 5" vertical={false} />
            <XAxis
              dataKey="name"
              type="category"
              tick={{ fill: "rgb(82,82,91)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-28}
              textAnchor="end"
              height={62}
            />
            <YAxis
              type="number"
              tick={{ fill: "rgb(113,113,122)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatNumber2(Number(v), "th-TH")}
              width={44}
            />
            <ReferenceLine y={0} stroke="rgb(180,180,187)" strokeWidth={1} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as {
                  name: string;
                  total: number;
                  realized: number;
                  unrealized: number;
                };
                const sign = row.total >= 0 ? "กำไร" : "ขาดทุน";
                return (
                  <div
                    className="rounded-xl border border-zinc-200 bg-white/98 px-3 py-2 text-xs shadow-sm"
                    style={{ color: "rgb(24,24,27)" }}
                  >
                    <div className="font-semibold text-zinc-900">{row.name}</div>
                    <div className="mt-1">
                      <span className="text-zinc-500">รวม ({sign}): </span>
                      <span className="font-medium tabular-nums">
                        {formatMoney(row.total, currency)}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 border-t border-zinc-100 pt-1 text-zinc-600">
                      <div>
                        ขายแล้ว:{" "}
                        <span className="tabular-nums">{formatMoney(row.realized, currency)}</span>
                      </div>
                      <div>
                        ค้างตามตลาด:{" "}
                        <span className="tabular-nums">{formatMoney(row.unrealized, currency)}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="total" name="รวม" radius={[6, 6, 6, 6]} maxBarSize={48}>
              {cleaned.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}-${index}`}
                  fill={entry.total >= 0 ? COLOR_PROFIT : COLOR_LOSS}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
