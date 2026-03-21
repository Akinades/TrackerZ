import { Card } from "@/components/ui/Card";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";

type Props = { d: DashboardPortfolioModel };

export function DashboardAllocationTargetsCard({ d }: Props) {
  const { allocationRows } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div>
          <div className="text-sm font-medium">สัดส่วนพอร์ต (Allocation)</div>
          <div className="text-xs text-zinc-400">
            เปอร์เซ็นต์จากต้นทุนคงค้าง (ยังถือ) เทียบเป้าหมายในหน้า Settings
          </div>
        </div>
        <div className="grid gap-2">
          {allocationRows.map((r) => {
            const drift = Math.round((r.pct - r.target) * 100) / 100;
            return (
              <div
                key={r.type}
                className="flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-zinc-50/60 px-4 py-3 text-sm"
              >
                <div className="font-medium text-zinc-900">{r.type.toUpperCase()}</div>
                <div className="flex items-center gap-3 tabular-nums">
                  <div className="text-zinc-600">
                    {r.pct.toFixed(2)}% / Target {Number(r.target).toFixed(2)}%
                  </div>
                  <div
                    className={
                      drift > 0.01
                        ? "font-medium text-emerald-700"
                        : drift < -0.01
                          ? "font-medium text-rose-700"
                          : "font-medium text-zinc-500"
                    }
                  >
                    {drift > 0 ? "+" : ""}
                    {drift.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
