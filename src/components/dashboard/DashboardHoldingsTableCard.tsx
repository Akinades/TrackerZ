import { Card } from "@/components/ui/Card";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { formatMoney, formatNumber2 } from "@/lib/format";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { formatDashboardPct } from "@/components/dashboard/dashboardFormat";

type Props = { d: DashboardPortfolioModel };

export function DashboardHoldingsTableCard({ d }: Props) {
  const { hydrated, currency, holdingRows, toDisplay } = d;

  return (
    <Card>
      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900">สินทรัพย์ที่ถือทั้งหมด</div>
            <div className="text-xs text-zinc-500">
              เรียงตามต้นทุนคงค้าง (มาก → น้อย) · เลื่อนตารางซ้าย–ขวาบนมือถือได้
            </div>
          </div>
          <div className="text-xs text-zinc-500">{hydrated ? `${holdingRows.length} รายการ` : "…"}</div>
        </div>

        {!hydrated ? (
          <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
        ) : holdingRows.length === 0 ? (
          <div className="text-sm text-zinc-400">ยังไม่มีสินทรัพย์ที่ถือค้าง (หรือขายหมดแล้ว)</div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-200/70">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <div className="max-h-[min(70vh,680px)] overflow-y-auto overscroll-contain">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="sticky top-0 z-[1] border-b border-zinc-200/80 bg-zinc-50/95 text-xs font-medium text-zinc-600 backdrop-blur-sm">
                      <th className="whitespace-nowrap px-4 py-3">สินทรัพย์</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">จำนวน</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">ทุนเฉลี่ย / หน่วย</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">ราคาตลาด / หน่วย</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">ต้นทุนค้าง</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">มูลค่าตลาด</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">กำไรค้าง</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">ขายแล้ว</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 bg-white">
                    {holdingRows.map(
                      ({
                        p,
                        costDisp,
                        realizedDisp: rDisp,
                        unrealDisp: uDisp,
                        marketPxDisp,
                        marketValueDisp,
                        unrealPctOnCost
                      }) => (
                        <tr key={p.assetName} className="transition-colors hover:bg-zinc-50/80">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <AssetIcon
                                symbol={p.assetName}
                                type={p.assetType}
                                className="h-8 w-8 shrink-0 rounded-xl"
                              />
                              <div className="min-w-0">
                                <div className="font-medium text-zinc-900">{p.assetName}</div>
                                <div className="text-[11px] uppercase tracking-wide text-zinc-400">
                                  {p.assetType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-800">
                            {formatNumber2(p.qty, "th-TH")}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-800">
                            {formatMoney(Math.round(toDisplay(p.avgCost) * 100) / 100, currency)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                            {marketPxDisp === null ? "—" : formatMoney(marketPxDisp, currency)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-900">
                            {formatMoney(costDisp, currency)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-800">
                            {marketValueDisp === null ? "—" : formatMoney(marketValueDisp, currency)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div
                              className={[
                                "font-medium tabular-nums",
                                uDisp === null
                                  ? "text-zinc-400"
                                  : uDisp > 0
                                    ? "text-emerald-700"
                                    : uDisp < 0
                                      ? "text-rose-600"
                                      : "text-zinc-700"
                              ].join(" ")}
                            >
                              {uDisp === null
                                ? "—"
                                : `${uDisp > 0 ? "+" : uDisp < 0 ? "-" : ""}${formatMoney(Math.abs(uDisp), currency)}`}
                            </div>
                            {unrealPctOnCost !== null ? (
                              <div
                                className={[
                                  "mt-0.5 text-[11px] tabular-nums",
                                  unrealPctOnCost > 0
                                    ? "text-emerald-600/90"
                                    : unrealPctOnCost < 0
                                      ? "text-rose-600/90"
                                      : "text-zinc-400"
                                ].join(" ")}
                              >
                                ({unrealPctOnCost > 0 ? "+" : ""}
                                {formatDashboardPct(unrealPctOnCost)}% ของต้นทุนค้าง)
                              </div>
                            ) : null}
                          </td>
                          <td
                            className={[
                              "px-4 py-3 text-right font-medium tabular-nums",
                              rDisp > 0 ? "text-emerald-700" : rDisp < 0 ? "text-rose-600" : "text-zinc-500"
                            ].join(" ")}
                          >
                            {rDisp === 0
                              ? "—"
                              : `${rDisp > 0 ? "+" : "-"}${formatMoney(Math.abs(rDisp), currency)}`}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
