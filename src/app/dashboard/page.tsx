"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { IconBadge } from "@/components/ui/IconBadge";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { PortfolioPie } from "@/components/charts/PortfolioPie";
import { PortfolioPnlBar } from "@/components/charts/PortfolioPnlBar";
import { useTransactions } from "@/store/useTransactions";
import { usePrices } from "@/store/usePrices";
import { useAuth } from "@/store/useAuth";
import { useCurrency } from "@/store/useCurrency";
import { useFxRate } from "@/store/useFxRate";
import { ASSET_TYPES } from "@/lib/constants";
import { demoPrices, demoTransactions } from "@/lib/demoData";
import { formatMoney, formatNumber2 } from "@/lib/format";
import { metricIcon, pnlIcon } from "@/lib/icons";
import {
  computePositionsAvgCost,
  computePositionsFifo,
  currentValue,
  investedTotal,
  realizedPnlFromPositions,
  totalFees,
  unrealizedPnl,
} from "@/lib/calculations";
import { clearAllData, savePrices, saveTransactions } from "@/lib/storage";
import { usePreferences } from "@/store/usePreferences";

function formatPct(n: number) {
  return formatNumber2(n, "th-TH");
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] dark:border-zinc-800/70 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
        <IconBadge icon={icon} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hydrated: authHydrated } = useAuth();
  const { txs, hydrated } = useTransactions();
  const { currency } = useCurrency();
  const { usdThb } = useFxRate();
  const { prefs } = usePreferences();
  const {
    prices,
    hydrated: pricesHydrated,
    setPrice,
    refreshMarket,
    status: priceStatus,
    error: priceError,
    lastUpdatedAt,
  } = usePrices();
  const [pieMode, setPieMode] = React.useState<"asset" | "type">("asset");

  const fx = React.useMemo(
    () => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36),
    [usdThb],
  );
  const toDisplay = React.useCallback(
    (nUsd: number) => {
      const v = Number.isFinite(nUsd) ? nUsd : 0;
      return currency === "THB" ? v * fx : v;
    },
    [currency, fx],
  );
  const fromDisplay = React.useCallback(
    (n: number) => {
      const v = Number.isFinite(n) ? n : 0;
      return currency === "THB" ? v / fx : v;
    },
    [currency, fx],
  );

  const priceOf = React.useCallback(
    (symbol: string) => {
      const k = symbol.trim().toUpperCase();
      const v = prices[k];
      return Number.isFinite(v) && v > 0 ? v : null;
    },
    [prices],
  );

  const priceOfDisplay = React.useCallback(
    (symbol: string) => {
      const px = priceOf(symbol);
      if (!px) return null;
      const v = currency === "THB" ? px * fx : px;
      return Number.isFinite(v) && v > 0 ? v : null;
    },
    [currency, fx, priceOf],
  );

  const txsUsd = React.useMemo(() => {
    return txs.map((t) => {
      const src = t.currency ?? "THB";
      if (src === "USD") return t;
      // THB -> USD
      return {
        ...t,
        price: t.price / fx,
        fee: t.fee / fx,
        currency: "USD" as const,
      };
    });
  }, [txs, fx]);

  const positions = React.useMemo(
    () => (prefs.costBasis === "fifo" ? computePositionsFifo(txsUsd) : computePositionsAvgCost(txsUsd)),
    [txsUsd, prefs.costBasis]
  );
  const invested = React.useMemo(() => investedTotal(txsUsd), [txsUsd]);
  const fees = React.useMemo(() => totalFees(txsUsd), [txsUsd]);
  const realized = React.useMemo(
    () => realizedPnlFromPositions(positions),
    [positions],
  );
  const unrealized = React.useMemo(
    () => unrealizedPnl(positions, prices),
    [positions, prices],
  );
  const net = React.useMemo(
    () => Math.round((realized + unrealized) * 100) / 100,
    [realized, unrealized],
  );
  const valueNow = React.useMemo(
    () => currentValue(positions, prices),
    [positions, prices],
  );
  const roiPct = React.useMemo(
    () => (invested > 0 ? (net / invested) * 100 : 0),
    [invested, net],
  );
  const equityDelta = React.useMemo(
    () => Math.round((valueNow - invested) * 100) / 100,
    [valueNow, invested],
  );

  const investedDisp = React.useMemo(() => toDisplay(invested), [invested, toDisplay]);
  const valueNowDisp = React.useMemo(() => toDisplay(valueNow), [valueNow, toDisplay]);
  const realizedDisp = React.useMemo(() => toDisplay(realized), [realized, toDisplay]);
  const unrealizedDisp = React.useMemo(() => toDisplay(unrealized), [unrealized, toDisplay]);
  const feesDisp = React.useMemo(() => toDisplay(fees), [fees, toDisplay]);
  const netDisp = React.useMemo(
    () => Math.round(toDisplay(net) * 100) / 100,
    [net, toDisplay],
  );
  const equityDeltaDisp = React.useMemo(
    () => Math.round(toDisplay(equityDelta) * 100) / 100,
    [equityDelta, toDisplay],
  );

  const allocationRows = React.useMemo(() => {
    const byType = new Map<string, number>();
    for (const p of positions) {
      const px = prices[p.assetName];
      if (!Number.isFinite(px) || px <= 0) continue;
      const valueUsd = p.qty * px;
      const prev = byType.get(p.assetType) ?? 0;
      byType.set(p.assetType, prev + valueUsd);
    }
    const totalUsd = Array.from(byType.values()).reduce((s, v) => s + v, 0);
    const keys = ["gold", "stock", "forex", "crypto", "other"] as const;
    return keys.map((k) => {
      const vUsd = byType.get(k) ?? 0;
      const pct = totalUsd > 0 ? (vUsd / totalUsd) * 100 : 0;
      const target = prefs.allocation?.[k] ?? 0;
      return { type: k, pct: Math.round(pct * 100) / 100, target };
    });
  }, [positions, prices, prefs.allocation]);

  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [refreshEvery, setRefreshEvery] = React.useState<60 | 300 | 900>(300);
  const [draftPrice, setDraftPrice] = React.useState<Record<string, string>>({});

  const fmt2 = React.useCallback((n: number) => {
    const v = Number.isFinite(n) ? n : 0;
    return (Math.round(v * 100) / 100).toFixed(2);
  }, []);

  const marketSymbols = React.useMemo(() => {
    return Array.from(
      new Set(positions.map((p) => p.assetName.trim()).filter(Boolean)),
    );
  }, [positions]);

  const marketSymbolsKey = React.useMemo(
    () => marketSymbols.join("|"),
    [marketSymbols],
  );

  React.useEffect(() => {
    if (!autoRefresh) return;
    if (!hydrated || !pricesHydrated) return;
    if (marketSymbols.length === 0) return;

    refreshMarket(marketSymbols);
    const id = window.setInterval(() => {
      refreshMarket(marketSymbols);
    }, refreshEvery * 1000);
    return () => window.clearInterval(id);
    // marketSymbolsKey ensures stable dependency (positions array is recreated often)
  }, [
    autoRefresh,
    hydrated,
    pricesHydrated,
    marketSymbols,
    marketSymbolsKey,
    refreshEvery,
    refreshMarket,
  ]);

  const allocationByAsset = React.useMemo(() => {
    return positions
      .map((p) => {
        const px = priceOf(p.assetName);
        const v = px ? p.qty * px : 0;
        return { name: p.assetName, value: Math.round(toDisplay(v) * 100) / 100 };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [positions, priceOf, toDisplay]);

  const allocationByType = React.useMemo(() => {
    const labelOf = new Map(
      ASSET_TYPES.map((t) => [t.value, t.label] as const),
    );
    const sum: Record<string, number> = {};
    for (const p of positions) {
      const px = priceOf(p.assetName);
      if (!px) continue;
      const label = labelOf.get(p.assetType) ?? p.assetType;
      sum[label] = (sum[label] ?? 0) + p.qty * px;
    }
    return Object.entries(sum)
      .map(([name, value]) => ({ name, value: Math.round(toDisplay(value) * 100) / 100 }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [positions, priceOf, toDisplay]);

  const allocation = pieMode === "type" ? allocationByType : allocationByAsset;

  const pnlRows = React.useMemo(() => {
    return positions
      .map((p) => {
        const px = priceOf(p.assetName);
        const u = px ? (px - p.avgCost) * p.qty : 0;
        return {
          name: p.assetName,
          realized: Math.round(toDisplay(p.realizedPnl) * 100) / 100,
          unrealized: Math.round(toDisplay(u) * 100) / 100,
        };
      })
      .filter((r) => r.realized !== 0 || r.unrealized !== 0)
      .sort(
        (a, b) =>
          Math.abs(b.realized + b.unrealized) -
          Math.abs(a.realized + a.unrealized),
      )
      .slice(0, 12);
  }, [positions, priceOf, toDisplay]);

  const seedDemo = React.useCallback(() => {
    saveTransactions(demoTransactions());
    savePrices(demoPrices());
    window.location.reload();
  }, []);

  const clearData = React.useCallback(() => {
    clearAllData();
    window.location.reload();
  }, []);

  if (authHydrated && !user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">
            เข้าสู่ระบบเพื่อดู Dashboard
          </div>
          <div className="text-sm text-zinc-600">
            เพื่อให้ข้อมูลพอร์ตเป็นของคุณเอง กรุณาเข้าสู่ระบบก่อนใช้งาน
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link href="/login?next=/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/register?next=/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                สมัครสมาชิก
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">พอร์ตภาพรวม</h1>
          <p className="text-sm text-zinc-600">
            MVP: ต้นทุนเฉลี่ย (Average Cost) แยกตามสินทรัพย์ + ใส่
            “ราคาปัจจุบัน” เพื่อคำนวณมูลค่า/กำไรขาดทุน
          </p>
        </div>
      </div>

      {hydrated && pricesHydrated && txs.length === 0 ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">ยังไม่มีข้อมูล</div>
              <div className="text-xs text-zinc-400">
                กดเพื่อโหลดข้อมูลตัวอย่างให้เห็นตัวเลข/กราฟทันที
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={seedDemo}
                className="rounded-md border border-zinc-700 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-950"
              >
                โหลด Demo data
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="เงินลงทุนทั้งหมด (Buy + Fee)"
          icon={metricIcon("invested")}
          value={hydrated ? formatMoney(investedDisp, currency) : "…"}
        />
        <Metric
          label="มูลค่าปัจจุบัน (ต้องใส่ราคา)"
          icon={metricIcon("value")}
          value={
            hydrated && pricesHydrated ? formatMoney(valueNowDisp, currency) : "…"
          }
        />
        <div className="rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              กำไรสุทธิ (Realized+Unrealized)
            </div>
            <IconBadge
              icon={pnlIcon(net)}
              tone={net > 0 ? "emerald" : net < 0 ? "rose" : "neutral"}
            />
          </div>
          <div
            className={[
              "mt-2 text-2xl font-semibold tabular-nums",
              !hydrated
                ? "text-zinc-900"
                : net > 0
                  ? "text-emerald-700"
                  : net < 0
                    ? "text-rose-600"
                    : "text-zinc-900",
            ].join(" ")}
          >
            {!hydrated
              ? "…"
              : `${netDisp > 0 ? "+" : netDisp < 0 ? "-" : ""}${formatMoney(Math.abs(netDisp), currency)}`}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">ผลตอบแทน (ROI)</div>
            <IconBadge icon={metricIcon("roi")} />
          </div>
          <div
            className={[
              "mt-2 text-2xl font-semibold tabular-nums",
              !hydrated
                ? "text-zinc-900"
                : roiPct > 0
                  ? "text-emerald-700"
                  : roiPct < 0
                    ? "text-rose-600"
                    : "text-zinc-900",
            ].join(" ")}
          >
            {!hydrated ? "…" : `${roiPct > 0 ? "+" : ""}${formatPct(roiPct)}%`}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            สุทธิ:{" "}
            {!hydrated
              ? "…"
              : `${equityDeltaDisp > 0 ? "+" : equityDeltaDisp < 0 ? "-" : ""}${formatMoney(Math.abs(equityDeltaDisp), currency)}`}
          </div>
        </div>
      </div>

      <Card>
        <div className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Positions (สรุป)</div>
              <div className="text-xs text-zinc-500">
                Top 5 ตามมูลค่าปัจจุบัน
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              {hydrated && pricesHydrated
                ? "อิงราคาปัจจุบันที่กรอก/ดึงมา"
                : "กำลังโหลด…"}
            </div>
          </div>

          {!hydrated || !pricesHydrated ? (
            <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          ) : positions.length === 0 ? (
            <div className="text-sm text-zinc-400">ยังไม่มี position</div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-zinc-200/70">
              <div className="grid grid-cols-12 gap-2 bg-zinc-50/70 px-4 py-3 text-xs font-medium text-zinc-600">
                <div className="col-span-4">สินทรัพย์</div>
                <div className="col-span-3 text-right">มูลค่า</div>
                <div className="col-span-2 text-right">ราคา</div>
                <div className="col-span-3 text-right">P/L</div>
              </div>
              <div className="divide-y divide-zinc-200/70 bg-white">
                {positions
                  .map((p) => {
                    const price = priceOf(p.assetName);
                    const value = price ? toDisplay(p.qty * price) : 0;
                    const u = price ? toDisplay((price - p.avgCost) * p.qty) : 0;
                    const pl = Math.round((toDisplay(p.realizedPnl) + u) * 100) / 100;
                    return {
                      p,
                      price: price ? toDisplay(price) : null,
                      value: Math.round(value * 100) / 100,
                      pl,
                    };
                  })
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map(({ p, price, value, pl }) => (
                    <div
                      key={p.assetName}
                      className="grid grid-cols-12 items-center gap-2 px-4 py-3"
                    >
                      <div className="col-span-4">
                        <div className="flex items-start gap-2">
                          <AssetIcon
                            symbol={p.assetName}
                            type={p.assetType}
                            className="h-7 w-7 rounded-xl"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-900">
                              {p.assetName}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Qty {p.qty} • Avg{" "}
                              {Math.round(p.avgCost * 100) / 100}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 text-right text-sm tabular-nums text-zinc-900">
                        {value > 0 ? formatMoney(value, currency) : "—"}
                      </div>
                      <div className="col-span-2 text-right text-sm tabular-nums text-zinc-700">
                        {price ? formatMoney(price, currency) : "—"}
                      </div>
                      <div
                        className={[
                          "col-span-3 text-right text-sm font-medium tabular-nums",
                          pl > 0
                            ? "text-emerald-700"
                            : pl < 0
                              ? "text-rose-600"
                              : "text-zinc-700",
                        ].join(" ")}
                      >
                        {pl === 0
                          ? "—"
                          : `${pl > 0 ? "+" : "-"}${formatMoney(Math.abs(pl), currency)}`}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-medium">
                สัดส่วนพอร์ต (ตามมูลค่าปัจจุบัน)
              </div>
              <div className="text-xs text-zinc-500">
                กรอก “ราคาปัจจุบัน” ก่อน กราฟถึงจะมีข้อมูล
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPieMode("asset")}
                className={
                  pieMode === "asset"
                    ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                    : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                }
              >
                แยกตามสินทรัพย์
              </button>
              <button
                type="button"
                onClick={() => setPieMode("type")}
                className={
                  pieMode === "type"
                    ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                    : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                }
              >
                รวมตามประเภท
              </button>
            </div>
          </div>
          {hydrated && pricesHydrated ? (
            <PortfolioPie data={allocation} />
          ) : (
            <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          )}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <div>
            <div className="text-sm font-medium">กำไร/ขาดทุนรายสินทรัพย์</div>
            <div className="text-xs text-zinc-500">
              แสดง Top 12 ตามขนาด P/L (Realized + Unrealized)
            </div>
          </div>
          {hydrated && pricesHydrated ? (
            <PortfolioPnlBar data={pnlRows} />
          ) : (
            <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          )}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium">ราคาปัจจุบัน (ต่อหน่วย)</div>
              <div className="text-xs text-zinc-500">
                ใส่ราคาเพื่อคำนวณมูลค่าปัจจุบันและ unrealized P/L
              </div>
            </div>
            <div className="text-right text-xs text-zinc-500">
              Realized: {hydrated ? formatMoney(realizedDisp, currency) : "…"} <br />
              Unrealized:{" "}
              {hydrated && pricesHydrated
                ? formatMoney(unrealizedDisp, currency)
                : "…"}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-200/70 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                อัปเดตล่าสุด
              </span>
              <span className="text-xs font-semibold tabular-nums text-zinc-900">
                {lastUpdatedAt
                  ? new Date(lastUpdatedAt).toLocaleString("th-TH")
                  : "—"}
              </span>
              {priceStatus === "loading" ? (
                <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  กำลังอัปเดต…
                </span>
              ) : null}
              {priceError ? (
                <span className="rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                  {priceError}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAutoRefresh((v) => !v)}
                className={
                  autoRefresh
                    ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                    : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                }
                disabled={
                  !hydrated || !pricesHydrated || positions.length === 0
                }
              >
                {autoRefresh ? "Auto: เปิด" : "Auto: ปิด"}
              </button>
              <div className="w-[140px]">
                <Select
                  value={String(refreshEvery)}
                  onChange={(e) =>
                    setRefreshEvery(Number(e.target.value) as 60 | 300 | 900)
                  }
                  disabled={
                    !autoRefresh ||
                    !hydrated ||
                    !pricesHydrated ||
                    positions.length === 0
                  }
                  className={
                    !autoRefresh
                      ? "h-9 rounded-2xl px-3 text-xs text-zinc-400 shadow-none"
                      : "h-9 rounded-2xl px-3 text-xs shadow-none"
                  }
                  aria-label="Auto refresh interval"
                >
                  <option value="60">ทุก 1 นาที</option>
                  <option value="300">ทุก 5 นาที</option>
                  <option value="900">ทุก 15 นาที</option>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => refreshMarket(positions.map((p) => p.assetName))}
                className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  !hydrated ||
                  !pricesHydrated ||
                  priceStatus === "loading" ||
                  positions.length === 0
                }
              >
                {priceStatus === "loading"
                  ? "กำลังอัปเดตราคาตลาด…"
                  : "อัปเดตราคาตลาด"}
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            {!hydrated || !pricesHydrated ? (
              <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
            ) : positions.length === 0 ? (
              <div className="text-sm text-zinc-400">
                ยังไม่มี position ลองเพิ่มรายการซื้อขายก่อน หรือกด “โหลด Demo
                data”
              </div>
            ) : (
              <div className="grid gap-2">
                {positions.map((p) => (
                  <div
                    key={p.assetName}
                    className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-3 sm:grid-cols-12 sm:items-center"
                  >
                    <div className="sm:col-span-4">
                      <div className="flex items-start gap-2">
                        <AssetIcon
                          symbol={p.assetName}
                          type={p.assetType}
                          className="h-7 w-7 rounded-xl"
                        />
                        <div className="min-w-0">
                          <div className="font-medium">{p.assetName}</div>
                          <div className="text-xs text-zinc-500">
                            Qty {p.qty} • Avg {Math.round(p.avgCost * 100) / 100}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-5">
                      <Input
                        inputMode="decimal"
                        placeholder="ราคาปัจจุบัน"
                        value={
                          draftPrice[p.assetName] ??
                          (priceOfDisplay(p.assetName)
                            ? fmt2(priceOfDisplay(p.assetName) as number)
                            : "")
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftPrice((m) => ({ ...m, [p.assetName]: v }));
                          const t = v.trim();
                          if (!t) return setPrice(p.assetName, null);
                          const n = Number(t);
                          setPrice(
                            p.assetName,
                            Number.isFinite(n) ? fromDisplay(n) : null,
                          );
                        }}
                        onBlur={() => {
                          setDraftPrice((m) => {
                            const next = { ...m };
                            delete next[p.assetName];
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div className="text-sm text-zinc-600 sm:col-span-3 sm:text-right">
                      Fee รวม: {hydrated ? formatMoney(feesDisp, currency) : "…"}
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={clearData}
                    className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    ล้างข้อมูลทั้งหมด
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">จำนวนรายการ</div>
            <div className="text-xs text-zinc-400">
              {hydrated ? `${txs.length}` : "…"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">Positions</div>
            <div className="text-sm font-medium">
              {hydrated ? `${positions.length}` : "…"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <div>
            <div className="text-sm font-medium">สัดส่วนพอร์ต (Allocation)</div>
            <div className="text-xs text-zinc-400">เทียบกับเป้าหมายที่ตั้งไว้ในหน้า Settings</div>
          </div>
          <div className="grid gap-2">
            {allocationRows.map((r) => {
              const drift = Math.round((r.pct - r.target) * 100) / 100;
              return (
                <div
                  key={r.type}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-zinc-50/60 px-4 py-3 text-sm"
                >
                  <div className="font-medium text-zinc-900">{r.type.toUpperCase()}</div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <div className="text-zinc-600">
                      {r.pct.toFixed(2)}% / Target {Number(r.target).toFixed(2)}%
                    </div>
                    <div
                      className={
                        drift > 0.01
                          ? "font-medium text-emerald-700"
                          : drift < -0.01
                            ? "font-medium text-rose-700"
                            : "font-medium text-zinc-500"
                      }
                    >
                      {drift > 0 ? "+" : ""}
                      {drift.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
