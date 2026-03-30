import { Card } from "@/components/ui/Card";
import { BuySellCountBar } from "@/components/charts/BuySellCountBar";
import { formatMoney, formatNumber2 } from "@/lib/format";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { DashboardTopFiveRow } from "@/components/dashboard/DashboardTopFiveRow";
import { formatDashboardPct } from "@/components/dashboard/dashboardFormat";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { d: DashboardPortfolioModel };

export function DashboardTopFiveCard({ d }: Props) {
  const { t, locale } = useI18n();
  const numLocale = locale === "th" ? "th-TH" : "en-US";
  const {
    hydrated,
    currency,
    top5UnrealizedWinners,
    top5UnrealizedLosers,
    txBuyCount,
    txSellCount
  } = d;

  return (
    <Card>
      <div className="mb-4">
        <div className="text-sm font-semibold text-zinc-900">{t("dashboard.top5.title")}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{t("dashboard.top5.subtitle")}</div>
      </div>
      {!hydrated ? (
        <div className="text-sm text-zinc-400">{t("common.loading")}</div>
      ) : (
        <>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {t("dashboard.top5.sectionTitle")}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-[11px] font-medium text-emerald-700">{t("dashboard.top5.best")}</div>
              {top5UnrealizedWinners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-5 text-center text-xs text-zinc-400">
                  {t("dashboard.top5.noneBest")}
                </div>
              ) : (
                top5UnrealizedWinners.map((row, i) => (
                  <DashboardTopFiveRow
                    key={row.p.assetName}
                    rank={i + 1}
                    assetName={row.p.assetName}
                    assetType={row.p.assetType}
                    amountClassName="text-emerald-700"
                    amountLine={`+${formatMoney(row.unrealDisp ?? 0, currency)}`}
                    details={
                      <>
                        <span>
                          {t("dashboard.top5.cost")} {formatMoney(row.costDisp, currency)}
                        </span>
                        <span>
                          {t("dashboard.top5.marketValue")}{" "}
                          {row.marketValueDisp != null ? formatMoney(row.marketValueDisp, currency) : "—"}
                        </span>
                        <span>
                          {row.unrealPctOnCost != null
                            ? `${row.unrealPctOnCost > 0 ? "+" : ""}${formatDashboardPct(row.unrealPctOnCost)}% ${t("dashboard.top5.ofCost")}`
                            : `— % ${t("dashboard.top5.ofCostShort")}`}
                        </span>
                      </>
                    }
                  />
                ))
              )}
            </div>
            <div className="grid gap-2">
              <div className="text-[11px] font-medium text-rose-600">{t("dashboard.top5.worst")}</div>
              {top5UnrealizedLosers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-5 text-center text-xs text-zinc-400">
                  {t("dashboard.top5.noneWorst")}
                </div>
              ) : (
                top5UnrealizedLosers.map((row, i) => {
                  const u = row.unrealDisp ?? 0;
                  return (
                    <DashboardTopFiveRow
                      key={row.p.assetName}
                      rank={i + 1}
                      assetName={row.p.assetName}
                      assetType={row.p.assetType}
                      amountClassName="text-rose-600"
                      amountLine={`-${formatMoney(Math.abs(u), currency)}`}
                      details={
                        <>
                          <span>
                            {t("dashboard.top5.cost")} {formatMoney(row.costDisp, currency)}
                          </span>
                          <span>
                            {t("dashboard.top5.marketValue")}{" "}
                            {row.marketValueDisp != null ? formatMoney(row.marketValueDisp, currency) : "—"}
                          </span>
                          <span>
                            {row.unrealPctOnCost != null
                              ? `${formatDashboardPct(row.unrealPctOnCost)}% ${t("dashboard.top5.ofCost")}`
                              : `— % ${t("dashboard.top5.ofCostShort")}`}
                          </span>
                        </>
                      }
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-100 pt-6">
            <div className="mb-1 text-sm font-semibold text-zinc-900">{t("dashboard.top5.buySellTitle")}</div>
            <div className="text-xs text-zinc-500">{t("dashboard.top5.buySellSubtitle")}</div>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <BuySellCountBar buyCount={txBuyCount} sellCount={txSellCount} height={140} />
              <div className="grid shrink-0 gap-1.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 text-sm tabular-nums text-zinc-700">
                <div>
                  {t("dashboard.top5.buyLabel")}{" "}
                  <span className="font-semibold text-emerald-700">{formatNumber2(txBuyCount, numLocale)}</span>{" "}
                  {t("dashboard.top5.items")}
                </div>
                <div>
                  {t("dashboard.top5.sellLabel")}{" "}
                  <span className="font-semibold text-rose-600">{formatNumber2(txSellCount, numLocale)}</span>{" "}
                  {t("dashboard.top5.items")}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
