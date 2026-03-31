import { AssetValueTimelineLine } from "@/components/charts/AssetValueTimelineLine";
import type { AssetSeries } from "@/components/charts/AssetValueTimelineLine";
import { useI18n } from "@/components/shared/I18nProvider";
import type { RangePreset } from "@/lib/assetTimeline";
import type { AppLocale } from "@/i18n";
import { Button } from "@/components/ui/Button";

type Props = {
  hydrated: boolean;
  assetLoading: boolean;
  assetNotAll: boolean;
  assetError: string | null;
  listError: string | null;
  filteredEmpty: boolean;
  series: AssetSeries[];
  rangePreset: RangePreset;
  from: string;
  to: string;
  locale: AppLocale;
  showSummaryToggle: boolean;
  onToggleSummary: () => void;
};

export function AssetsTimelineChartBody({
  hydrated,
  assetLoading,
  assetNotAll,
  assetError,
  listError,
  filteredEmpty,
  series,
  rangePreset,
  from,
  to,
  locale,
  showSummaryToggle,
  onToggleSummary,
}: Props) {
  const { t } = useI18n();
  return (
    <div className="px-4 pb-5 pt-4 sm:px-6">
      {!hydrated || (assetNotAll && assetLoading) ? (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-zinc-400">
          {t("common.loading")}
        </div>
      ) : assetError ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-rose-600">
          {assetError}
        </div>
      ) : listError ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-rose-600">
          {listError}
        </div>
      ) : filteredEmpty ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 text-sm text-zinc-500">
          {t("assets.empty")}
        </div>
      ) : (
        <>
          <AssetValueTimelineLine
            series={series}
            height={420}
            rangePreset={rangePreset}
            from={from ? new Date(from) : null}
            to={to ? new Date(to) : null}
            locale={locale}
          />
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-xl px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              onClick={onToggleSummary}
            >
              {showSummaryToggle
                ? t("assets.summary.hide")
                : t("assets.summary.show")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
