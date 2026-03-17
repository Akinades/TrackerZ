import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { loadPrices, savePrices } from "@/lib/storage";

export type PriceState = {
  hydrated: boolean;
  prices: Record<string, number>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
  lastUpdatedAt?: number;
};

const initialState: PriceState = {
  hydrated: false,
  prices: {},
  status: "idle"
};

export const hydratePrices = createAsyncThunk("prices/hydrate", async () => {
  return loadPrices();
});

export type MarketPriceResult = {
  prices: Record<string, number>;
  partial: boolean;
  missing: string[];
};

export const fetchMarketPrices = createAsyncThunk(
  "prices/fetchMarket",
  async (symbols: string[]) => {
    const uniq = Array.from(
      new Set(symbols.map((s) => s.trim()).filter(Boolean).map((s) => s.toUpperCase()))
    );
    if (uniq.length === 0) return { prices: {}, partial: false, missing: [] } satisfies MarketPriceResult;

    const res = await fetch(`/api/market-prices?symbols=${encodeURIComponent(uniq.join(","))}`, {
      method: "GET"
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Fetch failed (${res.status})`);
    }
    const json = (await res.json()) as MarketPriceResult;
    return json;
  }
);

const pricesSlice = createSlice({
  name: "prices",
  initialState,
  reducers: {
    setPrice(state, action: PayloadAction<{ symbol: string; price: number | null }>) {
      const key = action.payload.symbol.trim();
      if (!key) return;
      const sym = key.toUpperCase();
      const p = action.payload.price;
      if (p === null || !Number.isFinite(p) || p <= 0) {
        delete state.prices[sym];
      } else {
        state.prices[sym] = p;
      }
      savePrices(state.prices);
    },
    mergePrices(state, action: PayloadAction<Record<string, number>>) {
      for (const [k, v] of Object.entries(action.payload)) {
        const sym = k.trim().toUpperCase();
        if (!sym) continue;
        if (!Number.isFinite(v) || v <= 0) continue;
        state.prices[sym] = v;
      }
      savePrices(state.prices);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydratePrices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(hydratePrices.fulfilled, (state, action) => {
        state.prices = action.payload ?? {};
        state.hydrated = true;
        state.status = "succeeded";
      })
      .addCase(hydratePrices.rejected, (state, action) => {
        state.hydrated = true;
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchMarketPrices.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchMarketPrices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastUpdatedAt = Date.now();
        for (const [sym, price] of Object.entries(action.payload.prices ?? {})) {
          const k = sym.trim().toUpperCase();
          if (!k) continue;
          if (!Number.isFinite(price) || price <= 0) continue;
          state.prices[k] = price;
        }
        savePrices(state.prices);
      })
      .addCase(fetchMarketPrices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  }
});

export const { setPrice, mergePrices } = pricesSlice.actions;
export const pricesReducer = pricesSlice.reducer;

