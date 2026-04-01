"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useCurrency } from "@/store/useCurrency";
import { formatMoney } from "@/lib/format";
import type { RangePreset } from "@/lib/assetTimeline";
import { endOfDay, endOfMonth, startOfDay } from "@/lib/assetTimeline";
import { buildTradeClusters } from "./assetTimelineChartModel";
import {
  ASSET_TIMELINE_TRADE_LEGEND_NAME,
  buildAssetTimelineEChartsOption,
} from "./buildAssetTimelineEChartsOption";
import type { AssetSeries } from "./assetTimelineTypes";

export {
  SERIES_COLORS,
  type AssetSeries,
  type ChartPointPayload,
  type PositionPoint,
  type TradePoint,
} from "./assetTimelineTypes";

export const TRADE_SCATTER_LEGEND_KEY = "__trade_scatter__";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const BUY_FILL = "#22c55e";
const SELL_FILL = "#f43f5e";

export function AssetValueTimelineLine({
  series,
  height = 400,
  rangePreset,
  from,
  to,
  locale = "th",
  showTradeLegend = true,
  showArea = false,
  yDomain,
  showZeroLine = false,
  valueLabelBySeries,
}: {
  series: AssetSeries[];
  height?: number;
  rangePreset?: RangePreset;
  from?: Date | null;
  to?: Date | null;
  locale?: "th" | "en";
  showTradeLegend?: boolean;
  showArea?: boolean;
  yDomain?: [number | "auto", number | "auto"];
  showZeroLine?: boolean;
  valueLabelBySeries?: Record<string, string>;
}) {
  const { currency } = useCurrency();

  const [legendHidden, setLegendHidden] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const names = new Set(series.map((s) => s.assetName));
    setLegendHidden((prev) => {
      const next = new Set<string>();
      for (const k of prev) {
        if (k === TRADE_SCATTER_LEGEND_KEY || names.has(k)) next.add(k);
      }
      return next;
    });
  }, [series]);

  const hasData = series.some(
    (s) => s.points.length > 0 || s.buys.length > 0 || s.sells.length > 0,
  );

  const xDomain = React.useMemo<[number, number]>(() => {
    let dataMin = Infinity;
    let dataMax = -Infinity;
    for (const s of series) {
      for (const p of [...s.points, ...s.buys, ...s.sells]) {
        if (p.ts < dataMin) dataMin = p.ts;
        if (p.ts > dataMax) dataMax = p.ts;
      }
    }
    if (dataMin === Infinity) {
      dataMin = 0;
      dataMax = 0;
    }
    if (dataMax === -Infinity) dataMax = dataMin;

    const hasFrom = from instanceof Date && Number.isFinite(from.getTime());
    const hasTo = to instanceof Date && Number.isFinite(to.getTime());
    if (!hasFrom && !hasTo) {
      return [dataMin, dataMax];
    }

    const rangeStart = hasFrom ? startOfDay(from!).getTime() : dataMin;
    let rangeEnd = hasTo ? endOfDay(to!).getTime() : dataMax;
    if (hasFrom && !hasTo) rangeEnd = dataMax;

    const rangeSpan = Math.max(rangeEnd - rangeStart, 60_000);
    const tailPad = Math.min(
      Math.max(rangeSpan * 0.04, 24 * 60 * 60 * 1000),
      7 * 24 * 60 * 60 * 1000,
    );
    const lastTs = dataMax;
    const nearRangeEnd = lastTs >= rangeEnd - tailPad;
    const cappedEnd = nearRangeEnd ? rangeEnd : Math.min(rangeEnd, lastTs + tailPad);
    const finalEnd = Math.max(cappedEnd, rangeStart + 60_000);
    return [rangeStart, finalEnd];
  }, [series, from, to]);

  const xAxisFormat = React.useMemo(() => {
    const [d0, d1] = xDomain;
    const start = Number(d0);
    const end = Number(d1);
    const safeStart = Number.isFinite(start) ? start : 0;
    const safeEnd = Number.isFinite(end) ? end : safeStart;
    const span = Math.max(0, safeEnd - safeStart);

    const thWeekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;
    const enWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    const weekdayLabel = (d: Date) =>
      locale === "th" ? thWeekdays[d.getDay()] : enWeekdays[d.getDay()];

    const monthLabel = (d: Date) =>
      d.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
        month: "short",
      });

    const sameDay =
      new Date(safeStart).toDateString() === new Date(safeEnd).toDateString();
    const shouldShowHours =
      rangePreset === "today" ||
      rangePreset === "yesterday" ||
      (sameDay && span <= 36 * 60 * 60 * 1000);

    return (v: number) => {
      const d = new Date(Number(v));
      if (shouldShowHours) {
        return d.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (rangePreset === "last7") {
        const wd = d.getDay();
        if (wd === 0 || wd === 6) return "";
        return weekdayLabel(d);
      }
      if (rangePreset === "last30") return String(d.getDate());
      if (rangePreset === "last90") return monthLabel(d);
      if (rangePreset === "ytd" || rangePreset === "lastYear") return monthLabel(d);
      return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US");
    };
  }, [xDomain, rangePreset, locale]);

  const allBuys = React.useMemo(() => series.flatMap((s) => s.buys), [series]);
  const allSells = React.useMemo(() => series.flatMap((s) => s.sells), [series]);
  const tradeClusters = React.useMemo(
    () => buildTradeClusters(series, allBuys, allSells),
    [series, allBuys, allSells],
  );

  const visibleTradeClusters = React.useMemo(() => {
    if (legendHidden.has(TRADE_SCATTER_LEGEND_KEY)) return [];
    return tradeClusters.filter((c) => !legendHidden.has(c.tipAsset));
  }, [tradeClusters, legendHidden]);

  const chartOption = React.useMemo(() => {
    return buildAssetTimelineEChartsOption({
      series,
      xDomain,
      xAxisLabelFormatter: xAxisFormat,
      yDomain: yDomain ?? ([0, "auto"] as const),
      showArea,
      showZeroLine,
      currency,
      formatMoney,
      allBuys,
      allSells,
      tradeClusters,
      visibleTradeClusters,
      legendHidden,
      tradeScatterLegendKey: TRADE_SCATTER_LEGEND_KEY,
      valueLabelBySeries,
    });
  }, [
    series,
    xDomain,
    xAxisFormat,
    yDomain,
    showArea,
    showZeroLine,
    currency,
    allBuys,
    allSells,
    tradeClusters,
    visibleTradeClusters,
    legendHidden,
    valueLabelBySeries,
  ]);

  const onLegendSelect = React.useCallback((e: { selected?: Record<string, boolean> }) => {
    const sel = e.selected;
    if (!sel) return;
    setLegendHidden(() => {
      const next = new Set<string>();
      for (const s of series) {
        if (sel[s.assetName] === false) next.add(s.assetName);
      }
      if (
        tradeClusters.length > 0 &&
        sel[ASSET_TIMELINE_TRADE_LEGEND_NAME] === false
      ) {
        next.add(TRADE_SCATTER_LEGEND_KEY);
      }
      return next;
    });
  }, [series, tradeClusters.length]);

  if (!hasData) {
    return (
      <div className="text-sm text-zinc-500">ยังไม่มีข้อมูลในช่วงเวลานี้</div>
    );
  }

  return (
    <div className="grid gap-3">
      {showTradeLegend ? (
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
        </div>
      ) : null}

      <div
        style={{ height }}
        className="w-full min-w-0 [&_.echarts-tooltip]:z-20"
        onMouseDown={(ev) => {
          const t = ev.target as HTMLElement | null;
          if (t?.closest("[_echarts_instance_]") || t?.closest(".echarts-for-react")) {
            ev.preventDefault();
          }
        }}
      >
        <ReactECharts
          option={chartOption}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
          opts={{ renderer: "canvas" }}
          autoResize
          onEvents={{
            legendselectchanged: onLegendSelect,
          }}
        />
      </div>
    </div>
  );
}
