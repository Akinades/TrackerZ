import { Button } from "@/components/ui/Button";
import { AssetValueTimelineLine } from "@/components/charts/AssetValueTimelineLine";
import type { AssetSeries } from "@/components/charts/AssetValueTimelineLine";

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
  return (
    <div className="px-4 pb-5 pt-4 sm:px-6">
      {!hydrated || (assetNotAll && assetLoading) ? (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-zinc-400">
          กำลังโหลด…
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
          ไม่มีรายการในช่วงนี้ — ลองขยายช่วงวันที่
        </div>
      ) : (
        <>
          {wouldSimplifyChart && onToggleShowAllChartLines ? (
            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-relaxed text-zinc-600">
                {showAllChartLines ? (
                  <>
                    แสดง<strong className="font-medium text-zinc-800"> ทุกสินทรัพย์</strong> พร้อมกัน
                    — เส้นอาจซ้อนกันจนอ่านยาก
                  </>
                ) : (
                  <>
                    โหมดอ่านง่าย: แสดง{" "}
                    <strong className="font-medium text-zinc-800">5 รายการที่มูลค่าถือล่าสุดสูงสุด</strong>{" "}
                    และเส้น <strong className="font-medium text-zinc-800">อื่นๆ</strong> เป็นมูลค่ารวมของที่เหลือ
                    — จุดซื้อ/ขายของแต่ละเหรียญในกลุ่มอื่นๆ ยังแสดงครบ
                  </>
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 rounded-xl px-3 text-xs shadow-none"
                onClick={onToggleShowAllChartLines}
              >
                {showAllChartLines ? "ย่อเป็น 5 + อื่นๆ" : "แสดงทุกเส้น"}
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
              {showSummaryToggle ? "ซ่อนสรุปด้านล่าง" : "แสดงสรุปด้านล่าง"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
