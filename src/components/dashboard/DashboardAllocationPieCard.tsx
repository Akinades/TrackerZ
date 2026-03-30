import { Card } from "@/components/ui/Card";
import { PortfolioPie } from "@/components/charts/PortfolioPie";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { d: DashboardPortfolioModel };

export function DashboardAllocationPieCard({ d }: Props) {
  const { t } = useI18n();
  const { hydrated, pieMode, setPieMode, allocation } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-medium">{t("dashboard.allocationPie.title")}</div>
            <div className="text-xs text-zinc-500">{t("dashboard.allocationPie.subtitle")}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPieMode("asset")}
              className={
                pieMode === "asset"
                  ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                  : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              }
            >
              {t("dashboard.allocationPie.byAsset")}
            </button>
            <button
              type="button"
              onClick={() => setPieMode("type")}
              className={
                pieMode === "type"
                  ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                  : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              }
            >
              {t("dashboard.allocationPie.byType")}
            </button>
          </div>
        </div>
        {hydrated ? (
          allocation.length > 0 ? (
            <PortfolioPie data={allocation} />
          ) : (
            <div className="text-sm text-zinc-400">{t("dashboard.allocationPie.empty")}</div>
          )
        ) : (
          <div className="text-sm text-zinc-400">{t("common.loading")}</div>
        )}
      </div>
    </Card>
  );
}
