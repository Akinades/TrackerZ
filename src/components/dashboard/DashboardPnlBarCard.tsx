import { Card } from "@/components/ui/Card";
import { PortfolioPnlBar } from "@/components/charts/PortfolioPnlBar";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";

type Props = { d: DashboardPortfolioModel };

export function DashboardPnlBarCard({ d }: Props) {
  const { hydrated, pnlRows } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">กราฟกำไร / ขาดทุนรายสินทรัพย์</div>
          <div className="text-xs text-zinc-500">
            Top 12 ตามขนาดผลรวม — กราฟแท่งแนวตั้ง · แต่ละแท่ง ={" "}
            <span className="font-medium text-zinc-700">ขายแล้ว + ค้างตามตลาด</span>
            {" · โทนพาสเทล "}
            <span className="font-medium text-[#4a8f72]">เขียวอ่อน = บวก</span>
            {", "}
            <span className="font-medium text-[#b56b6b]">แดงอ่อน = ลบ</span>
          </div>
        </div>
        {hydrated ? (
          <PortfolioPnlBar data={pnlRows} />
        ) : (
          <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
        )}
      </div>
    </Card>
  );
}
