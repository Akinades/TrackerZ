"use client";

import * as React from "react";

const KEY = "trackerz.fx.usdthb.v1";
const EVT = "trackerz:fx:usdthb";

function safeRead(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

function safeWrite(v: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(v));
  } catch {
    // ignore
  }
}

export function useFxRate() {
  const [usdThb, setUsdThbState] = React.useState<number>(36);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = safeRead();
    if (stored) setUsdThbState(stored);
    setHydrated(true);

    const onFx = (e: Event) => {
      const ce = e as CustomEvent<number>;
      const v = ce.detail;
      if (Number.isFinite(v) && v > 0) setUsdThbState(v);
    };
    window.addEventListener(EVT, onFx as EventListener);
    return () => window.removeEventListener(EVT, onFx as EventListener);
  }, []);

  const setUsdThb = React.useCallback((v: number) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return;
    setUsdThbState(n);
    safeWrite(n);
    try {
      window.dispatchEvent(new CustomEvent<number>(EVT, { detail: n }));
    } catch {
      // ignore
    }
  }, []);

  return { usdThb, setUsdThb, hydrated };
}

