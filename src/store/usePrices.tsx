"use client";

import * as React from "react";
import type { PriceMap } from "@/lib/storage";
import { useAppDispatch, useAppSelector } from "@/store/redux/hooks";
import { fetchMarketPrices, hydratePrices, setPrice as setPriceAction } from "@/store/redux/pricesSlice";

export function usePrices() {
  const dispatch = useAppDispatch();
  const prices = useAppSelector((s) => s.prices.prices) as PriceMap;
  const hydrated = useAppSelector((s) => s.prices.hydrated);
  const status = useAppSelector((s) => s.prices.status);
  const error = useAppSelector((s) => s.prices.error);
  const lastUpdatedAt = useAppSelector((s) => s.prices.lastUpdatedAt);

  React.useEffect(() => {
    dispatch(hydratePrices());
  }, [dispatch]);

  const setPrice = React.useCallback((assetName: string, price: number | null) => {
    dispatch(setPriceAction({ symbol: assetName, price }));
  }, [dispatch]);

  const refreshMarket = React.useCallback(
    (symbols: string[]) => {
      dispatch(fetchMarketPrices(symbols));
    },
    [dispatch]
  );

  return { prices, hydrated, setPrice, refreshMarket, status, error, lastUpdatedAt };
}

