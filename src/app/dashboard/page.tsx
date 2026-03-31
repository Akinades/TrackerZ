"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SupportBlurb } from "@/components/shared/SupportBlurb";
import { useAuth } from "@/store/useAuth";
import { useDashboardPortfolio } from "@/hooks/useDashboardPortfolio";
import { DashboardDemoEmptyCard } from "@/components/dashboard/DashboardDemoEmptyCard";
import { DashboardPortfolioSummaryCard } from "@/components/dashboard/DashboardPortfolioSummaryCard";
import { DashboardPortfolioGrowthCard } from "@/components/dashboard/DashboardPortfolioGrowthCard";
import { DashboardTopFiveCard } from "@/components/dashboard/DashboardTopFiveCard";
import { DashboardHoldingsTableCard } from "@/components/dashboard/DashboardHoldingsTableCard";
import { DashboardAllocationPieCard } from "@/components/dashboard/DashboardAllocationPieCard";
import { DashboardPnlBarCard } from "@/components/dashboard/DashboardPnlBarCard";
import { DashboardAllocationTargetsCard } from "@/components/dashboard/DashboardAllocationTargetsCard";
import { getLevelByPerformance } from "@/lib/levels";
import { useI18n } from "@/components/shared/I18nProvider";
export default function DashboardPage() {
  const router = useRouter();
  const { user, hydrated: authHydrated } = useAuth();
  const { t } = useI18n();
  const d = useDashboardPortfolio();
  const currentLevel = getLevelByPerformance(d.totalReturnPct, d.txsLength);

  React.useEffect(() => {
    if (!authHydrated) return;
    if (!user) router.replace("/");
  }, [authHydrated, user, router]);

  if (authHydrated && !user) {
    return null;
  }

  return (
    <div className="fhd-text-tune grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">{t("nav.dashboard")}</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            {t("dashboard.introPrefix")}{" "}
            <span className="font-medium text-zinc-700">
              {t("dashboard.introUnreal")}
            </span>{" "}
            {t("dashboard.introMid")}{" "}
            <span className="font-medium text-zinc-700">
              {t("dashboard.introReal")}
            </span>{" "}
            {t("dashboard.introSuffix")}
            <span className="mt-1 block">
              <SupportBlurb as="span" className="text-sm text-zinc-600" />
            </span>
          </p>
        </div>
        <div className="w-full rounded-2xl  p-3 sm:w-[250px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium tracking-wide text-zinc-500">
                {t("dashboard.levelTitle")}
              </div>
              <div className="mt-1 text-2xl font-extrabold leading-tight text-emerald-800">
                {currentLevel.label}
              </div>
              <div className="mt-1 text-xs text-zinc-600">
                {t("dashboard.totalReturnLabel")}{" "}
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
      <DashboardPortfolioGrowthCard d={d} />
      <DashboardTopFiveCard d={d} />
      <DashboardHoldingsTableCard d={d} />
      <DashboardAllocationPieCard d={d} />
      <DashboardPnlBarCard d={d} />
      <DashboardAllocationTargetsCard d={d} />
    </div>
  );
}
