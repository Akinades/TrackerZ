import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import { CircleDollarSign, LineChart, Percent, TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { DashboardSummaryStat } from "@/components/dashboard/DashboardSummaryStat";
import { formatDashboardPct } from "@/components/dashboard/dashboardFormat";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { d: DashboardPortfolioModel };

export function DashboardPortfolioSummaryCard({ d }: Props) {
  const { t } = useI18n();
  const {
    hydrated,
    currency,
    txsLength,
    openCostDisp,
    openPositions,
    quotedOpenCount,
    pricesStatus,
    marketValueOpenDisp,
    unrealizedTotalDisp,
    realized,
    realizedDisp,
    invested,
    investedDisp,
    feesDisp,
    totalPnlDisp,
    totalReturnPct,
    pricesError
  } = d;

  const pnlIcon =
    !hydrated || (openPositions.length === 0 && realized === 0)
      ? LineChart
      : totalPnlDisp > 0
        ? TrendingUp
        : totalPnlDisp < 0
          ? TrendingDown
          : LineChart;

  const pnlIconClass =
    !hydrated || (openPositions.length === 0 && realized === 0)
      ? "text-zinc-400"
      : totalPnlDisp > 0
        ? "text-emerald-600"
        : totalPnlDisp < 0
          ? "text-rose-500"
          : "text-zinc-400";

  const pnlValueClass =
    !hydrated || (openPositions.length === 0 && realized === 0)
      ? undefined
      : totalPnlDisp > 0
        ? "text-emerald-700"
        : totalPnlDisp < 0
          ? "text-rose-600"
          : "text-zinc-800";

  const pnlPctClass =
    !hydrated
      ? undefined
      : totalPnlDisp > 0
        ? "text-emerald-700/90"
        : totalPnlDisp < 0
          ? "text-rose-600/90"
          : "text-zinc-500";

  const showUnrealizedBreakdown =
    hydrated && openPositions.length > 0 && quotedOpenCount > 0;

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{t("dashboard.summary.title")}</div>
          <div className="text-xs text-zinc-500">
            {t("dashboard.summary.subtitle")}
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <select
            className="h-9 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 text-xs text-zinc-700 sm:w-[170px]"
            value={String(d.pollMinutes)}
            onChange={(e) => d.setPollMinutes(Number(e.target.value))}
            aria-label={t("dashboard.prices.pollAria")}
          >
            <option value="0">{t("dashboard.prices.pollOff")}</option>
            <option value="1">{t("dashboard.prices.poll1m")}</option>
            <option value="5">{t("dashboard.prices.poll5m")}</option>
            <option value="15">{t("dashboard.prices.poll15m")}</option>
          </select>
          <Button
            variant="secondary"
            className="h-9 shrink-0 rounded-2xl px-3 py-0 text-xs"
            disabled={d.pricesStatus === "loading"}
            onClick={() => d.refreshPricesNow()}
          >
            {t("dashboard.prices.refreshNow")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardSummaryStat
          label={t("dashboard.summary.costLabel")}
          hint={t("dashboard.summary.costHint")}
          icon={LineChart}
          value={hydrated ? formatMoney(openCostDisp, currency) : "…"}
        />
        <DashboardSummaryStat
          label={t("dashboard.summary.marketValueLabel")}
          hint={t("dashboard.summary.marketValueHint")}
          icon={CircleDollarSign}
          value={
            !hydrated
              ? "…"
              : openPositions.length === 0
                ? "—"
                : quotedOpenCount === 0 && pricesStatus === "loading"
                  ? "…"
                  : quotedOpenCount === 0
                    ? "—"
                    : formatMoney(marketValueOpenDisp, currency)
          }
        />
        <DashboardSummaryStat
          label={t("dashboard.summary.pnlLabel")}
          hint={t("dashboard.summary.pnlHint")}
          icon={pnlIcon}
          iconClassName={pnlIconClass}
          valueClassName={pnlValueClass}
          value={
            !hydrated ? (
              "…"
            ) : openPositions.length === 0 && realized === 0 ? (
              "—"
            ) : (
              <>
                {totalPnlDisp > 0 ? "+" : totalPnlDisp < 0 ? "−" : ""}
                {formatMoney(Math.abs(totalPnlDisp), currency)}
              </>
            )
          }
          pctLine={
            hydrated && (openPositions.length > 0 || realized !== 0) ? (
              <>
                {t("dashboard.summary.realized")} {realizedDisp >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(realizedDisp), currency)}
                {" · "}
                {t("dashboard.summary.unrealized")}{" "}
                {showUnrealizedBreakdown ? (
                  <>
                    {unrealizedTotalDisp >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(unrealizedTotalDisp), currency)}
                  </>
                ) : openPositions.length > 0 ? (
                  "—"
                ) : (
                  "—"
                )}
              </>
            ) : undefined
          }
          pctClassName={pnlPctClass}
        />
        <DashboardSummaryStat
          label={t("dashboard.summary.returnLabel")}
          hint={t("dashboard.summary.returnHint")}
          icon={Percent}
          iconClassName={
            !hydrated || totalReturnPct == null
              ? "text-zinc-400"
              : totalReturnPct > 0
                ? "text-emerald-600"
                : totalReturnPct < 0
                  ? "text-rose-500"
                  : "text-zinc-400"
          }
          valueClassName={
            !hydrated || totalReturnPct == null
              ? undefined
              : totalReturnPct > 0
                ? "text-emerald-700"
                : totalReturnPct < 0
                  ? "text-rose-600"
                  : "text-zinc-800"
          }
          value={
            !hydrated ? (
              "…"
            ) : totalReturnPct == null ? (
              "—"
            ) : (
              <>
                {totalReturnPct > 0 ? "+" : totalReturnPct < 0 ? "−" : ""}
                {formatDashboardPct(Math.abs(totalReturnPct))}%
              </>
            )
          }
          pctLine={
            hydrated && invested > 0 ? (
              <>
                {t("dashboard.summary.investedPrefix")}{" "}
                {formatMoney(investedDisp, currency)}{" "}
                {t("dashboard.summary.investedSuffix")}
              </>
            ) : undefined
          }
          pctClassName={
            totalReturnPct != null && totalReturnPct > 0
              ? "text-emerald-700/90"
              : totalReturnPct != null && totalReturnPct < 0
                ? "text-rose-600/90"
                : "text-zinc-500"
          }
        />
      </div>
      {hydrated && (pricesError || openPositions.length > 0 || txsLength > 0) ? (
        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-xs leading-relaxed text-zinc-500">
          {typeof d.pricesLastUpdatedAt === "number" ? (
            <p>
              {t("dashboard.prices.lastUpdated")}{" "}
              {new Date(d.pricesLastUpdatedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
          {pricesError ? (
            <p className="text-rose-600/90">{t("dashboard.summary.pricesFailed")}</p>
          ) : openPositions.length > 0 && quotedOpenCount < openPositions.length ? (
            <p>
              {t("dashboard.summary.partialPricesPrefix")} {quotedOpenCount}{" "}
              {t("dashboard.summary.partialPricesOf")} {openPositions.length}{" "}
              {t("dashboard.summary.partialPricesSuffix")}
            </p>
          ) : openPositions.length > 0 ? (
            <p>{t("dashboard.summary.priceSource")}</p>
          ) : null}
          {txsLength > 0 ? (
            <p>
              {t("dashboard.summary.feesTaxes")} {formatMoney(feesDisp, currency)}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
