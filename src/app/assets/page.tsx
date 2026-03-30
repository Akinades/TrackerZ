"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/useAuth";
import { DEFAULT_TX_CURRENCY, useCurrency } from "@/store/useCurrency";
import { useFxRate } from "@/store/useFxRate";
import { mapTx, useTransactions } from "@/store/useTransactions";
import type { Transaction } from "@/types/transactions";
import { txExecutedAtIso, txExecutedAtMs } from "@/lib/transactionTime";
import {
  buildTimelines,
  daysAgo,
  endOfDay,
  limitAllAssetSeriesForChart,
  ALL_ASSETS_CHART_MAX_LINES,
  startOfDay,
  startOfYear,
  toDateInputValue,
  type RangePreset,
} from "@/lib/assetTimeline";
import { AssetsTimelineFilters } from "@/components/assets/AssetsTimelineFilters";
import { AssetsTimelineChartBody } from "@/components/assets/AssetsTimelineChartBody";
import { AssetsRangeSummary } from "@/components/assets/AssetsRangeSummary";
import { useI18n } from "@/components/shared/I18nProvider";

export default function AssetsTimelinePage() {
  const router = useRouter();
  const { user, hydrated: authHydrated } = useAuth();
  const { t, locale } = useI18n();

  React.useEffect(() => {
    if (!authHydrated) return;
    if (!user) router.replace("/");
  }, [authHydrated, user, router]);
  const { currency } = useCurrency();
  const { usdThb } = useFxRate();
  const { txs, hydrated, error } = useTransactions();
  const fx = React.useMemo(
    () => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36),
    [usdThb],
  );

  const toDisplayMoney = React.useCallback(
    (value: number, from?: "THB" | "USD", _fxAtTrade?: number) => {
      const src = from ?? DEFAULT_TX_CURRENCY;
      const rate = fx;
      if (src === currency) return value;
      if (src === "USD" && currency === "THB") return value * rate;
      if (src === "THB" && currency === "USD") return value / rate;
      return value;
    },
    [currency, fx],
  );
  const [assetTxs, setAssetTxs] = React.useState<Transaction[]>([]);
  const [assetLoading, setAssetLoading] = React.useState(false);
  const [assetError, setAssetError] = React.useState<string | null>(null);
  const [showAssetsSummary, setShowAssetsSummary] = React.useState(true);

  const sortedAll = React.useMemo(
    () => [...txs].sort((a, b) => txExecutedAtMs(a) - txExecutedAtMs(b)),
    [txs],
  );
  const oldest = React.useMemo(
    () => (sortedAll[0] ? new Date(txExecutedAtIso(sortedAll[0])) : null),
    [sortedAll],
  );
  const newest = React.useMemo(
    () =>
      sortedAll[sortedAll.length - 1]
        ? new Date(txExecutedAtIso(sortedAll[sortedAll.length - 1]))
        : null,
    [sortedAll],
  );

  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [rangePreset, setRangePreset] = React.useState<RangePreset>("");
  const [asset, setAsset] = React.useState<string>("__all__");
  const [showAllChartLines, setShowAllChartLines] = React.useState(false);

  React.useEffect(() => {
    if (asset !== "__all__") setShowAllChartLines(false);
  }, [asset]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (asset === "__all__") {
      setAssetTxs([]);
      setAssetLoading(false);
      setAssetError(null);
      return;
    }

    let mounted = true;
    setAssetLoading(true);
    setAssetError(null);

    (async () => {
      const res = await fetch(
        `/api/transactions/asset/${encodeURIComponent(asset)}`,
        {
          method: "GET",
        },
      ).catch(() => null);
      const json = res ? await res.json().catch(() => null) : null;
      if (!mounted) return;

      if (!res || !res.ok) {
        setAssetError(
          (json as any)?.message ||
            (json as any)?.error ||
            t("assets.loadFailed"),
        );
        setAssetTxs([]);
        setAssetLoading(false);
        return;
      }

      const list = (json as any)?.transactions ?? json;
      const mapped = Array.isArray(list)
        ? (list.map(mapTx).filter(Boolean) as Transaction[])
        : [];
      setAssetTxs(mapped);
      setAssetLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [asset, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!oldest || !newest) return;
    if (!rangePreset) {
      setFrom((prev) => (prev ? prev : toDateInputValue(oldest)));
      setTo((prev) => (prev ? prev : toDateInputValue(newest)));
    }
  }, [hydrated, oldest, newest, rangePreset]);

  const applyPreset = React.useCallback(
    (preset: RangePreset) => {
      const now = new Date();
      if (preset === "all") {
        setFrom(oldest ? toDateInputValue(oldest) : "");
        setTo(newest ? toDateInputValue(newest) : "");
        return;
      }
      if (preset === "today") {
        setFrom(toDateInputValue(now));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "yesterday") {
        const y = daysAgo(1);
        setFrom(toDateInputValue(y));
        setTo(toDateInputValue(y));
        return;
      }
      if (preset === "last7") {
        setFrom(toDateInputValue(daysAgo(6)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last30") {
        setFrom(toDateInputValue(daysAgo(29)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last90") {
        setFrom(toDateInputValue(daysAgo(89)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "ytd") {
        setFrom(toDateInputValue(startOfYear(now)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last365") {
        setFrom(toDateInputValue(daysAgo(364)));
        setTo(toDateInputValue(now));
      }
    },
    [newest, oldest],
  );

  const sourceTxs = asset === "__all__" ? txs : assetTxs;

  const filteredTxs = React.useMemo(() => {
    if (!from && !to) return sourceTxs;
    const fromD = from ? startOfDay(new Date(from)) : null;
    const toD = to ? endOfDay(new Date(to)) : null;
    return sourceTxs.filter((t) => {
      const d = new Date(txExecutedAtIso(t));
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    });
  }, [sourceTxs, from, to]);

  const assetOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const t of txs) if (t.assetName) set.add(t.assetName);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [txs]);

  const series = React.useMemo(
    () => buildTimelines(filteredTxs, asset, toDisplayMoney),
    [filteredTxs, asset, toDisplayMoney],
  );

  const wouldSimplifyChart =
    asset === "__all__" && series.length > ALL_ASSETS_CHART_MAX_LINES;

  const chartSeries = React.useMemo(() => {
    if (asset !== "__all__" || showAllChartLines) return series;
    return limitAllAssetSeriesForChart(series).series;
  }, [asset, showAllChartLines, series]);

  const handleRangePresetChange = React.useCallback(
    (v: RangePreset) => {
      setRangePreset(v);
      if (!v) return;
      applyPreset(v);
    },
    [applyPreset],
  );

  if (authHydrated && !user) {
    return null;
  }

  const chartBlocked =
    !hydrated ||
    (asset !== "__all__" && assetLoading) ||
    Boolean(assetError) ||
    Boolean(error) ||
    filteredTxs.length === 0;

  return (
    <div className="fhd-text-tune mx-auto grid max-w-6xl gap-5">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("assets.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("assets.subtitlePrefix")} ({currency}) · {t("assets.subtitleGreen")} ·{" "}
          {t("assets.subtitleRed")}
        </p>
      </div>

      <Card className="overflow-hidden rounded-3xl border-zinc-200/80 p-0 shadow-sm">
        <AssetsTimelineFilters
          hydrated={hydrated}
          asset={asset}
          onAssetChange={setAsset}
          assetOptions={assetOptions}
          rangePreset={rangePreset}
          onRangePresetChange={handleRangePresetChange}
          from={from}
          onFromChange={(v) => {
            setRangePreset("");
            setFrom(v);
          }}
          to={to}
          onToChange={(v) => {
            setRangePreset("");
            setTo(v);
          }}
          oldest={oldest}
          newest={newest}
          locale={locale}
        />
        <AssetsTimelineChartBody
          hydrated={hydrated}
          assetLoading={assetLoading}
          assetNotAll={asset !== "__all__"}
          assetError={assetError}
          listError={error}
          filteredEmpty={filteredTxs.length === 0}
          series={chartSeries}
          wouldSimplifyChart={wouldSimplifyChart}
          showAllChartLines={showAllChartLines}
          onToggleShowAllChartLines={() => setShowAllChartLines((x) => !x)}
          showSummaryToggle={showAssetsSummary}
          onToggleSummary={() => setShowAssetsSummary((x) => !x)}
        />
      </Card>

      {!chartBlocked && showAssetsSummary ? (
        <Card className="overflow-hidden rounded-3xl border-zinc-200/80 p-0 shadow-sm">
          <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/60 to-white px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold text-zinc-800">
              {t("assets.rangeSummary.title")}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {t("assets.rangeSummary.subtitle")}
            </p>
          </div>
          <div className="px-4 pb-6 pt-1 sm:px-6">
            <AssetsRangeSummary
              txs={filteredTxs}
              assetFilter={asset}
              currency={currency}
              toDisplayMoney={toDisplayMoney}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
