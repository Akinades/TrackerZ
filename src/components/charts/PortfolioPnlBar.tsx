"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { BarSeriesOption, EChartsOption } from "echarts";
import { useBelowSm } from "@/hooks/useBelowSm";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney, formatNumber2 } from "@/lib/format";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type PnlRow = {
  name: string;
  total: number;
  realized?: number;
  unrealized?: number;
};

const COLOR_PROFIT = "#a8e6cf";
const COLOR_LOSS = "#f5b5b5";

function rowTotal(row: PnlRow): number {
  if (Number.isFinite(row.total)) return row.total;
  const r = Number.isFinite(row.realized ?? NaN) ? (row.realized as number) : 0;
  const u = Number.isFinite(row.unrealized ?? NaN) ? (row.unrealized as number) : 0;
  return r + u;
}

export function PortfolioPnlBar({ data, height }: { data: PnlRow[]; height?: number }) {
  const narrowMobile = useBelowSm();
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

  const option = React.useMemo<EChartsOption>(() => {
    const names = cleaned.map((d) => d.name);
    const barData: BarSeriesOption["data"] = cleaned.map((d) => ({
      value: d.total,
      name: d.name,
      realized: d.realized,
      unrealized: d.unrealized,
      itemStyle: {
        color: d.total >= 0 ? COLOR_PROFIT : COLOR_LOSS,
        borderRadius:
          d.total >= 0 ? ([6, 6, 0, 0] as const) : ([0, 0, 6, 6] as const),
      },
    }));

    return {
      animation: false,
      textStyle: { fontFamily: "inherit" },
      grid: {
        left: narrowMobile ? 40 : 52,
        right: narrowMobile ? 6 : 14,
        top: 16,
        bottom: narrowMobile ? 72 : 64,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(255,255,255,0.98)",
        borderColor: "#e4e4e7",
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: "#18181b", fontSize: 12 },
        formatter: (params: unknown) => {
          const arr = params as Array<{ dataIndex: number }>;
          const idx = arr[0]?.dataIndex;
          if (idx == null) return "";
          const row = cleaned[idx]!;
          const sign = row.total >= 0 ? "กำไร" : "ขาดทุน";
          return `<div style="font-weight:600;margin-bottom:4px">${row.name}</div>` +
            `<div><span style="color:#71717a">รวม (${sign}): </span><span style="font-weight:600">${formatMoney(row.total, currency)}</span></div>` +
            `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #f4f4f5;font-size:11px;color:#52525b">` +
            `ขายแล้ว: <span style="font-weight:500">${formatMoney(row.realized, currency)}</span><br/>` +
            `ค้างตามตลาด: <span style="font-weight:500">${formatMoney(row.unrealized, currency)}</span>` +
            `</div>`;
        },
      },
      xAxis: {
        type: "category",
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#52525b",
          fontSize: 10,
          rotate: narrowMobile ? 32 : 28,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#71717a",
          fontSize: narrowMobile ? 10 : 11,
          formatter: (v: number) => formatNumber2(v, "th-TH"),
        },
        splitLine: {
          lineStyle: { color: "rgba(24,24,27,0.06)", type: "dashed" },
        },
      },
      series: [
        {
          type: "bar",
          name: "รวม",
          barMaxWidth: 48,
          barCategoryGap: "18%",
          data: barData,
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: "rgb(180,180,187)", width: 1 },
            data: [{ yAxis: 0 }],
          },
        },
      ],
    };
  }, [cleaned, currency, narrowMobile]);

  if (cleaned.length === 0) {
    return (
      <div className="text-sm text-zinc-400">
        ยังไม่มีข้อมูลกำไร/ขาดทุน — ต้องมีรายการซื้อขาย หรือกำไรค้างจากราคาตลาด
      </div>
    );
  }

  return (
    <div className="grid w-full min-w-0 gap-2">
      <div className="flex flex-col gap-2 text-xs text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
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
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
          opts={{ renderer: "canvas" }}
          autoResize
        />
      </div>
    </div>
  );
}
