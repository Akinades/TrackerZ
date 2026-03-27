"use client";

import { useAuth } from "@/store/useAuth";
import { useDashboardPortfolio } from "@/hooks/useDashboardPortfolio";
import { DashboardGuestPrompt } from "@/components/dashboard/DashboardGuestPrompt";
import { DashboardDemoEmptyCard } from "@/components/dashboard/DashboardDemoEmptyCard";
import { DashboardPortfolioSummaryCard } from "@/components/dashboard/DashboardPortfolioSummaryCard";
import { DashboardTopFiveCard } from "@/components/dashboard/DashboardTopFiveCard";
import { DashboardHoldingsTableCard } from "@/components/dashboard/DashboardHoldingsTableCard";
import { DashboardAllocationPieCard } from "@/components/dashboard/DashboardAllocationPieCard";
import { DashboardPnlBarCard } from "@/components/dashboard/DashboardPnlBarCard";
import { DashboardAllocationTargetsCard } from "@/components/dashboard/DashboardAllocationTargetsCard";
import { getLevelByPerformance } from "@/lib/levels";
import Link from "next/link";

export default function DashboardPage() {
  const { user, hydrated: authHydrated } = useAuth();
  const d = useDashboardPortfolio();
  const currentLevel = getLevelByPerformance(d.totalReturnPct, d.txsLength);

  if (authHydrated && !user) {
    return <DashboardGuestPrompt />;
  }

  return (
    <div className="fhd-text-tune grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">พอร์ตภาพรวม</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            ดูตัวเลขสำคัญด้านล่าง แล้วเจาะรายละเอียดแต่ละสินทรัพย์ในตาราง —{" "}
            <span className="font-medium text-zinc-700">กำไรค้าง</span>{" "}
            คิดจากราคาตลาดล่าสุดเทียบต้นทุนเฉลี่ย,{" "}
            <span className="font-medium text-zinc-700">ขายแล้ว</span>{" "}
            คือผลจากการขายในอดีต
          </p>
        </div>
        <div className="w-full rounded-2xl  p-3 sm:w-[250px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium tracking-wide text-zinc-500">
                ระดับพอร์ต
              </div>
              <div className="mt-1 text-2xl font-extrabold leading-tight text-emerald-800">
                {currentLevel.label}
              </div>
              <div className="mt-1 text-xs text-zinc-600">
                กำไรรวม:{" "}
                {typeof d.totalReturnPct === "number"
                  ? `${d.totalReturnPct.toFixed(2)}%`
                  : "-"}
              </div>
            </div>
            <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl  bg-transparent">
              <img
                src={currentLevel.iconFile}
                alt={currentLevel.label}
                className="h-full w-full object-contain"
              />
            </span>
          </div>
        </div>
      </div>

      {d.hydrated && d.txsLength === 0 ? (
        <DashboardDemoEmptyCard onSeedDemo={d.seedDemo} />
      ) : null}

      <DashboardPortfolioSummaryCard d={d} />
      <DashboardTopFiveCard d={d} />
      <DashboardHoldingsTableCard d={d} />
      <DashboardAllocationPieCard d={d} />
      <DashboardPnlBarCard d={d} />
      {user?.plan !== "free" ? <DashboardAllocationTargetsCard d={d} /> : null}
    </div>
  );
}
