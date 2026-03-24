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

export default function DashboardPage() {
  const { user, hydrated: authHydrated } = useAuth();
  const d = useDashboardPortfolio();

  if (authHydrated && !user) {
    return <DashboardGuestPrompt />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">พอร์ตภาพรวม</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            ดูตัวเลขสำคัญด้านล่าง แล้วเจาะรายละเอียดแต่ละสินทรัพย์ในตาราง —{" "}
            <span className="font-medium text-zinc-700">กำไรค้าง</span> คิดจากราคาตลาดล่าสุดเทียบต้นทุนเฉลี่ย,{" "}
            <span className="font-medium text-zinc-700">ขายแล้ว</span> คือผลจากการขายในอดีต
          </p>
        </div>
      </div>

      {d.hydrated && d.txsLength === 0 ? <DashboardDemoEmptyCard onSeedDemo={d.seedDemo} /> : null}

      <DashboardPortfolioSummaryCard d={d} />
      <DashboardTopFiveCard d={d} />
      <DashboardHoldingsTableCard d={d} />
      <DashboardAllocationPieCard d={d} />
      <DashboardPnlBarCard d={d} />
      {user?.plan !== "free" ? <DashboardAllocationTargetsCard d={d} /> : null}
    </div>
  );
}
