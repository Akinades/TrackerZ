"use client";

import * as React from "react";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { useCurrency, type DisplayCurrency } from "@/store/useCurrency";

export function CurrencyPicker({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, hydrated } = useCurrency();

  const options: DisplayCurrency[] = ["THB", "USD"];

  if (!hydrated) return null;

  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      {options.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          className={
            c === currency
              ? "flex h-9 min-w-[96px] items-center justify-center gap-2 rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 text-white"
              : "flex h-9 min-w-[96px] items-center justify-center gap-2 rounded-2xl border border-zinc-200/70 bg-white px-3 text-zinc-700 hover:bg-zinc-50"
          }
          aria-label={`Set currency ${c}`}
        >
          <CurrencyBadge
            currency={c}
            size="md"
            variant={c === currency ? "inverted" : "default"}
            style="plain"
            className="shadow-none"
          />
        </button>
      ))}
    </div>
  );
}

