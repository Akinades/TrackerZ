"use client";

import * as React from "react";
import type { AppCurrency } from "@/store/useCurrency";

const KEY = "trackerz.fx.latest.v1";
const EVT = "trackerz:fx:latest";

type FxLatestStored = {
  fetchedAt: string;
  rates: Partial<Record<AppCurrency, number>>;
};

function safeRead(): FxLatestStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as any;
    if (!json || typeof json !== "object") return null;
    const rates = json.rates as any;
    const fetchedAt = String(json.fetchedAt ?? "");
    if (!rates || typeof rates !== "object") return null;
    return { fetchedAt, rates };
  } catch {
    return null;
  }
}

function safeWrite(v: FxLatestStored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // ignore
  }
}

function sanitizeRates(rates: unknown): Partial<Record<AppCurrency, number>> {
  // Ensure core currencies always exist; otherwise converters may no-op.
  const out: Partial<Record<AppCurrency, number>> = { USD: 1, THB: 36 };
  if (!rates || typeof rates !== "object") return out;
  const want: AppCurrency[] = ["USD", "THB", "EUR", "JPY", "GBP", "CNY"];
  for (const c of want) {
    const v = Number((rates as any)[c]);
    if (c === "USD") {
      out.USD = 1;
      continue;
    }
    if (Number.isFinite(v) && v > 0) out[c] = v;
  }
  return out;
}

export function useFxRates() {
  const [rates, setRates] = React.useState<Partial<Record<AppCurrency, number>>>({ USD: 1, THB: 36 });
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = safeRead();
    if (stored?.rates) setRates(sanitizeRates(stored.rates));
    setHydrated(true);

    (async () => {
      try {
        const res = await fetch("/api/fx-latest", { method: "GET" });
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as any;
        const next = sanitizeRates(json?.rates);
        setRates(next);
        const payload: FxLatestStored = { fetchedAt: String(json?.fetchedAt ?? ""), rates: next };
        safeWrite(payload);
        try {
          window.dispatchEvent(new CustomEvent<FxLatestStored>(EVT, { detail: payload }));
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    })();

    const onFx = (e: Event) => {
      const ce = e as CustomEvent<FxLatestStored>;
      const next = sanitizeRates(ce.detail?.rates);
      setRates(next);
    };
    window.addEventListener(EVT, onFx as EventListener);
    return () => window.removeEventListener(EVT, onFx as EventListener);
  }, []);

  return { rates, hydrated };
}

