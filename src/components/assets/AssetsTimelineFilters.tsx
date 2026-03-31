import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { RangePreset } from "@/lib/assetTimeline";
import type { AppLocale } from "@/i18n";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = {
  hydrated: boolean;
  asset: string;
  onAssetChange: (value: string) => void;
  assetOptions: string[];
  rangePreset: RangePreset;
  onRangePresetChange: (preset: RangePreset) => void;
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
  oldest: Date | null;
  newest: Date | null;
  locale: AppLocale;
};

export function AssetsTimelineFilters({
  hydrated,
  asset,
  onAssetChange,
  assetOptions,
  rangePreset,
  onRangePresetChange,
  from,
  onFromChange,
  to,
  onToChange,
  oldest,
  newest,
  locale,
}: Props) {
  const { t } = useI18n();
  return (
    <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/80 to-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">
              {t("assets.filters.asset")}
            </span>
            <Select
              value={asset}
              onChange={(e) => onAssetChange(e.target.value)}
              disabled={!hydrated}
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              aria-label="Asset filter"
            >
              <option value="__all__">{t("assets.filters.allAssets")}</option>
              {assetOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">
              {t("assets.filters.preset")}
            </span>
            <Select
              value={rangePreset}
              onChange={(e) =>
                onRangePresetChange(e.target.value as RangePreset)
              }
              disabled={!hydrated}
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              aria-label="Date range preset"
            >
              <option value="">{t("assets.filters.choosePreset")}</option>
              <option value="today">{t("datePreset.today")}</option>
              <option value="yesterday">{t("datePreset.yesterday")}</option>
              {rangePreset === "custom" ? (
                <option value="custom" hidden>
                  {t("datePreset.custom")}
                </option>
              ) : null}
              <option value="last7">{t("datePreset.last7")}</option>
              <option value="last30">{t("datePreset.last30")}</option>
              <option value="last90">{t("datePreset.last90")}</option>
              <option value="ytd">{t("datePreset.ytd")}</option>
              <option value="last365">{t("datePreset.last365")}</option>
              <option value="all">{t("datePreset.all")}</option>
            </Select>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-end gap-2 sm:gap-3 lg:justify-end">
          <div className="grid min-w-[140px] flex-1 gap-1.5 sm:flex-initial">
            <span className="text-xs font-medium text-zinc-500">
              {t("assets.filters.from")}
            </span>
            <Input
              type="date"
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              disabled={!hydrated}
            />
          </div>
          <div className="grid min-w-[140px] flex-1 gap-1.5 sm:flex-initial">
            <span className="text-xs font-medium text-zinc-500">
              {t("assets.filters.to")}
            </span>
            <Input
              type="date"
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              value={to}
              onChange={(e) => onToChange(e.target.value)}
              disabled={!hydrated}
            />
          </div>
        </div>
      </div>
      {oldest && newest ? (
        <p className="mt-3 text-center text-[11px] text-zinc-400 sm:text-left">
          {t("assets.filters.rangePrefix")}{" "}
          {oldest.toLocaleDateString(locale === "th" ? "th-TH" : "en-US")} —{" "}
          {newest.toLocaleDateString(locale === "th" ? "th-TH" : "en-US")}
        </p>
      ) : null}
    </div>
  );
}
