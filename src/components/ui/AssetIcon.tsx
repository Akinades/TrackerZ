"use client";

import * as React from "react";
import Image from "next/image";
import type { AssetType } from "@/types/transactions";
import { getAssetIconSrc, getCurrencyFlagIconSrc, getForexFlags } from "@/lib/assetIcon";
import { assetTypeIcon } from "@/lib/icons";
import { IconBadge } from "@/components/ui/IconBadge";

export function AssetIcon({
  symbol,
  type,
  className
}: {
  symbol: string;
  type: AssetType;
  className?: string;
}) {
  if (type === "forex") {
    const fx = getForexFlags(symbol);
    if (fx) {
      const flagSrc = getCurrencyFlagIconSrc(fx.primary);
      return (
        <span
          className={[
            "inline-flex items-center justify-center overflow-hidden rounded-full border border-zinc-200/70 bg-white shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)]",
            className ?? "h-8 w-8"
          ].join(" ")}
          aria-hidden="true"
          title={`${fx.base}/${fx.quote}`}
        >
          {flagSrc ? (
            <Image
              src={flagSrc}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-[24px] leading-none -mt-[2px]">{fx.flag}</span>
          )}
        </span>
      );
    }
  }

  const src = getAssetIconSrc(symbol, type);
  if (!src) {
    return <IconBadge icon={assetTypeIcon(type)} className={className} />;
  }

  return (
    <span
      className={[
        "inline-flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)]",
        className ?? "h-8 w-8"
      ].join(" ")}
      aria-hidden="true"
      title={symbol}
    >
      <Image src={src} alt="" width={20} height={20} unoptimized />
    </span>
  );
}

