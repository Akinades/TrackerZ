import type { EChartsOption, LineSeriesOption, ScatterSeriesOption } from "echarts";
import type { AppCurrency } from "@/store/useCurrency";
import type { AssetSeries } from "./assetTimelineTypes";
import type { TradeClusterPoint } from "./assetTimelineChartModel";
import { formatAssetTimelineAxisTooltipHtml } from "./assetTimelineTooltipHtml";

const TRADE_LEGEND = "ซื้อ/ขาย";

function scatterColor(c: TradeClusterPoint): string {
  const sells = Number(c.sellCount) || 0;
  const buys = Number(c.buyCount) || 0;
  if (sells > 0) return "#f43f5e";
  if (buys > 0) return "#22c55e";
  return "#0f172a";
}

export type BuildAssetTimelineEChartsInput = {
  series: AssetSeries[];
  xDomain: [number, number];
  xAxisLabelFormatter: (v: number) => string;
  yDomain?: [number | "auto", number | "auto"];
  showArea: boolean;
  showZeroLine: boolean;
  currency: AppCurrency;
  formatMoney: (n: number, c: AppCurrency) => string;
  allBuys: readonly import("./assetTimelineTypes").TradePoint[];
  allSells: readonly import("./assetTimelineTypes").TradePoint[];
  tradeClusters: TradeClusterPoint[];
  visibleTradeClusters: TradeClusterPoint[];
  legendHidden: ReadonlySet<string>;
  tradeScatterLegendKey: string;
  valueLabelBySeries?: Record<string, string>;
};

export function buildAssetTimelineEChartsOption(
  input: BuildAssetTimelineEChartsInput,
): EChartsOption {
  const {
    series,
    xDomain,
    xAxisLabelFormatter,
    yDomain,
    showArea,
    showZeroLine,
    currency,
    formatMoney,
    allBuys,
    allSells,
    tradeClusters,
    visibleTradeClusters,
    legendHidden,
    tradeScatterLegendKey,
    valueLabelBySeries,
  } = input;

  const [xMin, xMax] = xDomain;

  const legendNames = series.map((s) => s.assetName);
  if (visibleTradeClusters.length > 0) legendNames.push(TRADE_LEGEND);

  const selected: Record<string, boolean> = {};
  for (const s of series) {
    selected[s.assetName] = !legendHidden.has(s.assetName);
  }
  if (visibleTradeClusters.length > 0) {
    selected[TRADE_LEGEND] = !legendHidden.has(tradeScatterLegendKey);
  }

  const lineSeries: LineSeriesOption[] = series.map((s, si) => {
    const base: LineSeriesOption = {
      type: "line",
      name: s.assetName,
      showSymbol: false,
      smooth: 0.4,
      lineStyle: { width: 2.5, color: s.color },
      emphasis: { focus: "series", blurScope: "global" },
      data: s.points.map((p) => [p.ts, p.value] as [number, number]),
    };
    if (showArea) {
      base.areaStyle = {
        color: s.color,
        opacity: series.length > 1 ? 0.08 : 0.12,
      };
    }
    if (showZeroLine && si === 0) {
      base.markLine = {
        silent: true,
        symbol: "none",
        lineStyle: { color: "rgba(113,113,122,0.35)", type: "dashed" },
        data: [{ yAxis: 0 }],
      };
    }
    return base;
  });

  const scatterSeries: ScatterSeriesOption[] =
    visibleTradeClusters.length > 0
      ? [
          {
            type: "scatter",
            name: TRADE_LEGEND,
            symbolSize: 14,
            z: 10,
            data: visibleTradeClusters.map((c) => ({
              value: [c.ts, c.value] as [number, number],
              itemStyle: { color: scatterColor(c), borderColor: "#fff", borderWidth: 2 },
            })),
          },
        ]
      : [];

  const yMin = yDomain?.[0];
  const yMax = yDomain?.[1];

  return {
    animation: false,
    textStyle: { fontFamily: "inherit" },
    grid: {
      left: 72,
      right: 16,
      top: series.length > 1 ? 44 : 28,
      bottom: 28,
      containLabel: false,
    },
    legend:
      series.length > 1
        ? {
            type: "scroll",
            orient: "horizontal",
            right: 8,
            top: 0,
            data: legendNames,
            selected,
            textStyle: { fontSize: 11, color: "#71717a" },
            itemWidth: 14,
            itemHeight: 8,
          }
        : undefined,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgba(113,113,122,0.35)", width: 1, type: "dashed" },
      },
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
      formatter: (params: unknown) => {
        const list = params as
          | Array<{
              axisValue?: number | string;
              value?: [number, number] | number;
            }>
          | undefined;
        if (!list?.length) return "";
        const p0 = list[0]!;
        let ts: number;
        if (Array.isArray(p0.value) && typeof p0.value[0] === "number") {
          ts = p0.value[0];
        } else if (typeof p0.axisValue === "number") {
          ts = p0.axisValue;
        } else if (typeof p0.axisValue === "string") {
          ts = new Date(p0.axisValue).getTime();
        } else {
          return "";
        }
        return formatAssetTimelineAxisTooltipHtml({
          ts,
          series,
          allBuys,
          allSells,
          tradeClusters,
          legendHidden,
          formatMoney,
          currency,
          valueLabelBySeries,
        });
      },
    },
    xAxis: {
      type: "time",
      min: xMin,
      max: xMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (v: string | number) => xAxisLabelFormatter(Number(v)),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: yMin === "auto" || yMin === undefined ? undefined : yMin,
      max: yMax === "auto" || yMax === undefined ? undefined : yMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (v: number) => formatMoney(v, currency),
      },
      splitLine: {
        lineStyle: { color: "rgba(24,24,27,0.06)", type: "dashed" },
      },
    },
    series: [...lineSeries, ...scatterSeries],
  };
}

export { TRADE_LEGEND as ASSET_TIMELINE_TRADE_LEGEND_NAME };
