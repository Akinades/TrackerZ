"use client";

import * as React from "react";
import type { AssetType } from "@/types/transactions";

export type CostBasisMethod = "avg" | "fifo";

export type AllocationTargets = Record<AssetType, number>; // percent 0-100

type Prefs = {
  costBasis: CostBasisMethod;
  allocation: AllocationTargets;
};

const KEY = "trackerz.prefs.v1";
const EVT = "trackerz:prefs";

const defaultPrefs: Prefs = {
  costBasis: "avg",
  allocation: { gold: 0, stock: 0, forex: 0, crypto: 0, cash: 0, other: 0 }
};

function safeRead(): Prefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    const v = JSON.parse(raw) as Partial<Prefs>;
    const costBasis = v.costBasis === "fifo" ? "fifo" : "avg";
    const a = (v.allocation ?? {}) as Partial<AllocationTargets>;
    const allocation: AllocationTargets = {
      gold: Number(a.gold ?? 0) || 0,
      stock: Number(a.stock ?? 0) || 0,
      forex: Number(a.forex ?? 0) || 0,
      crypto: Number(a.crypto ?? 0) || 0,
      cash: Number((a as any).cash ?? 0) || 0,
      other: Number(a.other ?? 0) || 0
    };
    return { costBasis, allocation };
  } catch {
    return defaultPrefs;
  }
}

function safeWrite(p: Prefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = React.useState<Prefs>(defaultPrefs);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setPrefs(safeRead());
    setHydrated(true);
    const onPrefs = (e: Event) => {
      const ce = e as CustomEvent<Prefs>;
      if (ce.detail) setPrefs(ce.detail);
    };
    window.addEventListener(EVT, onPrefs as EventListener);
    return () => window.removeEventListener(EVT, onPrefs as EventListener);
  }, []);

  const update = React.useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next: Prefs = {
        costBasis: patch.costBasis ?? prev.costBasis,
        allocation: patch.allocation ?? prev.allocation
      };
      safeWrite(next);
      try {
        window.dispatchEvent(new CustomEvent<Prefs>(EVT, { detail: next }));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { prefs, hydrated, update };
}

