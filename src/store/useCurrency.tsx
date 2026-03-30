"use client";

import * as React from "react";

// Display currency (global toggle) stays THB/USD.
export type DisplayCurrency = "THB" | "USD";

// Transaction / asset currencies can be broader.
export type AppCurrency = DisplayCurrency | "EUR" | "JPY" | "GBP" | "CNY";

/** สกุลที่บันทึกในฐานข้อมูลเมื่อรายการไม่มีฟิลด์ `currency` (ข้อมูลเก่า) */
export const DEFAULT_TX_CURRENCY: AppCurrency = "THB";

const KEY = "trackerz.currency.v1";
const EVT = "trackerz:currency";

function safeRead(): DisplayCurrency | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "THB" || v === "USD") return v;
    return null;
  } catch {
    return null;
  }
}

function safeWrite(v: DisplayCurrency) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    // ignore
  }
}

export function useCurrency() {
  const [currency, setCurrencyState] = React.useState<DisplayCurrency>("THB");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const syncFromStorage = () => {
      const stored = safeRead();
      if (stored) setCurrencyState(stored);
    };

    syncFromStorage();
    setHydrated(true);

    const onCurrency = (e: Event) => {
      const ce = e as CustomEvent<DisplayCurrency>;
      const v = ce.detail;
      if (v === "THB" || v === "USD") setCurrencyState(v);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      syncFromStorage();
    };
    const onFocus = () => syncFromStorage();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncFromStorage();
    };
    window.addEventListener(EVT, onCurrency as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener(EVT, onCurrency as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const setCurrency = React.useCallback((v: DisplayCurrency) => {
    setCurrencyState(v);
    safeWrite(v);
    try {
      window.dispatchEvent(new CustomEvent<DisplayCurrency>(EVT, { detail: v }));
    } catch {
      // ignore
    }
  }, []);

  return { currency, setCurrency, hydrated };
}

