"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { CurrencyPicker } from "@/components/ui/CurrencyPicker";
import { Input } from "@/components/ui/Input";
import { useFxRate } from "@/store/useFxRate";
import { usePreferences } from "@/store/usePreferences";
import type { AssetType } from "@/types/transactions";
import {
  LEVELS,
  formatLevelRange,
  getLevelByPerformance,
} from "@/lib/levels";
import { useDashboardPortfolio } from "@/hooks/useDashboardPortfolio";
import { feedbackMailtoHref, getFeedbackEmail } from "@/lib/siteContact";

export default function SettingsPage() {
  const { user, hydrated } = useAuth();
  const { usdThb, setUsdThb, hydrated: fxHydrated } = useFxRate();
  const { prefs, hydrated: prefsHydrated, update } = usePreferences();
  const d = useDashboardPortfolio();
  const currentLevel = getLevelByPerformance(d.totalReturnPct, d.txsLength);
  const feedbackEmail = getFeedbackEmail();
  const feedbackMailHref =
    feedbackMailtoHref("TrackerZ — แจ้งปัญหา / ข้อเสนอแนะ") ?? `mailto:${feedbackEmail}`;

  if (!hydrated) {
    return <Card className="p-6">กำลังโหลด…</Card>;
  }

  if (!user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">ต้องเข้าสู่ระบบก่อน</div>
          <div className="text-sm text-zinc-600">
            ไปที่หน้าเข้าสู่ระบบเพื่อดูการตั้งค่า
          </div>
          <div className="mt-2">
            <Link href="/login?next=/settings">
              <Button>เข้าสู่ระบบ</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold">ตั้งค่า</div>
      </div>

      <Card className="p-4 sm:p-5">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            สกุลเงินหลัก
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            ใช้เพื่อแสดงผลตัวเลขใน Dashboard (พร้อม conversion)
          </div>
        </div>
        <div className="mt-3">
          <CurrencyPicker />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
          <div className="text-sm font-semibold text-zinc-900">
            อัตราแลกเปลี่ยน (USD/THB)
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            ใช้สำหรับแปลงตัวเลขเมื่อสลับ THB ↔ USD (MVP ใส่เองก่อน)
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-700">1 USD =</div>
            <div className="w-[160px]">
              <Input
                inputMode="decimal"
                value={fxHydrated ? String(usdThb) : "…"}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  const n = Number(v);
                  if (Number.isFinite(n) && n > 0) setUsdThb(n);
                }}
                aria-label="USDTHB rate"
              />
            </div>
            <div className="text-sm text-zinc-700">THB</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
          <div className="text-sm font-semibold text-zinc-900">
            วิธีคำนวณต้นทุน/กำไร (Cost basis)
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            ใช้สำหรับคำนวณ P/L ใน Dashboard ให้สอดคล้องกันทั้งระบบ
          </div>
          <div className="mt-3">
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 text-sm"
              value={prefsHydrated ? prefs.costBasis : "avg"}
              onChange={(e) =>
                update({
                  costBasis: e.target.value === "fifo" ? "fifo" : "avg",
                })
              }
            >
              <option value="avg">Average Cost (ง่าย/นิยมในไทย)</option>
              <option value="fifo">FIFO (มาตรฐานภาษี/รายงานหลายแบบ)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
          <div className="text-sm font-semibold text-zinc-900">
            Target allocation (สัดส่วนเป้าหมาย)
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            ตั้ง % ต่อประเภทสินทรัพย์เพื่อดู drift ใน Dashboard
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
            {(["gold", "stock", "forex", "crypto", "other"] as const).map(
              (k) => (
                <div key={k} className="grid gap-1">
                  <div className="text-xs font-medium text-zinc-700">
                    {k.toUpperCase()}
                  </div>
                  <Input
                    inputMode="decimal"
                    value={
                      prefsHydrated ? String(prefs.allocation[k]) : "0"
                    }
                    onChange={(e) => {
                      const n = Number(e.target.value.trim());
                      const v = Number.isFinite(n)
                        ? Math.max(0, Math.min(100, n))
                        : 0;
                      update({
                        allocation: {
                          ...prefs.allocation,
                          [k as AssetType]: v,
                        },
                      });
                    }}
                    aria-label={`Allocation ${k}`}
                  />
                </div>
              ),
            )}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            รวมทั้งหมด:{" "}
            {prefsHydrated
              ? Math.round(
                  (prefs.allocation.gold +
                    prefs.allocation.stock +
                    prefs.allocation.forex +
                    prefs.allocation.crypto +
                    prefs.allocation.other) *
                    100,
                ) / 100
              : "…"}
            %
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="rounded-2xl border border-emerald-200/70  p-4">
          <div className="text-sm font-semibold text-zinc-900">
            ระบบระดับผู้ใช้งาน (ตาม % กำไร)
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            ระดับปัจจุบัน:{" "}
            <span className="font-semibold text-emerald-800">
              {d.hydrated ? currentLevel.label : "กำลังโหลด..."}
            </span>{" "}
            (กำไรรวม{" "}
            {typeof d.totalReturnPct === "number"
              ? `${d.totalReturnPct.toFixed(2)}%`
              : "-"}
            )
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            การจัดระดับคำนวณจาก % กำไรรวมของพอร์ต (จากต้นทุนสะสม) และมีเงื่อนไขข้อมูลธุรกรรมเพียงพอภายในระบบ
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {LEVELS.map((level) => (
              <div
                key={level.key}
                className="rounded-xl border border-emerald-100/80 bg-white p-3 text-center"
              >
                <div className="mx-auto h-20 w-20 overflow-hidden">
                  <img
                    src={level.iconFile}
                    alt={level.label}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">
                  {level.label}
                </div>
                <div className="mt-1 text-xs text-zinc-700">
                  {formatLevelRange(level)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {level.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="text-sm font-semibold text-zinc-900">ติดต่อ & ข้อเสนอแนะ</div>
        <p className="mt-1 text-sm text-zinc-600">
          พบบั๊กหรืออยากเสนอไอเดีย — คลิกอีเมลด้านล่างเพื่อเปิดแอปอีเมล
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          <span className="font-medium text-zinc-900">อีเมล:</span>{" "}
          <a
            href={feedbackMailHref}
            className="break-all font-mono text-emerald-700 underline-offset-2 hover:underline"
          >
            {feedbackEmail}
          </a>
        </p>
      </Card>
    </div>
  );
}
