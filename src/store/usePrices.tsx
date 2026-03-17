"use client";

import * as React from "react";
import type { PriceMap } from "@/lib/storage";
import { loadPrices, savePrices } from "@/lib/storage";

export function usePrices() {
  const [prices, setPrices] = React.useState<PriceMap>({});
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setPrices(loadPrices());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    savePrices(prices);
  }, [prices, hydrated]);

  const setPrice = React.useCallback((assetName: string, price: number | null) => {
    const key = assetName.trim();
    if (!key) return;
    setPrices((prev) => {
      const next = { ...prev };
      if (price === null || !Number.isFinite(price) || price <= 0) {
        delete next[key];
      } else {
        next[key] = price;
      }
      return next;
    });
  }, []);

  return { prices, hydrated, setPrice };
}

