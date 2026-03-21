import { Card } from "@/components/ui/Card";

type Props = { onSeedDemo: () => void };

export function DashboardDemoEmptyCard({ onSeedDemo }: Props) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">ยังไม่มีข้อมูล</div>
          <div className="text-xs text-zinc-400">กดเพื่อโหลดข้อมูลตัวอย่างให้เห็นตัวเลข/กราฟทันที</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSeedDemo}
            className="rounded-md border border-zinc-700 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-950"
          >
            โหลด Demo data
          </button>
        </div>
      </div>
    </Card>
  );
}
