"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/useAuth";
import { CurrencyPicker } from "@/components/ui/CurrencyPicker";
import { Input } from "@/components/ui/Input";
import { useFxRate } from "@/store/useFxRate";
import { usePreferences } from "@/store/usePreferences";
import type { AssetType } from "@/types/transactions";
import { LEVELS, formatLevelRange, getLevelByPerformance } from "@/lib/levels";
import { useDashboardPortfolio } from "@/hooks/useDashboardPortfolio";
import { feedbackMailtoHref, getFeedbackEmail } from "@/lib/siteContact";
import { useI18n } from "@/components/shared/I18nProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { t } = useI18n();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/");
  }, [hydrated, user, router]);
  const { usdThb, setUsdThb, hydrated: fxHydrated } = useFxRate();
  const { prefs, hydrated: prefsHydrated, update } = usePreferences();
  const d = useDashboardPortfolio();
  const currentLevel = getLevelByPerformance(d.totalReturnPct, d.txsLength);
  const feedbackEmail = getFeedbackEmail();
  const feedbackMailHref =
    feedbackMailtoHref(t("feedback.subject")) ?? `mailto:${feedbackEmail}`;

  if (!hydrated) {
    return <Card className="p-6">{t("common.loading")}</Card>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold">{t("settings.title")}</div>
      </div>

      <Card className="p-4 sm:p-5">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            {t("settings.primaryCurrencyTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {t("settings.primaryCurrencyDesc")}
          </div>
        </div>
        <div className="mt-3">
          <CurrencyPicker />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
          <div className="text-sm font-semibold text-zinc-900">
            {t("settings.fxTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {t("settings.fxDesc")}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-700">{t("settings.fxLeft")}</div>
            <div className="w-[160px]">
              <Input
                inputMode="decimal"
                value={fxHydrated ? String(usdThb) : "…"}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  const n = Number(v);
                  if (Number.isFinite(n) && n > 0) setUsdThb(n);
                }}
                aria-label="USDTHB rate"
              />
            </div>
            <div className="text-sm text-zinc-700">{t("settings.fxRight")}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
          <div className="text-sm font-semibold text-zinc-900">
            {t("settings.costBasisTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {t("settings.costBasisDesc")}
          </div>
          <div className="mt-3">
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 text-sm"
              value={prefsHydrated ? prefs.costBasis : "avg"}
              onChange={(e) =>
                update({
                  costBasis: e.target.value === "fifo" ? "fifo" : "avg",
                })
              }
            >
              <option value="avg">{t("settings.costBasisAvg")}</option>
              <option value="fifo">{t("settings.costBasisFifo")}</option>
            </select>
            <div className="mt-2 text-xs leading-snug text-zinc-600">
              {prefsHydrated ? (
                prefs.costBasis === "fifo" ? (
                  <span>{t("settings.costBasisFifoHelp")}</span>
                ) : (
                  <span>{t("settings.costBasisAvgHelp")}</span>
                )
              ) : (
                <span>{t("settings.costBasisAvgHelp")}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
          <div className="text-sm font-semibold text-zinc-900">
            {t("settings.allocationTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {t("settings.allocationDesc")}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
            {(["gold", "stock", "forex", "crypto", "other"] as const).map(
              (k) => (
                <div key={k} className="grid gap-1">
                  <div className="text-xs font-medium text-zinc-700">
                    {k.toUpperCase()}
                  </div>
                  <Input
                    inputMode="decimal"
                    value={prefsHydrated ? String(prefs.allocation[k]) : "0"}
                    onChange={(e) => {
                      const n = Number(e.target.value.trim());
                      const v = Number.isFinite(n)
                        ? Math.max(0, Math.min(100, n))
                        : 0;
                      update({
                        allocation: {
                          ...prefs.allocation,
                          [k as AssetType]: v,
                        },
                      });
                    }}
                    aria-label={`Allocation ${k}`}
                  />
                </div>
              ),
            )}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            {t("settings.allocationTotal")}{" "}
            {prefsHydrated
              ? Math.round(
                  (prefs.allocation.gold +
                    prefs.allocation.stock +
                    prefs.allocation.forex +
                    prefs.allocation.crypto +
                    prefs.allocation.other) *
                    100,
                ) / 100
              : "…"}
            %
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-emerald-200/70  p-4">
          <div className="text-sm font-semibold text-zinc-900">
            {t("settings.levelsTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {t("settings.levelsCurrent")}{" "}
            <span className="font-semibold text-emerald-800">
              {d.hydrated ? currentLevel.label : t("settings.levelsLoading")}
            </span>{" "}
            {t("settings.levelsProfitPrefix")}{" "}
            {typeof d.totalReturnPct === "number"
              ? `${d.totalReturnPct.toFixed(2)}%`
              : "-"}
            )
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {t("settings.levelsCalcHint")}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {LEVELS.map((level) => (
              <div
                key={level.key}
                className="rounded-xl border border-emerald-100/80 bg-white p-3 text-center"
              >
                <div className="mx-auto h-20 w-20 overflow-hidden">
                  <img
                    src={level.iconFile}
                    alt={level.label}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">
                  {level.label}
                </div>
                <div className="mt-1 text-xs text-zinc-700">
                  {formatLevelRange(level)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {level.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* <Card className="p-4 sm:p-5">
        <div className="text-sm font-semibold text-zinc-900">{t("settings.contactTitle")}</div>
        <p className="mt-1 text-sm text-zinc-600">
          {t("settings.contactDesc")}
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          <span className="font-medium text-zinc-900">{t("settings.contactEmailLabel")}</span>{" "}
          <a
            href={feedbackMailHref}
            className="break-all font-mono text-emerald-700 underline-offset-2 hover:underline"
          >
            {feedbackEmail}
          </a>
        </p>
      </Card> */}
    </div>
  );
}
