"use client";

import * as React from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { AppCurrency } from "@/store/useCurrency";
import type { Transaction } from "@/types/transactions";
import { txExecutedAtIso, txExecutedAtMs } from "@/lib/transactionTime";
import {
  topHourPhrases,
  txBuyOutflowDisplay,
  txFeeTaxDisplay,
  txSellGrossDisplay,
  unitDisplayForTx,
  type ToDisplayMoneyFn,
} from "@/lib/assetTimeline";
import { round2 } from "@/lib/calculations";

const SUMMARY_LIST_MAX = 8;

type Props = {
  txs: Transaction[];
  assetFilter: string;
  currency: AppCurrency;
  toDisplayMoney: ToDisplayMoneyFn;
  market?: {
    investedDisp: number;
    feesDisp: number;
    realizedDisp: number;
    unrealizedDisp: number;
    marketValueOpenDisp: number;
    totalPnlDisp: number;
    totalReturnPct: number | null;
  };
};

export function AssetsRangeSummary({
  txs,
  assetFilter,
  currency,
  toDisplayMoney,
  market,
}: Props) {
  const buys = React.useMemo(
    () =>
      txs
        .filter((t) => t.side === "buy")
        .sort((a, b) => txExecutedAtMs(b) - txExecutedAtMs(a)),
    [txs],
  );
  const sells = React.useMemo(
    () =>
      txs
        .filter((t) => t.side === "sell")
        .sort((a, b) => txExecutedAtMs(b) - txExecutedAtMs(a)),
    [txs],
  );

  const showAsset = assetFilter === "__all__";

  const buyTotalOutflow = React.useMemo(
    () =>
      round2(
        buys.reduce((s, t) => s + txBuyOutflowDisplay(t, toDisplayMoney), 0),
      ),
    [buys, toDisplayMoney],
  );
  const sellGrossTotal = React.useMemo(
    () =>
      round2(
        sells.reduce((s, t) => s + txSellGrossDisplay(t, toDisplayMoney), 0),
      ),
    [sells, toDisplayMoney],
  );
  const sellChargesTotal = React.useMemo(
    () =>
      round2(sells.reduce((s, t) => s + txFeeTaxDisplay(t, toDisplayMoney), 0)),
    [sells, toDisplayMoney],
  );
  const sellNetTotal = React.useMemo(
    () => round2(sellGrossTotal - sellChargesTotal),
    [sellGrossTotal, sellChargesTotal],
  );

  const remaining = React.useMemo(() => {
    const sorted = [...txs].sort(
      (a, b) => txExecutedAtMs(a) - txExecutedAtMs(b),
    );
    const map = new Map<string, { qty: number; lastUnit: number }>();

    for (const t of sorted) {
      const key = (t.assetName || "").trim().toUpperCase();
      if (!key) continue;
      const unit = unitDisplayForTx(t, toDisplayMoney);
      const prev = map.get(key) ?? { qty: 0, lastUnit: unit };
      prev.lastUnit = unit;
      prev.qty += t.side === "buy" ? t.amount : -t.amount;
      map.set(key, prev);
    }

    let qty = 0;
    let value = 0;
    map.forEach((p) => {
      if (!Number.isFinite(p.qty) || p.qty <= 0) return;
      qty += p.qty;
      value += p.qty * p.lastUnit;
    });

    return {
      qty: round2(qty),
      value: round2(value),
    };
  }, [txs, toDisplayMoney]);

  const marketPnl = market?.totalPnlDisp ?? null;
  const marketPnlPct = market?.totalReturnPct ?? null;

  const avgBuyPerTrade = React.useMemo(
    () => (buys.length > 0 ? round2(buyTotalOutflow / buys.length) : null),
    [buyTotalOutflow, buys.length],
  );
  const avgSellPerTrade = React.useMemo(
    () => (sells.length > 0 ? round2(sellNetTotal / sells.length) : null),
    [sellNetTotal, sells.length],
  );
  const buySellGap = React.useMemo(
    () => round2(Math.abs(sellNetTotal - buyTotalOutflow)),
    [sellNetTotal, buyTotalOutflow],
  );
  const flowMode =
    sellNetTotal >= buyTotalOutflow ? "เน้นขาย/ลดพอร์ต" : "เน้นซื้อ/สะสมเพิ่ม";

  const buyHourHints = React.useMemo(() => topHourPhrases(buys, 2), [buys]);
  const sellHourHints = React.useMemo(() => topHourPhrases(sells, 2), [sells]);

  return (
    <div>
      {showAsset ? (
        <p className="mb-3 text-[11px] text-zinc-400">
          รวมทุกสินทรัพย์ในช่วงวันที่ —
          เลือกสินทรัพย์เดียวเพื่อโฟกัสกราฟหนึ่งเส้น
        </p>
      ) : (
        <p className="mb-3 text-[11px] text-zinc-400">
          เฉพาะ {assetFilter} ในช่วงวันที่เลือก
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
          ซื้อ {buys.length} ครั้ง
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 ring-1 ring-rose-100">
          ขาย {sells.length} ครั้ง
        </span>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50/80 via-white to-zinc-50/60 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr] lg:items-stretch">
          <div className="p-1 md:pr-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              ผลลัพธ์รวมช่วงนี้ (แบบเดียวกับ Dashboard)
            </div>
            <div
              className={`mt-2 text-3xl font-extrabold tabular-nums tracking-tight md:text-4xl ${
                (marketPnl ?? 0) >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {(marketPnl ?? 0) >= 0 ? "กำไร " : "ขาดทุน "}
              {marketPnl == null ? "—" : formatMoney(Math.abs(marketPnl), currency)}
            </div>
            <p className="mt-2 text-sm font-semibold text-zinc-600 md:text-base">
              {marketPnlPct == null
                ? "คำนวณจาก realized + unrealized (อิงราคาตลาดปัจจุบัน)"
                : `คิดเป็น ${(marketPnl ?? 0) >= 0 ? "+" : ""}${marketPnlPct.toFixed(2)}% ของทุนซื้อรวม`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold tabular-nums text-zinc-600 md:text-base">
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                {market?.realizedDisp == null ? "—" : formatMoney(market.realizedDisp, currency)}
              </span>
              <span className="text-zinc-400">+</span>
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                {market?.unrealizedDisp == null ? "—" : formatMoney(market.unrealizedDisp, currency)}
              </span>
              <span className="text-zinc-400">=</span>
              <span
                className={`rounded-lg px-2.5 py-1 ${
                  (marketPnl ?? 0) >= 0
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80"
                    : "bg-rose-50 text-rose-600 ring-1 ring-rose-200/80"
                }`}
              >
                {marketPnl == null ? "—" : `${marketPnl >= 0 ? "+" : "-"}${formatMoney(Math.abs(marketPnl), currency)}`}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-500 md:text-base">
              มูลค่าที่เหลืออยู่ (ราคาตลาด){" "}
              {market?.marketValueOpenDisp == null ? "—" : formatMoney(market.marketValueOpenDisp, currency)}{" "}
              ({remaining.qty} หน่วย)
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-3 sm:p-4">
            <div className="grid divide-y divide-zinc-200/70">
              <div className="pb-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Realized (ขายแล้ว)
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">
                  {market?.realizedDisp == null ? "—" : formatMoney(market.realizedDisp, currency)}
                </div>
              </div>
              <div className="py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  มูลค่าที่เหลืออยู่ (ราคาตลาด)
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">
                  {market?.marketValueOpenDisp == null ? "—" : formatMoney(market.marketValueOpenDisp, currency)}
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  คงเหลือ {remaining.qty} หน่วย
                </p>
              </div>
              <div className="pt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  ทุนซื้อรวม
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">
                  {market?.investedDisp == null ? "—" : formatMoney(market.investedDisp, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-white p-4">
          <div className="text-[11px] font-medium text-emerald-700/90">
            มูลค่าซื้อรวม
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-emerald-950 tabular-nums">
            {formatMoney(buyTotalOutflow, currency)}
          </div>
          <p className="mt-1 text-[10px] leading-snug text-emerald-800/70">
            รวมราคา×จำนวน + fee + tax ของรายการซื้อในช่วงนี้
          </p>
        </div>

        <div className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-50/90 to-white p-4">
          <div className="text-[11px] font-medium text-rose-700/90">
            มูลค่าขายสุทธิ
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-rose-950 tabular-nums">
            {formatMoney(sellNetTotal, currency)}
          </div>
          {sellChargesTotal > 0 ? (
            <p className="mt-1 text-[10px] leading-snug text-rose-800/70">
              ราคาขายรวม {formatMoney(sellGrossTotal, currency)} หัก fee + tax{" "}
              {formatMoney(sellChargesTotal, currency)}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-rose-800/60">
              ยังไม่มีค่า fee/tax ในรายการขายชุดนี้
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] font-medium text-zinc-600">
            จังหวะเวลา (ชั่วโมงที่ทำรายการบ่อย)
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              ซื้อ
            </div>
            {buyHourHints.length > 0 ? (
              <ul className="mt-1 space-y-1 text-xs font-medium text-zinc-800">
                {buyHourHints.map((line, i) => (
                  <li
                    key={`b-${i}-${line}`}
                    className="flex items-start gap-1.5"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">ไม่มีรายการซื้อ</p>
            )}
          </div>
          <div className="mt-3 border-t border-zinc-200/70 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-700">
              ขาย
            </div>
            {sellHourHints.length > 0 ? (
              <ul className="mt-1 space-y-1 text-xs font-medium text-zinc-800">
                {sellHourHints.map((line, i) => (
                  <li
                    key={`s-${i}-${line}`}
                    className="flex items-start gap-1.5"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-rose-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">ไม่มีรายการขาย</p>
            )}
          </div>
          <p className="mt-3 text-[10px] text-zinc-400">
            อิงเวลาทำรายการ (traded_at ถ้ามี)
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3">
          <div className="text-[11px] font-medium text-zinc-500">
            มูลค่าเฉลี่ยต่อดีล
          </div>
          <div className="mt-1 text-base font-semibold text-zinc-900">
            ซื้อ{" "}
            {avgBuyPerTrade == null
              ? "-"
              : formatMoney(avgBuyPerTrade, currency)}
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">
            ขาย{" "}
            {avgSellPerTrade == null
              ? "-"
              : formatMoney(avgSellPerTrade, currency)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3">
          <div className="text-[11px] font-medium text-zinc-500">
            สไตล์ช่วงนี้
          </div>
          <div className="mt-1 text-base font-semibold text-zinc-900">
            {flowMode}
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">
            ต่างกัน {formatMoney(buySellGap, currency)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-zinc-50/80 p-4 ring-1 ring-zinc-100">
          <div className="mb-3 text-xs font-semibold text-emerald-800">
            รายการซื้อ — ล่าสุดก่อน
          </div>
          {buys.length === 0 ? (
            <p className="text-xs text-zinc-400">ไม่มีรายการซื้อในช่วงนี้</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {buys.slice(0, SUMMARY_LIST_MAX).map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-0.5 border-b border-zinc-200/60 pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                >
                  <span className="shrink-0 text-zinc-500 tabular-nums">
                    {new Date(txExecutedAtIso(t)).toLocaleString("th-TH", {
                      hour12: false,
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-right font-medium tabular-nums text-zinc-800">
                    {showAsset ? (
                      <span className="mr-1 font-normal text-zinc-500">
                        {t.assetName}
                      </span>
                    ) : null}
                    {t.amount} หน่วย @{" "}
                    {formatMoney(unitDisplayForTx(t, toDisplayMoney), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {buys.length > SUMMARY_LIST_MAX ? (
            <p className="mt-2 text-[11px] text-zinc-400">
              และอีก {buys.length - SUMMARY_LIST_MAX} รายการซื้อ
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-zinc-50/80 p-4 ring-1 ring-zinc-100">
          <div className="mb-3 text-xs font-semibold text-rose-800">
            รายการขาย — ล่าสุดก่อน
          </div>
          {sells.length === 0 ? (
            <p className="text-xs text-zinc-400">ไม่มีรายการขายในช่วงนี้</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {sells.slice(0, SUMMARY_LIST_MAX).map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-0.5 border-b border-zinc-200/60 pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                >
                  <span className="shrink-0 text-zinc-500 tabular-nums">
                    {new Date(txExecutedAtIso(t)).toLocaleString("th-TH", {
                      hour12: false,
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-right font-medium tabular-nums text-zinc-800">
                    {showAsset ? (
                      <span className="mr-1 font-normal text-zinc-500">
                        {t.assetName}
                      </span>
                    ) : null}
                    {t.amount} หน่วย @{" "}
                    {formatMoney(unitDisplayForTx(t, toDisplayMoney), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {sells.length > SUMMARY_LIST_MAX ? (
            <p className="mt-2 text-[11px] text-zinc-400">
              และอีก {sells.length - SUMMARY_LIST_MAX} รายการขาย
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-400 md:text-left">
        เคล็ดลับ: ดูรายละเอียดเต็มและแก้ไขได้ที่{" "}
        <Link
          href="/transactions"
          className="font-medium text-zinc-600 underline-offset-2 hover:underline"
        >
          หน้ารายการซื้อขาย
        </Link>
      </p>
    </div>
  );
}
