"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { AssetValueTimelineLine } from "@/components/charts/AssetValueTimelineLine";
import {
  buildTimelines,
  buildAggregatedOthersSeries,
  endOfMonth,
  endOfPrevYear,
  monthsAgo,
  startOfMonth,
  startOfPrevYear,
  startOfYear,
} from "@/lib/assetTimeline";
import { useFxRate } from "@/store/useFxRate";
import { useI18n } from "@/components/shared/I18nProvider";
import type { Transaction } from "@/types/transactions";
import { txExecutedAtMs } from "@/lib/transactionTime";

type Props = { d: DashboardPortfolioModel };

type GrowthPreset = "m3" | "m6" | "ytd" | "lastYear";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthsBetween(from: Date, to: Date): Array<{ start: Date; end: Date }> {
  const out: Array<{ start: Date; end: Date }> = [];
  const cur = startOfMonth(from);
  const end = startOfMonth(to);
  while (cur.getTime() <= end.getTime()) {
    const s = new Date(cur);
    const e = endOfMonth(cur);
    out.push({ start: s, end: e });
    cur.setMonth(cur.getMonth() + 1, 1);
    cur.setHours(0, 0, 0, 0);
  }
  return out;
}

export function DashboardPortfolioGrowthCard({ d }: Props) {
  const { t, locale } = useI18n();
  const { usdThb } = useFxRate();
  const [preset, setPreset] = React.useState<GrowthPreset>("m3");

  const fxSpot = React.useMemo(
    () => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36),
    [usdThb],
  );

  const toDisplayMoney = React.useCallback(
    (value: number, from?: "THB" | "USD") => {
      const src = (from ?? "THB") as "THB" | "USD";
      const dst = d.currency;
      if (src === dst) return value;
      if (src === "USD" && dst === "THB") return value * fxSpot;
      if (src === "THB" && dst === "USD") return value / fxSpot;
      return value;
    },
    [d.currency, fxSpot],
  );

  const range = React.useMemo(() => {
    const now = new Date();
    if (preset === "m3") return { from: startOfMonth(monthsAgo(2, now)), to: now };
    if (preset === "m6") return { from: startOfMonth(monthsAgo(5, now)), to: now };
    if (preset === "ytd") return { from: startOfYear(now), to: now };
    return { from: startOfPrevYear(now), to: endOfPrevYear(now) };
  }, [preset]);

  const pulseSeries = React.useMemo(() => {
    const all = buildTimelines(d.txs as Transaction[], "__all__", (v, from) =>
      toDisplayMoney(v, from as any),
    );
    if (all.length === 0) return [];
    const total = buildAggregatedOthersSeries(
      all,
      t("dashboard.growth.totalLabel"),
      "#10b981",
    );

    const byMonthHasTx = new Set<string>();
    for (const tx of d.txs as Transaction[]) {
      const ms = txExecutedAtMs(tx);
      if (!Number.isFinite(ms)) continue;
      const k = monthKey(new Date(ms));
      byMonthHasTx.add(k);
    }

    // Sample total portfolio series at each month-end.
    const totalPts = total.points.slice().sort((a, b) => a.ts - b.ts);
    let j = -1;
    const points = monthsBetween(range.from, range.to).map(({ start, end }) => {
      const k = monthKey(start);
      const endMs = end.getTime();
      while (j + 1 < totalPts.length && totalPts[j + 1]!.ts <= endMs) j += 1;
      const v = j >= 0 ? totalPts[j]!.value : 0;
      return {
        // Anchor at month-start so the first month sits flush left.
        ts: start.getTime(),
        value: byMonthHasTx.has(k) ? v : 0,
        tipKind: "position" as const,
        tipAsset: t("dashboard.growth.totalLabel"),
        tipQty: 0,
      };
    });

    return [
      {
        assetName: t("dashboard.growth.totalLabel"),
        color: "#10b981",
        points,
        buys: [],
        sells: [],
      },
    ];
  }, [d.txs, range.from, range.to, t, toDisplayMoney]);

  const buySellTone = React.useMemo(() => {
    const buy = d.txBuyCount ?? 0;
    const sell = d.txSellCount ?? 0;
    if (buy === 0 && sell === 0) return null;
    if (buy >= sell * 1.6) return "accumulate" as const;
    if (sell >= buy * 1.6) return "distribute" as const;
    return "balanced" as const;
  }, [d.txBuyCount, d.txSellCount]);

  return (
    <Card>
      <div className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              {t("dashboard.growth.title")}
            </div>
            <div className="text-xs text-zinc-500">{t("dashboard.growth.subtitle")}</div>
            {d.hydrated ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs tabular-nums">
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700">
                  <span className="font-semibold text-emerald-700">
                    {t("dashboard.growth.buy")}
                  </span>
                  <span className="font-semibold">{d.txBuyCount}</span>
                  <span className="text-zinc-500">{t("dashboard.growth.times")}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700">
                  <span className="font-semibold text-rose-600">
                    {t("dashboard.growth.sell")}
                  </span>
                  <span className="font-semibold">{d.txSellCount}</span>
                  <span className="text-zinc-500">{t("dashboard.growth.times")}</span>
                </span>
                {buySellTone ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${
                      buySellTone === "accumulate"
                        ? "bg-emerald-50 text-emerald-800"
                        : buySellTone === "distribute"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {buySellTone === "accumulate"
                      ? t("dashboard.growth.toneAccumulate")
                      : buySellTone === "distribute"
                        ? t("dashboard.growth.toneDistribute")
                        : t("dashboard.growth.toneBalanced")}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="inline-flex overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium ${
                preset === "m3"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
              onClick={() => setPreset("m3")}
            >
              {t("dashboard.growth.range3m")}
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium ${
                preset === "m6"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
              onClick={() => setPreset("m6")}
            >
              {t("dashboard.growth.range6m")}
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium ${
                preset === "ytd"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
              onClick={() => setPreset("ytd")}
            >
              {t("dashboard.growth.rangeYtd")}
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium ${
                preset === "lastYear"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
              onClick={() => setPreset("lastYear")}
            >
              {t("dashboard.growth.rangeLastYear")}
            </button>
          </div>
        </div>
        {!d.hydrated ? (
          <div className="text-sm text-zinc-400">{t("common.loading")}</div>
        ) : (
          <AssetValueTimelineLine
            series={pulseSeries}
            height={320}
            rangePreset={
              preset === "ytd"
                ? "ytd"
                : preset === "lastYear"
                  ? "lastYear"
                  : "last90"
            }
            // Let the chart domain be driven by points so the first month is flush.
            from={null}
            to={null}
            locale={locale}
            showTradeLegend={false}
            showArea
          />
        )}
      </div>
    </Card>
  );
}

