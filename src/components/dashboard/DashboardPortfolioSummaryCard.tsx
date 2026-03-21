import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import { CircleDollarSign, LineChart, Percent, TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardPortfolioModel } from "@/hooks/useDashboardPortfolio";
import { DashboardSummaryStat } from "@/components/dashboard/DashboardSummaryStat";
import { formatDashboardPct } from "@/components/dashboard/dashboardFormat";

type Props = { d: DashboardPortfolioModel };

export function DashboardPortfolioSummaryCard({ d }: Props) {
  const {
    hydrated,
    currency,
    txsLength,
    openCostDisp,
    openPositions,
    quotedOpenCount,
    pricesStatus,
    marketValueOpenDisp,
    unrealizedTotalDisp,
    realized,
    realizedDisp,
    invested,
    investedDisp,
    feesDisp,
    totalPnlDisp,
    totalReturnPct,
    pricesError
  } = d;

  const pnlIcon =
    !hydrated || (openPositions.length === 0 && realized === 0)
      ? LineChart
      : totalPnlDisp > 0
        ? TrendingUp
        : totalPnlDisp < 0
          ? TrendingDown
          : LineChart;

  const pnlIconClass =
    !hydrated || (openPositions.length === 0 && realized === 0)
      ? "text-zinc-400"
      : totalPnlDisp > 0
        ? "text-emerald-600"
        : totalPnlDisp < 0
          ? "text-rose-500"
          : "text-zinc-400";

  const pnlValueClass =
    !hydrated || (openPositions.length === 0 && realized === 0)
      ? undefined
      : totalPnlDisp > 0
        ? "text-emerald-700"
        : totalPnlDisp < 0
          ? "text-rose-600"
          : "text-zinc-800";

  const pnlPctClass =
    !hydrated
      ? undefined
      : totalPnlDisp > 0
        ? "text-emerald-700/90"
        : totalPnlDisp < 0
          ? "text-rose-600/90"
          : "text-zinc-500";

  const showUnrealizedBreakdown =
    hydrated && openPositions.length > 0 && quotedOpenCount > 0;

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">สรุปพอร์ต</div>
          <div className="text-xs text-zinc-500">
            สี่ตัวเลขหลัก — มูลค่าปัจจุบันและกำไรค้างนับเฉพาะสินทรัพย์ที่ดึงราคาได้
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardSummaryStat
          label="ต้นทุน"
          hint="ของที่ถืออยู่ (ต้นทุนคงค้าง)"
          icon={LineChart}
          value={hydrated ? formatMoney(openCostDisp, currency) : "…"}
        />
        <DashboardSummaryStat
          label="มูลค่าปัจจุบัน"
          hint="ประมาณจากราคาล่าสุด"
          icon={CircleDollarSign}
          value={
            !hydrated
              ? "…"
              : openPositions.length === 0
                ? "—"
                : quotedOpenCount === 0 && pricesStatus === "loading"
                  ? "…"
                  : quotedOpenCount === 0
                    ? "—"
                    : formatMoney(marketValueOpenDisp, currency)
          }
        />
        <DashboardSummaryStat
          label="กำไร / ขาดทุน"
          hint="ขายแล้ว + ค้าง รวมกัน"
          icon={pnlIcon}
          iconClassName={pnlIconClass}
          valueClassName={pnlValueClass}
          value={
            !hydrated ? (
              "…"
            ) : openPositions.length === 0 && realized === 0 ? (
              "—"
            ) : (
              <>
                {totalPnlDisp > 0 ? "+" : totalPnlDisp < 0 ? "−" : ""}
                {formatMoney(Math.abs(totalPnlDisp), currency)}
              </>
            )
          }
          pctLine={
            hydrated && (openPositions.length > 0 || realized !== 0) ? (
              <>
                ขายแล้ว {realizedDisp >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(realizedDisp), currency)}
                {" · "}
                ค้าง{" "}
                {showUnrealizedBreakdown ? (
                  <>
                    {unrealizedTotalDisp >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(unrealizedTotalDisp), currency)}
                  </>
                ) : openPositions.length > 0 ? (
                  "—"
                ) : (
                  "—"
                )}
              </>
            ) : undefined
          }
          pctClassName={pnlPctClass}
        />
        <DashboardSummaryStat
          label="ผลตอบแทน"
          hint="% เทียบเงินลงทุนรวม"
          icon={Percent}
          iconClassName={
            !hydrated || totalReturnPct == null
              ? "text-zinc-400"
              : totalReturnPct > 0
                ? "text-emerald-600"
                : totalReturnPct < 0
                  ? "text-rose-500"
                  : "text-zinc-400"
          }
          valueClassName={
            !hydrated || totalReturnPct == null
              ? undefined
              : totalReturnPct > 0
                ? "text-emerald-700"
                : totalReturnPct < 0
                  ? "text-rose-600"
                  : "text-zinc-800"
          }
          value={
            !hydrated ? (
              "…"
            ) : totalReturnPct == null ? (
              "—"
            ) : (
              <>
                {totalReturnPct > 0 ? "+" : totalReturnPct < 0 ? "−" : ""}
                {formatDashboardPct(Math.abs(totalReturnPct))}%
              </>
            )
          }
          pctLine={
            hydrated && invested > 0 ? (
              <>ลงทุนรวม {formatMoney(investedDisp, currency)} (ซื้อ + fee)</>
            ) : undefined
          }
          pctClassName={
            totalReturnPct != null && totalReturnPct > 0
              ? "text-emerald-700/90"
              : totalReturnPct != null && totalReturnPct < 0
                ? "text-rose-600/90"
                : "text-zinc-500"
          }
        />
      </div>
      {hydrated && (pricesError || openPositions.length > 0 || txsLength > 0) ? (
        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-xs leading-relaxed text-zinc-500">
          {pricesError ? (
            <p className="text-rose-600/90">ดึงราคาไม่สำเร็จ — ลองรีเฟรชหน้า</p>
          ) : openPositions.length > 0 && quotedOpenCount < openPositions.length ? (
            <p>
              มีราคาตลาดครบ {quotedOpenCount} จาก {openPositions.length} รายการ — &quot;มูลค่าปัจจุบัน&quot; และส่วนกำไรค้างใน
              &quot;กำไร / ขาดทุน&quot; นับเฉพาะที่มีราคา
            </p>
          ) : openPositions.length > 0 ? (
            <p>ราคาอ้างอิงจากแหล่งข้อมูลตลาด (โหลดเมื่อเปิดหน้านี้)</p>
          ) : null}
          {txsLength > 0 ? (
            <p>ค่าธรรมเนียม + ภาษีสะสม {formatMoney(feesDisp, currency)}</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
