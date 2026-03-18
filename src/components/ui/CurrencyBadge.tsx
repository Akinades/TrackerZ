"use client";

import * as React from "react";
import Image from "next/image";
import type { AppCurrency } from "@/store/useCurrency";
import { getCurrencyFlagIconSrc } from "@/lib/assetIcon";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function CurrencyBadge({
  currency,
  size = "md",
  className,
  onToggle
}: {
  currency: AppCurrency;
  size?: "sm" | "md";
  className?: string;
  onToggle?: () => void;
}) {
  const s =
    size === "sm"
      ? "h-7 px-2.5 text-[11px] gap-1.5 rounded-2xl"
      : "h-9 px-3 text-xs gap-2 rounded-2xl";

  const flagSrc = getCurrencyFlagIconSrc(currency);

  const Inner = (
    <>
      <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-zinc-50">
        {flagSrc ? (
          <Image
            src={flagSrc}
            alt=""
            width={20}
            height={20}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[14px] leading-none">{currency}</span>
        )}
      </span>
      <span className="tabular-nums">{currency}</span>
    </>
  );

  const cls = cx(
    "inline-flex items-center border border-zinc-200/70 bg-white font-medium text-zinc-700 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)]",
    s,
    className
  );

  return onToggle ? (
    <button
      type="button"
      onClick={onToggle}
      className={cls}
      aria-label="Toggle currency"
    >
      {Inner}
    </button>
  ) : (
    <span className={cls}>{Inner}</span>
  );
}

