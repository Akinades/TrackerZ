import { Card } from "@/components/ui/Card";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { formatMoney, formatNumber2 } from "@/lib/format";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { formatDashboardPct } from "@/components/dashboard/dashboardFormat";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { d: DashboardPortfolioModel };

export function DashboardHoldingsTableCard({ d }: Props) {
  const { t, locale } = useI18n();
  const numLocale = locale === "th" ? "th-TH" : "en-US";
  const { hydrated, currency, holdingRows, toDisplay } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900">{t("dashboard.holdings.title")}</div>
            <div className="text-xs text-zinc-500">
              {t("dashboard.holdings.subtitle")}
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            {hydrated ? `${holdingRows.length} ${t("dashboard.holdings.items")}` : "…"}
          </div>
        </div>

        {!hydrated ? (
          <div className="text-sm text-zinc-400">{t("common.loading")}</div>
        ) : holdingRows.length === 0 ? (
          <div className="text-sm text-zinc-400">{t("dashboard.holdings.empty")}</div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-200/70">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <div className="max-h-[min(70vh,680px)] overflow-y-auto overscroll-contain">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="sticky top-0 z-[1] border-b border-zinc-200/80 bg-zinc-50/95 text-xs font-medium text-zinc-600 backdrop-blur-sm">
                      <th className="whitespace-nowrap px-4 py-3">{t("dashboard.holdings.cols.asset")}</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">{t("dashboard.holdings.cols.amount")}</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">{t("dashboard.holdings.cols.avgCost")}</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">{t("dashboard.holdings.cols.marketPx")}</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">{t("dashboard.holdings.cols.cost")}</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">{t("dashboard.holdings.cols.marketValue")}</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">{t("dashboard.holdings.cols.unreal")}</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">{t("dashboard.holdings.cols.realized")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 bg-white">
                    {holdingRows.map(
                      ({
                        p,
                        costDisp,
                        realizedDisp: rDisp,
                        unrealDisp: uDisp,
                        marketPxDisp,
                        marketValueDisp,
                        unrealPctOnCost
                      }) => (
                        <tr key={p.assetName} className="transition-colors hover:bg-zinc-50/80">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <AssetIcon
                                symbol={p.assetName}
                                type={p.assetType}
                                className="h-8 w-8 shrink-0 rounded-xl"
                              />
                              <div className="min-w-0">
                                <div className="font-medium text-zinc-900">{p.assetName}</div>
                                <div className="text-[11px] uppercase tracking-wide text-zinc-400">
                                  {p.assetType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-800">
                            {formatNumber2(p.qty, numLocale)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-800">
                            {formatMoney(Math.round(toDisplay(p.avgCost) * 100) / 100, currency)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                            {marketPxDisp === null ? "—" : formatMoney(marketPxDisp, currency)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-900">
                            {formatMoney(costDisp, currency)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-800">
                            {marketValueDisp === null ? "—" : formatMoney(marketValueDisp, currency)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div
                              className={[
                                "font-medium tabular-nums",
                                uDisp === null
                                  ? "text-zinc-400"
                                  : uDisp > 0
                                    ? "text-emerald-700"
                                    : uDisp < 0
                                      ? "text-rose-600"
                                      : "text-zinc-700"
                              ].join(" ")}
                            >
                              {uDisp === null
                                ? "—"
                                : `${uDisp > 0 ? "+" : uDisp < 0 ? "-" : ""}${formatMoney(Math.abs(uDisp), currency)}`}
                            </div>
                            {unrealPctOnCost !== null ? (
                              <div
                                className={[
                                  "mt-0.5 text-[11px] tabular-nums",
                                  unrealPctOnCost > 0
                                    ? "text-emerald-600/90"
                                    : unrealPctOnCost < 0
                                      ? "text-rose-600/90"
                                      : "text-zinc-400"
                                ].join(" ")}
                              >
                                ({unrealPctOnCost > 0 ? "+" : ""}
                                {formatDashboardPct(unrealPctOnCost)}% {t("dashboard.holdings.ofCost")})
                              </div>
                            ) : null}
                          </td>
                          <td
                            className={[
                              "px-4 py-3 text-right font-medium tabular-nums",
                              rDisp > 0 ? "text-emerald-700" : rDisp < 0 ? "text-rose-600" : "text-zinc-500"
                            ].join(" ")}
                          >
                            {rDisp === 0
                              ? "—"
                              : `${rDisp > 0 ? "+" : "-"}${formatMoney(Math.abs(rDisp), currency)}`}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
