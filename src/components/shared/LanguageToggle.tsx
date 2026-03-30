"use client";

import * as React from "react";
import Image from "next/image";
import type { AppLocale } from "@/i18n";
import { useI18n } from "@/components/shared/I18nProvider";
import { getLocaleFlagIconSrc } from "@/lib/assetIcon";

type Props = {
  className?: string;
  size?: "sm" | "md";
  variant?: "default" | "inverted";
  style?: "pill" | "plain";
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function labelFor(locale: AppLocale) {
  return locale === "th" ? "ไทย" : "English";
}

export function LanguageToggle({
  className,
  size = "sm",
  variant = "default",
  style = "pill",
}: Props) {
  const { locale, setLocale, t } = useI18n();
  const next: AppLocale = locale === "th" ? "en" : "th";
  const flagSrc = getLocaleFlagIconSrc(locale);

  const s =
    style === "plain"
      ? size === "sm"
        ? "text-[11px] gap-1.5"
        : "text-xs gap-2"
      : size === "sm"
        ? "h-7 px-2.5 text-[11px] gap-1.5 rounded-2xl"
        : "h-9 px-3 text-xs gap-2 rounded-2xl";

  const flagWrapCls =
    variant === "inverted" ? "bg-white/15 ring-1 ring-white/20" : "bg-zinc-50";

  const base =
    style === "plain"
      ? "inline-flex items-center font-medium"
      : variant === "inverted"
        ? "inline-flex items-center border border-white/20 bg-transparent font-medium text-white shadow-none"
        : "inline-flex items-center border border-zinc-200/70 bg-white font-medium text-zinc-700 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)]";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={cx(
        base,
        s,
        variant === "inverted" ? "text-white" : "text-zinc-700",
        className,
      )}
      aria-label={`${t("authMenu.language")}: ${labelFor(locale)} (${locale === "th" ? t("locale.shortTh") : t("locale.shortEn")}). ${t("authMenu.switchTo")} ${labelFor(next)} (${next === "th" ? t("locale.shortTh") : t("locale.shortEn")})`}
    >
      <span
        className={cx(
          "inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full",
          flagWrapCls,
        )}
        aria-hidden
      >
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
          <span className="text-xl leading-none">
            {locale === "th" ? "TH" : "EN"}
          </span>
        )}
      </span>
      <span className="tabular-nums">
        {locale === "th" ? t("locale.shortTh") : t("locale.shortEn")}{" "}
      </span>
    </button>
  );
}
