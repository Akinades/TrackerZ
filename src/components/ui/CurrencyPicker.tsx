"use client";

import * as React from "react";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { useCurrency, type AppCurrency } from "@/store/useCurrency";

export function CurrencyPicker({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, hydrated } = useCurrency();

  const options: AppCurrency[] = ["THB", "USD"];

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
              ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-2 py-2 text-white"
              : "rounded-2xl border border-zinc-200/70 bg-white px-2 py-2 text-zinc-700 hover:bg-zinc-50"
          }
          aria-label={`Set currency ${c}`}
        >
          <CurrencyBadge currency={c} size="sm" className={c === currency ? "border-transparent bg-transparent text-white shadow-none" : "shadow-none"} />
        </button>
      ))}
    </div>
  );
}

