"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/useAuth";
import { DEFAULT_TX_CURRENCY, useCurrency } from "@/store/useCurrency";
import { useFxRate } from "@/store/useFxRate";
import { useFxRates } from "@/store/useFxRates";
import { usePreferences } from "@/store/usePreferences";
import { usePrices } from "@/store/usePrices";
import { mapTx, useTransactions } from "@/store/useTransactions";
import type { Transaction } from "@/types/transactions";
import { txExecutedAtIso, txExecutedAtMs } from "@/lib/transactionTime";
import {
  buildTimelines,
  daysAgo,
  endOfDay,
  monthsAgo,
  startOfMonth,
  startOfPrevYear,
  endOfPrevYear,
  startOfDay,
  startOfYear,
  toDateInputValue,
  type RangePreset,
} from "@/lib/assetTimeline";
import {
  computePositionsAvgCost,
  computePositionsFifo,
  currentValue,
  investedTotal,
  realizedPnlFromPositions,
  round2,
  totalFees,
  unrealizedPnl,
} from "@/lib/calculations";
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
  const { rates } = useFxRates();
  const { usdThb } = useFxRate();
  const { prefs } = usePreferences();
  const { prices, refreshMarket, hydrated: pricesHydrated } = usePrices();
  const { txs, hydrated, error } = useTransactions();

  const toDisplayMoney = React.useCallback(
    (
      value: number,
      from?: import("@/store/useCurrency").AppCurrency,
      fxAtTrade?: number,
    ) => {
      const src = (from ??
        DEFAULT_TX_CURRENCY) as import("@/store/useCurrency").AppCurrency;
      const dst = currency;

      // Use stored trade-time FX only when it looks plausible.
      // Many historical rows may have fxRateAtTrade = 1 (default), which would otherwise block conversion.
      const fx = Number(fxAtTrade);
      if (Number.isFinite(fx) && fx > 5) {
        if (src === dst) return value;
        if (src === "USD" && dst === "THB") return value * fx;
        if (src === "THB" && dst === "USD") return value / fx;
      }

      if (src === dst) return value;
      const rSrc = src === "USD" ? 1 : Number(rates[src]);
      const rDst = dst === "USD" ? 1 : Number(rates[dst]);
      if (!Number.isFinite(rSrc) || rSrc <= 0) return value;
      if (!Number.isFinite(rDst) || rDst <= 0) return value;
      const usd = src === "USD" ? value : value / rSrc;
      return dst === "USD" ? usd : usd * rDst;
    },
    [currency, rates],
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
  }, [asset, hydrated, t]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (from || to) return;
    const now = new Date();
    setRangePreset("last30");
    setFrom(toDateInputValue(startOfMonth(now)));
    setTo(toDateInputValue(now));
  }, [hydrated, from, to]);

  const applyPreset = React.useCallback((preset: RangePreset) => {
    const now = new Date();
    if (preset === "custom" || !preset) return;
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
      setFrom(toDateInputValue(startOfMonth(now)));
      setTo(toDateInputValue(now));
      return;
    }
    if (preset === "last90") {
      setFrom(toDateInputValue(startOfMonth(monthsAgo(2, now))));
      setTo(toDateInputValue(now));
      return;
    }
    if (preset === "ytd") {
      setFrom(toDateInputValue(startOfYear(now)));
      setTo(toDateInputValue(now));
      return;
    }
    if (preset === "lastYear") {
      setFrom(toDateInputValue(startOfPrevYear(now)));
      setTo(toDateInputValue(endOfPrevYear(now)));
    }
  }, []);

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

  // Market-mode summary (to match Dashboard): convert txs to USD using spot USD/THB,
  // compute positions with chosen cost basis, then value with live market prices.
  const fxSpot = React.useMemo(
    () => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36),
    [usdThb],
  );
  const filteredTxsUsd = React.useMemo(() => {
    return filteredTxs.map((t) => {
      const src = t.currency ?? "THB";
      if (src === "USD") return t;
      return {
        ...t,
        price: t.price / fxSpot,
        fee: (t.fee ?? 0) / fxSpot,
        tax: (t.tax ?? 0) / fxSpot,
        currency: "USD" as const,
      } satisfies Transaction;
    });
  }, [filteredTxs, fxSpot]);
  const positions = React.useMemo(
    () =>
      prefs.costBasis === "fifo"
        ? computePositionsFifo(filteredTxsUsd)
        : computePositionsAvgCost(filteredTxsUsd),
    [filteredTxsUsd, prefs.costBasis],
  );
  const openPositions = React.useMemo(
    () => positions.filter((p) => p.qty > 0),
    [positions],
  );
  const quoteSymbols = React.useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .map((p) => p.assetName.trim().toUpperCase())
            .filter(Boolean),
        ),
      ),
    [openPositions],
  );
  React.useEffect(() => {
    if (!hydrated || !pricesHydrated) return;
    if (quoteSymbols.length === 0) return;
    refreshMarket(quoteSymbols);
  }, [hydrated, pricesHydrated, quoteSymbols, refreshMarket]);

  const marketSummary = React.useMemo(() => {
    const investedUsd = investedTotal(filteredTxsUsd);
    const feesUsd = totalFees(filteredTxsUsd);
    const realizedUsd = realizedPnlFromPositions(positions);
    const mvOpenUsd = currentValue(openPositions, prices);
    const unrealUsd = unrealizedPnl(openPositions, prices);
    const totalPnlUsd = realizedUsd + unrealUsd;
    const totalReturnPct =
      investedUsd > 0 ? round2((totalPnlUsd / investedUsd) * 100) : null;
    const toDisp = (nUsd: number) =>
      currency === "THB" ? nUsd * fxSpot : nUsd;
    return {
      investedDisp: round2(toDisp(investedUsd)),
      feesDisp: round2(toDisp(feesUsd)),
      realizedDisp: round2(toDisp(realizedUsd)),
      marketValueOpenDisp: round2(toDisp(mvOpenUsd)),
      unrealizedDisp: round2(toDisp(unrealUsd)),
      totalPnlDisp: round2(toDisp(totalPnlUsd)),
      totalReturnPct,
      quotedOpenCount: openPositions.filter((p) => p.qty > 0).length,
      openCount: openPositions.length,
    };
  }, [filteredTxsUsd, positions, openPositions, prices, currency, fxSpot]);

  const series = React.useMemo(
    () => buildTimelines(filteredTxs, asset, toDisplayMoney),
    [filteredTxs, asset, toDisplayMoney],
  );

  const handleRangePresetChange = React.useCallback(
    (v: RangePreset) => {
      setRangePreset(v);
      if (!v || v === "custom") return;
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
          {t("assets.subtitlePrefix")} ({currency}) ·{" "}
          {t("assets.subtitleGreen")} · {t("assets.subtitleRed")}
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
            setRangePreset("custom");
            setFrom(v);
            if (v && to && new Date(v) > new Date(to)) setTo(v);
          }}
          to={to}
          onToChange={(v) => {
            setRangePreset("custom");
            setTo(v);
            if (from && v && new Date(v) < new Date(from)) setFrom(v);
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
          series={series}
          rangePreset={rangePreset}
          from={from}
          to={to}
          locale={locale}
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
              market={{
                investedDisp: marketSummary.investedDisp,
                feesDisp: marketSummary.feesDisp,
                realizedDisp: marketSummary.realizedDisp,
                unrealizedDisp: marketSummary.unrealizedDisp,
                marketValueOpenDisp: marketSummary.marketValueOpenDisp,
                totalPnlDisp: marketSummary.totalPnlDisp,
                totalReturnPct: marketSummary.totalReturnPct,
              }}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
