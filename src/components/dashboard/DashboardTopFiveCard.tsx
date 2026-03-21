import { Card } from "@/components/ui/Card";
import { BuySellCountBar } from "@/components/charts/BuySellCountBar";
import { formatMoney, formatNumber2 } from "@/lib/format";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { DashboardTopFiveRow } from "@/components/dashboard/DashboardTopFiveRow";
import { formatDashboardPct } from "@/components/dashboard/dashboardFormat";

type Props = { d: DashboardPortfolioModel };

export function DashboardTopFiveCard({ d }: Props) {
  const {
    hydrated,
    currency,
    top5UnrealizedWinners,
    top5UnrealizedLosers,
    txBuyCount,
    txSellCount
  } = d;

  return (
    <Card>
      <div className="mb-4">
        <div className="text-sm font-semibold text-zinc-900">Top 5 กำไร &amp; ขาดทุน</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          เฉพาะกำไร/ขาดทุนค้าง (ตลาด) — ต้องมีราคาตลาด · แสดงต้นทุน มูลค่าตลาด และ % เทียบต้นทุนค้าง
        </div>
      </div>
      {!hydrated ? (
        <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
      ) : (
        <>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            กำไร / ขาดทุนค้าง (ตลาด)
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-[11px] font-medium text-emerald-700">กำไรค้างสูงสุด</div>
              {top5UnrealizedWinners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-5 text-center text-xs text-zinc-400">
                  ไม่มีรายการกำไรค้าง
                </div>
              ) : (
                top5UnrealizedWinners.map((row, i) => (
                  <DashboardTopFiveRow
                    key={row.p.assetName}
                    rank={i + 1}
                    assetName={row.p.assetName}
                    assetType={row.p.assetType}
                    amountClassName="text-emerald-700"
                    amountLine={`+${formatMoney(row.unrealDisp ?? 0, currency)}`}
                    details={
                      <>
                        <span>ต้นทุนค้าง {formatMoney(row.costDisp, currency)}</span>
                        <span>
                          มูลค่าตลาด{" "}
                          {row.marketValueDisp != null ? formatMoney(row.marketValueDisp, currency) : "—"}
                        </span>
                        <span>
                          {row.unrealPctOnCost != null
                            ? `${row.unrealPctOnCost > 0 ? "+" : ""}${formatDashboardPct(row.unrealPctOnCost)}% ของต้นทุนค้าง`
                            : "— % ของต้นทุน"}
                        </span>
                      </>
                    }
                  />
                ))
              )}
            </div>
            <div className="grid gap-2">
              <div className="text-[11px] font-medium text-rose-600">ขาดทุนค้างมากสุด</div>
              {top5UnrealizedLosers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-5 text-center text-xs text-zinc-400">
                  ไม่มีรายการขาดทุนค้าง
                </div>
              ) : (
                top5UnrealizedLosers.map((row, i) => {
                  const u = row.unrealDisp ?? 0;
                  return (
                    <DashboardTopFiveRow
                      key={row.p.assetName}
                      rank={i + 1}
                      assetName={row.p.assetName}
                      assetType={row.p.assetType}
                      amountClassName="text-rose-600"
                      amountLine={`-${formatMoney(Math.abs(u), currency)}`}
                      details={
                        <>
                          <span>ต้นทุนค้าง {formatMoney(row.costDisp, currency)}</span>
                          <span>
                            มูลค่าตลาด{" "}
                            {row.marketValueDisp != null ? formatMoney(row.marketValueDisp, currency) : "—"}
                          </span>
                          <span>
                            {row.unrealPctOnCost != null
                              ? `${formatDashboardPct(row.unrealPctOnCost)}% ของต้นทุนค้าง`
                              : "— % ของต้นทุน"}
                          </span>
                        </>
                      }
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-100 pt-6">
            <div className="mb-1 text-sm font-semibold text-zinc-900">จำนวนธุรกรรม Buy / Sell</div>
            <div className="text-xs text-zinc-500">กราฟแท่งแนวนอน — นับจากรายการทั้งหมดในบัญชีนี้</div>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <BuySellCountBar buyCount={txBuyCount} sellCount={txSellCount} height={140} />
              <div className="grid shrink-0 gap-1.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 text-sm tabular-nums text-zinc-700">
                <div>
                  ซื้อ (Buy):{" "}
                  <span className="font-semibold text-emerald-700">{formatNumber2(txBuyCount, "th-TH")}</span>{" "}
                  รายการ
                </div>
                <div>
                  ขาย (Sell):{" "}
                  <span className="font-semibold text-rose-600">{formatNumber2(txSellCount, "th-TH")}</span>{" "}
                  รายการ
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
