import { Card } from "@/components/ui/Card";
import { PortfolioPie } from "@/components/charts/PortfolioPie";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";

type Props = { d: DashboardPortfolioModel };

export function DashboardAllocationPieCard({ d }: Props) {
  const { hydrated, pieMode, setPieMode, allocation } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-medium">สัดส่วนพอร์ต (ตามต้นทุนคงค้าง)</div>
            <div className="text-xs text-zinc-500">นับเฉพาะสินทรัพย์ที่ยังถือ — ไม่ใช่ราคาตลาด</div>
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
              แยกตามสินทรัพย์
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
              รวมตามประเภท
            </button>
          </div>
        </div>
        {hydrated ? (
          allocation.length > 0 ? (
            <PortfolioPie data={allocation} />
          ) : (
            <div className="text-sm text-zinc-400">ยังไม่มีต้นทุนคงค้างให้แสดง</div>
          )
        ) : (
          <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
        )}
      </div>
    </Card>
  );
}
