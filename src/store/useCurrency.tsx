"use client";

import * as React from "react";

export type AppCurrency = "THB" | "USD";

const KEY = "trackerz.currency.v1";
const EVT = "trackerz:currency";

function safeRead(): AppCurrency | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "THB" || v === "USD") return v;
    return null;
  } catch {
    return null;
  }
}

function safeWrite(v: AppCurrency) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    // ignore
  }
}

export function useCurrency() {
  const [currency, setCurrencyState] = React.useState<AppCurrency>("THB");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = safeRead();
    if (stored) setCurrencyState(stored);
    setHydrated(true);

    const onCurrency = (e: Event) => {
      const ce = e as CustomEvent<AppCurrency>;
      const v = ce.detail;
      if (v === "THB" || v === "USD") setCurrencyState(v);
    };
    window.addEventListener(EVT, onCurrency as EventListener);
    return () => window.removeEventListener(EVT, onCurrency as EventListener);
  }, []);

  const setCurrency = React.useCallback((v: AppCurrency) => {
    setCurrencyState(v);
    safeWrite(v);
    try {
      window.dispatchEvent(new CustomEvent<AppCurrency>(EVT, { detail: v }));
    } catch {
      // ignore
    }
  }, []);

  return { currency, setCurrency, hydrated };
}

