"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { CurrencyPicker } from "@/components/ui/CurrencyPicker";
import { Input } from "@/components/ui/Input";
import { useFxRate } from "@/store/useFxRate";

export default function SettingsPage() {
  const { user, hydrated } = useAuth();
  const { usdThb, setUsdThb, hydrated: fxHydrated } = useFxRate();

  if (!hydrated) {
    return <Card className="p-6">กำลังโหลด…</Card>;
  }

  if (!user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">ต้องเข้าสู่ระบบก่อน</div>
          <div className="text-sm text-zinc-600">ไปที่หน้าเข้าสู่ระบบเพื่อดูการตั้งค่า</div>
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
        <div className="text-sm text-zinc-600">หน้าตัวอย่างสำหรับ MVP</div>
      </div>
      <Card className="p-6">
        <div className="grid gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900">สกุลเงินหลัก</div>
            <div className="mt-1 text-sm text-zinc-600">
              ใช้เพื่อแสดงผลตัวเลขใน Dashboard (พร้อม conversion)
            </div>
          </div>
          <CurrencyPicker />
          <div className="mt-2 rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4">
            <div className="text-sm font-semibold text-zinc-900">อัตราแลกเปลี่ยน (USD/THB)</div>
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
        </div>
      </Card>
    </div>
  );
}

