"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { mapTx, useTransactions } from "@/store/useTransactions";
import {
  AssetValueTimelineLine,
  SERIES_COLORS,
  type AssetSeries
} from "@/components/charts/AssetValueTimelineLine";
import type { Transaction } from "@/types/transactions";

function toDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function startOfYear(d: Date) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

type RangePreset = "" | "today" | "yesterday" | "last7" | "last30" | "last90" | "ytd" | "last365" | "all";

/** Build timeline series for a single asset from its sorted transactions */
function buildSeriesForAsset(
  assetTxs: Transaction[],
  assetName: string,
  color: string
): AssetSeries {
  const sorted = assetTxs
    .filter((t) => t.createdAt && Number.isFinite(t.amount) && Number.isFinite(t.price))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let qty = 0;
  const points: { ts: number; value: number }[] = [];
  const buys: { ts: number; value: number }[] = [];
  const sells: { ts: number; value: number }[] = [];

  for (const t of sorted) {
    qty = t.side === "buy" ? qty + t.amount : qty - t.amount;
    const ts = new Date(t.createdAt).getTime();
    const value = qty * t.price;
    points.push({ ts, value });
    if (t.side === "buy") buys.push({ ts, value });
    else sells.push({ ts, value });
  }

  return { assetName, color, points, buys, sells };
}

/** Build all asset series from the filtered transaction list */
function buildTimelines(txs: Transaction[], assetFilter: string): AssetSeries[] {
  if (assetFilter !== "__all__") {
    const assetTxs = txs.filter((t) => t.assetName === assetFilter);
    return [buildSeriesForAsset(assetTxs, assetFilter, SERIES_COLORS[0])];
  }

  // Group transactions by assetName
  const grouped = new Map<string, Transaction[]>();
  for (const t of txs) {
    if (!grouped.has(t.assetName)) grouped.set(t.assetName, []);
    grouped.get(t.assetName)!.push(t);
  }

  const assetNames = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
  return assetNames.map((name, i) =>
    buildSeriesForAsset(grouped.get(name)!, name, SERIES_COLORS[i % SERIES_COLORS.length])
  );
}

export default function AssetsTimelinePage() {
  const { user, hydrated: authHydrated } = useAuth();
  const { txs, hydrated, error } = useTransactions();
  const [assetTxs, setAssetTxs] = React.useState<Transaction[]>([]);
  const [assetLoading, setAssetLoading] = React.useState(false);
  const [assetError, setAssetError] = React.useState<string | null>(null);

  const sortedAll = React.useMemo(
    () => [...txs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [txs]
  );
  const oldest = React.useMemo(
    () => (sortedAll[0]?.createdAt ? new Date(sortedAll[0].createdAt) : null),
    [sortedAll]
  );
  const newest = React.useMemo(
    () =>
      sortedAll[sortedAll.length - 1]?.createdAt
        ? new Date(sortedAll[sortedAll.length - 1].createdAt)
        : null,
    [sortedAll]
  );

  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [rangePreset, setRangePreset] = React.useState<RangePreset>("");
  const [asset, setAsset] = React.useState<string>("__all__");

  React.useEffect(() => {
    if (!hydrated) return;
    if (asset === "__all__") {
      setAssetTxs([]);
      setAssetLoading(false);
      setAssetError(null);
      return;
    }

    let mounted = true;
    setAssetLoading(true);
    setAssetError(null);

    (async () => {
      const res = await fetch(`/api/transactions/asset/${encodeURIComponent(asset)}`, {
        method: "GET"
      }).catch(() => null);
      const json = res
        ? await res.json().catch(() => null)
        : null;
      if (!mounted) return;

      if (!res || !res.ok) {
        setAssetError((json as any)?.message || (json as any)?.error || "โหลดรายการสินทรัพย์ไม่สำเร็จ");
        setAssetTxs([]);
        setAssetLoading(false);
        return;
      }

      const list = (json as any)?.transactions ?? json;
      const mapped = Array.isArray(list) ? (list.map(mapTx).filter(Boolean) as Transaction[]) : [];
      setAssetTxs(mapped);
      setAssetLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [asset, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!oldest || !newest) return;
    if (!rangePreset) {
      setFrom((prev) => (prev ? prev : toDateInputValue(oldest)));
      setTo((prev) => (prev ? prev : toDateInputValue(newest)));
    }
  }, [hydrated, oldest, newest, rangePreset]);

  const applyPreset = React.useCallback(
    (preset: RangePreset) => {
      const now = new Date();
      if (preset === "all") {
        setFrom(oldest ? toDateInputValue(oldest) : "");
        setTo(newest ? toDateInputValue(newest) : "");
        return;
      }
      if (preset === "today") {
        setFrom(toDateInputValue(now));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "yesterday") {
        const y = daysAgo(1);
        setFrom(toDateInputValue(y));
        setTo(toDateInputValue(y));
        return;
      }
      if (preset === "last7") {
        setFrom(toDateInputValue(daysAgo(6)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last30") {
        setFrom(toDateInputValue(daysAgo(29)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last90") {
        setFrom(toDateInputValue(daysAgo(89)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "ytd") {
        setFrom(toDateInputValue(startOfYear(now)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last365") {
        setFrom(toDateInputValue(daysAgo(364)));
        setTo(toDateInputValue(now));
      }
    },
    [newest, oldest]
  );

  const sourceTxs = asset === "__all__" ? txs : assetTxs;

  const filteredTxs = React.useMemo(() => {
    if (!from && !to) return sourceTxs;
    const fromD = from ? startOfDay(new Date(from)) : null;
    const toD = to ? endOfDay(new Date(to)) : null;
    return sourceTxs.filter((t) => {
      const d = new Date(t.createdAt);
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    });
  }, [sourceTxs, from, to]);

  const assetOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const t of txs) if (t.assetName) set.add(t.assetName);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [txs]);

  const series = React.useMemo(
    () => buildTimelines(filteredTxs, asset),
    [filteredTxs, asset]
  );

  if (authHydrated && !user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">เข้าสู่ระบบเพื่อดูกราฟสินทรัพย์</div>
          <div className="text-sm text-zinc-600">ล็อกอินก่อน แล้วดูกราฟสินทรัพย์รวม/รายตัวได้</div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link href="/login?next=/assets" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/register?next=/assets" className="w-full sm:w-auto">
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
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">กราฟสินทรัพย์ (เส้น)</h1>
        <p className="text-sm text-zinc-600">
          มูลค่าที่แสดงเป็น{" "}
          <span className="font-medium">proxy จากราคาล่าสุดที่มีในรายการซื้อ/ขาย</span>{" "}
          &mdash; เลือก &ldquo;ทั้งหมด&rdquo; เพื่อดูทุกสินทรัพย์แยกเส้น หรือเลือกรายตัว
        </p>
      </div>

      <Card>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Asset selector */}
            <div className="grid gap-1">
              <div className="text-sm font-medium">สินทรัพย์</div>
              <Select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                disabled={!hydrated}
                className="h-11 rounded-2xl px-3 text-xs shadow-none"
                aria-label="Asset filter"
              >
                <option value="__all__">ทั้งหมด (แยกเส้นแต่ละสินทรัพย์)</option>
                {assetOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date range */}
            <div className="grid gap-1 md:col-span-2">
              <div className="text-sm font-medium">ช่วงวันที่</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="w-full sm:w-[220px]">
                  <div className="text-xs text-zinc-400">ช่วงเวลา</div>
                  <Select
                    value={rangePreset}
                    onChange={(e) => {
                      const v = e.target.value as RangePreset;
                      setRangePreset(v);
                      if (!v) return;
                      applyPreset(v);
                    }}
                    disabled={!hydrated}
                    className="h-11 rounded-2xl px-3 text-xs shadow-none"
                    aria-label="Date range preset"
                  >
                    <option value="">เลือกช่วงวันที่…</option>
                    <option value="today">วันนี้</option>
                    <option value="yesterday">เมื่อวาน</option>
                    <option value="last7">7 วันที่ผ่านมา</option>
                    <option value="last30">30 วันที่ผ่านมา</option>
                    <option value="last90">90 วันที่ผ่านมา</option>
                    <option value="ytd">ปีนี้ (YTD)</option>
                    <option value="last365">1 ปีที่ผ่านมา</option>
                    <option value="all">ทั้งหมด</option>
                  </Select>
                </div>
                <div className="w-full sm:w-[190px]">
                  <div className="text-xs text-zinc-400">จาก</div>
                  <Input
                    type="date"
                    className="h-11 rounded-2xl px-3 text-xs shadow-none"
                    value={from}
                    onChange={(e) => {
                      setRangePreset("");
                      setFrom(e.target.value);
                    }}
                    disabled={!hydrated}
                  />
                </div>
                <div className="w-full sm:w-[190px]">
                  <div className="text-xs text-zinc-400">ถึง</div>
                  <Input
                    type="date"
                    className="h-11 rounded-2xl px-3 text-xs shadow-none"
                    value={to}
                    onChange={(e) => {
                      setRangePreset("");
                      setTo(e.target.value);
                    }}
                    disabled={!hydrated}
                  />
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                {oldest && newest
                  ? `ข้อมูลมีตั้งแต่ ${oldest.toLocaleString()} ถึง ${newest.toLocaleString()}`
                  : "ยังไม่มีข้อมูล"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        {!hydrated || (asset !== "__all__" && assetLoading) ? (
          <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
        ) : assetError ? (
          <div className="text-sm text-rose-600">{assetError}</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : filteredTxs.length === 0 ? (
          <div className="text-sm text-zinc-500">ไม่มีรายการในช่วงวันที่นี้</div>
        ) : (
          <AssetValueTimelineLine series={series} />
        )}
      </Card>
    </div>
  );
}
