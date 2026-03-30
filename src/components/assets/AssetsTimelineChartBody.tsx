import { Button } from "@/components/ui/Button";
import { AssetValueTimelineLine } from "@/components/charts/AssetValueTimelineLine";
import type { AssetSeries } from "@/components/charts/AssetValueTimelineLine";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = {
  hydrated: boolean;
  assetLoading: boolean;
  assetNotAll: boolean;
  assetError: string | null;
  listError: string | null;
  filteredEmpty: boolean;
  series: AssetSeries[];
  wouldSimplifyChart?: boolean;
  showAllChartLines?: boolean;
  onToggleShowAllChartLines?: () => void;
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
  wouldSimplifyChart = false,
  showAllChartLines = false,
  onToggleShowAllChartLines,
  showSummaryToggle,
  onToggleSummary
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
          {wouldSimplifyChart && onToggleShowAllChartLines ? (
            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-relaxed text-zinc-600">
                {showAllChartLines ? (
                  <>
                    {t("assets.simplify.allPrefix")}
                    <strong className="font-medium text-zinc-800">
                      {" "}
                      {t("assets.simplify.allEmphasis")}
                    </strong>{" "}
                    {t("assets.simplify.allSuffix")}
                  </>
                ) : (
                  <>
                    {t("assets.simplify.simplePrefix")}{" "}
                    <strong className="font-medium text-zinc-800">
                      {t("assets.simplify.top5")}
                    </strong>{" "}
                    {t("assets.simplify.simpleMid")}{" "}
                    <strong className="font-medium text-zinc-800">
                      {t("assets.simplify.others")}
                    </strong>{" "}
                    {t("assets.simplify.simpleSuffix")}
                  </>
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 rounded-xl px-3 text-xs shadow-none"
                onClick={onToggleShowAllChartLines}
              >
                {showAllChartLines
                  ? t("assets.simplify.ctaCompact")
                  : t("assets.simplify.ctaShowAll")}
              </Button>
            </div>
          ) : null}
          <AssetValueTimelineLine series={series} height={420} />
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
