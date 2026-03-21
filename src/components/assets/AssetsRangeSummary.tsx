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
  type ToDisplayMoneyFn
} from "@/lib/assetTimeline";
import { round2 } from "@/lib/calculations";

const SUMMARY_LIST_MAX = 8;

type Props = {
  txs: Transaction[];
  assetFilter: string;
  currency: AppCurrency;
  toDisplayMoney: ToDisplayMoneyFn;
};

export function AssetsRangeSummary({ txs, assetFilter, currency, toDisplayMoney }: Props) {
  const buys = React.useMemo(
    () =>
      txs
        .filter((t) => t.side === "buy")
        .sort((a, b) => txExecutedAtMs(b) - txExecutedAtMs(a)),
    [txs]
  );
  const sells = React.useMemo(
    () =>
      txs
        .filter((t) => t.side === "sell")
        .sort((a, b) => txExecutedAtMs(b) - txExecutedAtMs(a)),
    [txs]
  );

  const showAsset = assetFilter === "__all__";

  const buyTotalOutflow = React.useMemo(
    () => round2(buys.reduce((s, t) => s + txBuyOutflowDisplay(t, toDisplayMoney), 0)),
    [buys, toDisplayMoney]
  );
  const sellGrossTotal = React.useMemo(
    () => round2(sells.reduce((s, t) => s + txSellGrossDisplay(t, toDisplayMoney), 0)),
    [sells, toDisplayMoney]
  );
  const sellChargesTotal = React.useMemo(
    () => round2(sells.reduce((s, t) => s + txFeeTaxDisplay(t, toDisplayMoney), 0)),
    [sells, toDisplayMoney]
  );
  const buyHourHints = React.useMemo(() => topHourPhrases(buys, 2), [buys]);
  const sellHourHints = React.useMemo(() => topHourPhrases(sells, 2), [sells]);

  return (
    <div>
      {showAsset ? (
        <p className="mb-3 text-[11px] text-zinc-400">
          รวมทุกสินทรัพย์ในช่วงวันที่ — เลือกสินทรัพย์เดียวเพื่อโฟกัสกราฟหนึ่งเส้น
        </p>
      ) : (
        <p className="mb-3 text-[11px] text-zinc-400">เฉพาะ {assetFilter} ในช่วงวันที่เลือก</p>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
          ซื้อ {buys.length} ครั้ง
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 ring-1 ring-rose-100">
          ขาย {sells.length} ครั้ง
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-white p-4">
          <div className="text-[11px] font-medium text-emerald-700/90">มูลค่าซื้อรวม</div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-emerald-950 tabular-nums">
            {formatMoney(buyTotalOutflow, currency)}
          </div>
          <p className="mt-1 text-[10px] leading-snug text-emerald-800/70">
            รวมราคา×จำนวน + fee + tax ของรายการซื้อในช่วงนี้
          </p>
        </div>
        <div className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-50/90 to-white p-4">
          <div className="text-[11px] font-medium text-rose-700/90">มูลค่าขายรวม (ราคา×จำนวน)</div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-rose-950 tabular-nums">
            {formatMoney(sellGrossTotal, currency)}
          </div>
          {sellChargesTotal > 0 ? (
            <p className="mt-1 text-[10px] leading-snug text-rose-800/70">
              fee + tax จากรายการขายรวม {formatMoney(sellChargesTotal, currency)}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-rose-800/60">ยังไม่มี fee/tax ในชุดขายนี้</p>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] font-medium text-zinc-600">จังหวะเวลา (ชั่วโมงที่ทำรายการบ่อย)</div>
          <div className="mt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              ซื้อ
            </div>
            {buyHourHints.length > 0 ? (
              <ul className="mt-1 space-y-1 text-xs font-medium text-zinc-800">
                {buyHourHints.map((line, i) => (
                  <li key={`b-${i}-${line}`} className="flex items-start gap-1.5">
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
                  <li key={`s-${i}-${line}`} className="flex items-start gap-1.5">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-rose-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">ไม่มีรายการขาย</p>
            )}
          </div>
          <p className="mt-3 text-[10px] text-zinc-400">อิงเวลาทำรายการ (traded_at ถ้ามี)</p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-zinc-50/80 p-4 ring-1 ring-zinc-100">
          <div className="mb-3 text-xs font-semibold text-emerald-800">รายการซื้อ — ล่าสุดก่อน</div>
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
                      minute: "2-digit"
                    })}
                  </span>
                  <span className="text-right font-medium tabular-nums text-zinc-800">
                    {showAsset ? (
                      <span className="mr-1 font-normal text-zinc-500">{t.assetName}</span>
                    ) : null}
                    {t.amount} หน่วย @ {formatMoney(unitDisplayForTx(t, toDisplayMoney), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {buys.length > SUMMARY_LIST_MAX ? (
            <p className="mt-2 text-[11px] text-zinc-400">และอีก {buys.length - SUMMARY_LIST_MAX} รายการซื้อ</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-zinc-50/80 p-4 ring-1 ring-zinc-100">
          <div className="mb-3 text-xs font-semibold text-rose-800">รายการขาย — ล่าสุดก่อน</div>
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
                      minute: "2-digit"
                    })}
                  </span>
                  <span className="text-right font-medium tabular-nums text-zinc-800">
                    {showAsset ? (
                      <span className="mr-1 font-normal text-zinc-500">{t.assetName}</span>
                    ) : null}
                    {t.amount} หน่วย @ {formatMoney(unitDisplayForTx(t, toDisplayMoney), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {sells.length > SUMMARY_LIST_MAX ? (
            <p className="mt-2 text-[11px] text-zinc-400">และอีก {sells.length - SUMMARY_LIST_MAX} รายการขาย</p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-400 md:text-left">
        เคล็ดลับ: ดูรายละเอียดเต็มและแก้ไขได้ที่{" "}
        <Link href="/transactions" className="font-medium text-zinc-600 underline-offset-2 hover:underline">
          หน้ารายการซื้อขาย
        </Link>
      </p>
    </div>
  );
}
