import { Card } from "@/components/ui/Card";
import { PortfolioPnlBar } from "@/components/charts/PortfolioPnlBar";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { d: DashboardPortfolioModel };

export function DashboardPnlBarCard({ d }: Props) {
  const { t } = useI18n();
  const { hydrated, pnlRows } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{t("dashboard.pnlBar.title")}</div>
          <div className="text-xs text-zinc-500">
            {t("dashboard.pnlBar.subtitlePrefix")}{" "}
            <span className="font-medium text-zinc-700">{t("dashboard.pnlBar.subtitleEmphasis")}</span>
            {" · "}
            {t("dashboard.pnlBar.subtitleMid")}{" "}
            <span className="font-medium text-[#4a8f72]">{t("dashboard.pnlBar.green")}</span>
            {", "}
            <span className="font-medium text-[#b56b6b]">{t("dashboard.pnlBar.red")}</span>
          </div>
        </div>
        {hydrated ? (
          <PortfolioPnlBar data={pnlRows} />
        ) : (
          <div className="text-sm text-zinc-400">{t("common.loading")}</div>
        )}
      </div>
    </Card>
  );
}
