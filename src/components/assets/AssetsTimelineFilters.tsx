import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { RangePreset } from "@/lib/assetTimeline";

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
  newest
}: Props) {
  return (
    <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/80 to-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">สินทรัพย์</span>
            <Select
              value={asset}
              onChange={(e) => onAssetChange(e.target.value)}
              disabled={!hydrated}
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              aria-label="Asset filter"
            >
              <option value="__all__">ทั้งหมด — แยกสีตามสินทรัพย์</option>
              {assetOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">ช่วงด่วน</span>
            <Select
              value={rangePreset}
              onChange={(e) => onRangePresetChange(e.target.value as RangePreset)}
              disabled={!hydrated}
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              aria-label="Date range preset"
            >
              <option value="">เลือกช่วง…</option>
              <option value="today">วันนี้</option>
              <option value="yesterday">เมื่อวาน</option>
              <option value="last7">7 วัน</option>
              <option value="last30">30 วัน</option>
              <option value="last90">90 วัน</option>
              <option value="ytd">ปีนี้</option>
              <option value="last365">1 ปี</option>
              <option value="all">ทั้งหมด</option>
            </Select>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-end gap-2 sm:gap-3 lg:justify-end">
          <div className="grid min-w-[140px] flex-1 gap-1.5 sm:flex-initial">
            <span className="text-xs font-medium text-zinc-500">จาก</span>
            <Input
              type="date"
              className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              disabled={!hydrated}
            />
          </div>
          <div className="grid min-w-[140px] flex-1 gap-1.5 sm:flex-initial">
            <span className="text-xs font-medium text-zinc-500">ถึง</span>
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
          ข้อมูลในพอร์ต: {oldest.toLocaleDateString("th-TH")} — {newest.toLocaleDateString("th-TH")}
        </p>
      ) : null}
    </div>
  );
}
