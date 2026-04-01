"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import { useBelowSm } from "@/hooks/useBelowSm";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney, formatNumber2 } from "@/lib/format";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type PieSlice = {
  name: string;
  value: number;
};

const COLORS = [
  "#86efac",
  "#93c5fd",
  "#fcd34d",
  "#f9a8d4",
  "#c4b5fd",
  "#5eead4",
  "#fda4af",
  "#bef264",
];

export function PortfolioPie({
  data,
  height = 420,
}: {
  data: PieSlice[];
  height?: number;
}) {
  const compact = useBelowSm();
  const { currency } = useCurrency();
  const cleaned = React.useMemo(
    () => data.filter((d) => Number.isFinite(d.value) && d.value > 0),
    [data],
  );
  const total = React.useMemo(
    () => cleaned.reduce((s, d) => s + d.value, 0),
    [cleaned],
  );

  const option = React.useMemo<EChartsOption>(() => {
    const pieData = cleaned.map((d, idx) => ({
      name: d.name,
      value: d.value,
      itemStyle: {
        color: COLORS[idx % COLORS.length],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    }));

    return {
      animation: false,
      textStyle: { fontFamily: "inherit" },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#e4e4e7",
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: "#18181b", fontSize: 13 },
        formatter: (p) => {
          const param = p as { name: string; value: number };
          const v = Number(param.value);
          const pct = total > 0 ? (v / total) * 100 : 0;
          return `${param.name}<br/><span style="font-weight:600">${formatMoney(v, currency)}</span> (${formatNumber2(pct, "th-TH")}%)`;
        },
      },
      legend: compact
        ? {
            type: "scroll",
            orient: "horizontal",
            bottom: 2,
            left: "center",
            width: "96%",
            icon: "circle",
            itemWidth: 10,
            itemHeight: 10,
            itemGap: 10,
            textStyle: { fontSize: 13, color: "#3f3f46" },
          }
        : {
            type: "scroll",
            orient: "vertical",
            right: "2%",
            top: "middle",
            icon: "circle",
            itemWidth: 10,
            itemHeight: 10,
            textStyle: { fontSize: 14, color: "#3f3f46" },
          },
      series: [
        {
          type: "pie",
          radius: compact ? "58%" : "68%",
          // ~44% offsets the right-side legend so the pie reads centered in the full card.
          center: compact ? ["50%", "44%"] : ["44%", "50%"],
          padAngle: 1,
          avoidLabelOverlap: true,
          label: {
            show: !compact,
            formatter: "{b}\n{d}%",
            fontSize: 12,
            color: "#52525b",
          },
          labelLine: { show: !compact, length: 12, length2: 10 },
          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(0,0,0,0.12)",
            },
          },
          data: pieData,
        },
      ],
    };
  }, [cleaned, compact, currency, total]);

  if (cleaned.length === 0) {
    return <div className="text-sm text-zinc-500">ยังไม่มีข้อมูลมูลค่าปัจจุบัน (ใส่ราคาให้ครบก่อน)</div>;
  }

  const chartHeight = compact ? Math.max(height, 360) : height;

  return (
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
  );
}
