import { Card } from "@/components/ui/Card";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { onSeedDemo: () => void };

export function DashboardDemoEmptyCard({ onSeedDemo }: Props) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">{t("dashboard.empty.title")}</div>
          <div className="text-xs text-zinc-400">{t("dashboard.empty.subtitle")}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSeedDemo}
            className="rounded-md border border-zinc-700 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-950"
          >
            {t("dashboard.empty.cta")}
          </button>
        </div>
      </div>
    </Card>
  );
}
