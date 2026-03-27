"use client";

import * as React from "react";
import type { UserPlan } from "@/lib/authStorage";
import { PlanLevelImage } from "@/components/pricing/PlanLevelImage";
import { Button } from "@/components/ui/Button";

export type PlanBadge = { text: string; variant: "promo" | "best" | "default" };

const badgeStyles: Record<PlanBadge["variant"], string> = {
  promo:
    "border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-sm",
  best: "border-emerald-300/80 bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-900 shadow-sm",
  default: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
};

export type PricingCardProps = {
  tier: UserPlan;
  /** ชื่อแพ็ก เช่น Pro Monthly */
  title: string;
  /** ชื่อไทย เช่น จอมยุทธ์ */
  titleTh: string;
  priceBlock: React.ReactNode;
  note?: React.ReactNode;
  features: string[];
  badge?: PlanBadge;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  ctaPending?: boolean;
  highlighted?: boolean;
};

export function PricingCard({
  tier,
  title,
  titleTh,
  priceBlock,
  note,
  features,
  badge,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaPending,
  highlighted
}: PricingCardProps) {
  return (
    <article
      className={
        highlighted
          ? "relative flex h-full flex-col rounded-[1.75rem] border-2 border-emerald-400/70 bg-gradient-to-b from-white via-emerald-50/40 to-white p-6 shadow-[0_28px_60px_-40px_rgba(16,185,129,0.55)] sm:p-7"
          : "relative flex h-full flex-col rounded-[1.75rem] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-45px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-7"
      }
    >
      {highlighted ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
        />
      ) : null}

      <div className="flex items-start gap-4">
        <div
          className={
            highlighted
              ? "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100/90 p-1.5 ring-2 ring-emerald-200/80"
              : "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-50 p-1.5 ring-1 ring-zinc-200/80"
          }
        >
          <PlanLevelImage tier={tier} className="relative h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                {title}
              </h3>
              <p className="text-sm font-medium text-emerald-700">{titleTh}</p>
            </div>
            {badge ? (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${badgeStyles[badge.variant]}`}
              >
                {badge.text}
              </span>
            ) : null}
          </div>
          <div className="mt-4">{priceBlock}</div>
          {note ? <div className="mt-2 text-sm text-zinc-600">{note}</div> : null}
        </div>
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm text-zinc-700">
        {features.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-0.5 text-emerald-600" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Button
          className={
            highlighted
              ? "h-11 w-full bg-emerald-600 text-white shadow-[0_14px_28px_-16px_rgba(5,150,105,0.9)] hover:bg-emerald-700"
              : "h-11 w-full border border-emerald-200/80 bg-white text-emerald-800 hover:bg-emerald-50/80"
          }
          variant={highlighted ? "primary" : "secondary"}
          disabled={ctaDisabled || ctaPending}
          onClick={onCta}
        >
          {ctaPending ? "กำลังดำเนินการ…" : ctaLabel}
        </Button>
      </div>
    </article>
  );
}
