"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/components/shared/I18nProvider";
import { LanguageToggle } from "@/components/shared/LanguageToggle";

export default function HomePage() {
  const { t } = useI18n();
  return (
    <div className="grid gap-12 py-2">
      {/* HERO (full-bleed background) */}
      <section className="-mx-4 overflow-hidden rounded-[2.5rem] border border-zinc-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-[0_30px_90px_-70px_rgba(0,0,0,0.45)]">
        <div className="relative px-4 py-10 sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-100/80 blur-3xl"
          />

          <div className="relative grid gap-10 sm:grid-cols-2 sm:items-center">
            <div className="absolute right-0 top-0 z-10">
              <LanguageToggle />
            </div>
            <div className="grid gap-5">
              <div className="grid gap-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-zinc-900 bg-clip-text text-transparent">
                    TrackerZ
                  </span>
                  <br />
                  {t("home.heroLine1")}
                  <br />
                  {t("home.heroLine2")}
                </h1>
                <p className="max-w-xl text-base text-zinc-600">
                  {t("home.heroSubtitle")}
                </p>
                <div className="max-w-xl rounded-3xl border border-emerald-200/70 bg-white/80 p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.25)] backdrop-blur">
                  <div className="flex items-center gap-3 justify-center">
                    <div className="min-w-0">
                      <div className="text-md font-semibold italic text-zinc-900">
                        “If you can&apos;t measure it, you can&apos;t improve
                        it.”
                      </div>
                      <div className="mt-1 text-sm text-zinc-700">
                        {t("home.quoteThai")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="h-11 w-full px-6 text-base shadow-[0_16px_30px_-18px_rgba(0,0,0,0.45)] sm:w-auto">
                    {t("home.ctaStartFree")}
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    className="h-11 w-full px-6 text-base sm:w-auto"
                  >
                    {t("home.ctaLogin")}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Responsive
                </span>
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Average Cost
                </span>
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Pie + P/L Bar
                </span>
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Cloud Database (MongoDB)
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
                <Image
                  src="/landing/personal-finance.png"
                  alt="Mobile analytics illustration"
                  fill
                  className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
                  priority
                />
              </div>
              <div className="mt-4 text-center text-xs text-zinc-500">
                {t("home.dataStored")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="grid gap-4">
            <div className="relative h-28 w-full sm:h-32">
              <Image
                src="/landing/reports.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t("home.featureLogTitle")}</div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.featureLogDesc")}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid gap-4">
            <div className="relative h-28 w-full sm:h-32">
              <Image
                src="/landing/investing.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t("home.featureAvgCostTitle")}</div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.featureAvgCostDesc")}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid gap-4">
            <div className="relative h-28 w-full sm:h-32">
              <Image
                src="/landing/realtime.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t("home.featureChartTitle")}</div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.featureChartDesc")}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* WHY TrackerZ */}
      <section className="grid gap-4">
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold">{t("home.whyTitle")}</div>
              <div className="mt-1 text-sm text-zinc-600">
                {t("home.whyDesc")}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              Measure → Improve
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">
                {t("home.whyCardFastTitle")}
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.whyCardFastDesc")}
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">
                {t("home.whyCardTrueCostTitle")}
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.whyCardTrueCostDesc")}
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">
                {t("home.whyCardImproveTitle")}
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.whyCardImproveDesc")}
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">
                {t("home.whyCardOwnDataTitle")}
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {t("home.whyCardOwnDataDesc")}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="text-sm font-semibold">{t("home.howTitle")}</div>
          <div className="mt-2 grid gap-3 text-sm text-zinc-600">
            <div>
              <span className="font-medium text-zinc-900">1)</span>{" "}
              {t("home.howStep1")}
            </div>
            <div>
              <span className="font-medium text-zinc-900">2)</span>{" "}
              {t("home.howStep2")}
            </div>
            <div>
              <span className="font-medium text-zinc-900">3)</span>{" "}
              {t("home.howStep3")}
            </div>
            <div className="relative mx-auto mt-3 h-40 w-full max-w-md sm:h-44">
              <Image
                src="/landing/dashboard.png"
                alt=""
                fill
                className="object-contain opacity-95"
              />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-emerald-50" />
          <div className="relative grid gap-3">
            <div className="text-sm font-semibold">{t("home.devicesTitle")}</div>
            <div className="text-sm text-zinc-600">{t("home.devicesDesc")}</div>
            <div className="relative mx-auto mt-3 h-40 w-full max-w-md sm:h-44">
              <Image
                src="/landing/mobile.png"
                alt=""
                fill
                className="object-contain opacity-95"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="p-6">
          <div className="text-sm font-semibold">{t("home.faqTitle")}</div>
          <div className="mt-3 grid gap-3 text-sm text-zinc-600">
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4">
              <div className="font-medium text-zinc-900">{t("home.faqFreeQ")}</div>
              <div className="mt-1">
                {t("home.faqFreeAPrefix")}{" "}
                <Link href="/support" className="font-medium text-emerald-700 underline underline-offset-2">
                  {t("authMenu.support")}
                </Link>{" "}
                {t("home.faqFreeASuffix")}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4">
              <div className="font-medium text-zinc-900">{t("home.faqAssetsQ")}</div>
              <div className="mt-1">{t("home.faqAssetsA")}</div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4">
              <div className="font-medium text-zinc-900">{t("home.faqAccountingQ")}</div>
              <div className="mt-1">{t("home.faqAccountingA")}</div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
