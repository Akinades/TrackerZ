"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { feedbackMailtoHref, getFeedbackEmail } from "@/lib/siteContact";
import { useAuth } from "@/store/useAuth";
import { useI18n } from "@/components/shared/I18nProvider";

export function SupportPageClient() {
  const { user, hydrated } = useAuth();
  const { t } = useI18n();
  const [qrBroken, setQrBroken] = React.useState(false);
  const feedbackEmail = getFeedbackEmail();
  const feedbackMailHref =
    feedbackMailtoHref(t("feedback.subject")) ?? `mailto:${feedbackEmail}`;

  const backHref = hydrated && user ? "/dashboard" : "/";
  const backLabel = hydrated && user ? t("support.backDashboard") : t("support.backHome");

  return (
    <div className="mx-auto grid max-w-4xl gap-8 py-2">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          {backLabel}
        </Link>
      </div>

      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
          {t("support.headingWorld")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {t("support.headingThanks")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          {t("support.intro")}
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-amber-50/25 to-white p-6 shadow-[0_24px_60px_-32px_rgba(16,185,129,0.2)] sm:p-8">
        <div className="grid animate-support-thanks gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500 motion-safe:animate-pulse" aria-hidden />
            <span className="rounded-full border border-amber-200/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
              {t("support.fromSchool")}
            </span>
            <Sparkles className="h-7 w-7 text-emerald-500 motion-safe:animate-pulse" aria-hidden />
          </div>
          <p className="mx-auto max-w-xl text-lg font-semibold leading-snug text-emerald-950 sm:text-xl">
            {t("support.thanksBody")}
          </p>
          <div
            className="mx-auto mt-1 h-1 w-32 max-w-full rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80"
            aria-hidden
          />
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_24px_60px_-28px_rgba(0,0,0,0.12)]">
        <div className="grid lg:grid-cols-[1fr_auto] lg:items-stretch">
          {/* ซ้าย: สนับสนุน + ติดต่อ */}
          <div className="grid gap-8 p-6 sm:p-8 lg:gap-10">
            <section className="grid gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-100/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  PromptPay
                </span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">สนับสนุนสำนัก</h2>
              <p className="max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                {t("support.cardSupportDesc")}
              </p>
              
            </section>

            <div
              className="h-px w-full bg-gradient-to-r from-zinc-200/80 via-emerald-200/60 to-zinc-200/80"
              aria-hidden
            />

            <section className="grid gap-3 rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/20 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-emerald-100">
                  <Mail className="h-4 w-4 text-emerald-700" aria-hidden />
                </span>
                {t("support.cardTitleFeedback")}
              </div>
              <p className="text-sm leading-relaxed text-zinc-600">
                {t("support.cardFeedbackDesc")}
              </p>
              <a
                href={feedbackMailHref}
                className="inline-flex w-fit max-w-full items-center gap-2 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-sm shadow-sm transition hover:border-emerald-300 hover:bg-white"
              >
                <span className="shrink-0 text-xs font-medium text-zinc-500">
                  {t("common.email")}
                </span>
                <span className="break-all font-mono text-sm font-medium text-emerald-800">
                  {feedbackEmail}
                </span>
              </a>
            </section>
          </div>

          {/* ขวา: QR */}
          <div className="flex flex-col justify-center border-t border-zinc-100 bg-gradient-to-b from-zinc-50/90 to-emerald-50/30 px-6 py-8 sm:px-8 lg:w-[min(100%,18.5rem)] lg:border-l lg:border-t-0 lg:py-10">
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-zinc-500 lg:text-left">
              {t("support.qrTitle")}
            </p>
            {!qrBroken ? (
              <div className="mx-auto w-full max-w-[16.5rem] overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_40px_-20px_rgba(16,185,129,0.35)] ring-1 ring-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/support/promptpay-qr.png"
                  alt="Thai QR Payment PromptPay — สแกนเพื่อโอนสนับสนุน TrackerZ"
                  className="block w-full object-contain object-top"
                  onError={() => setQrBroken(true)}
                />
              </div>
            ) : (
              <div className="mx-auto flex min-h-[12rem] w-full max-w-[16.5rem] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-4 text-center text-xs text-zinc-500">
                {t("support.qrMissing")}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
