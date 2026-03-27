"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/useAuth";
import type { UserPlan } from "@/lib/authStorage";
import { submitSelectedPlanToBackend } from "@/lib/pricingPlans";

function planLabel(plan: string | null): string {
  if (plan === "monthly") return "Pro Monthly (จอมยุทธ์)";
  if (plan === "yearly") return "Pro Yearly (มหาเซียน)";
  return "Pro";
}

export function PricingSuccessClient() {
  const params = useSearchParams();
  const planRaw = params.get("plan");
  const plan: UserPlan | null =
    planRaw === "monthly" || planRaw === "yearly" ? planRaw : null;
  const mockKind = params.get("mock");
  const isMockReturn = mockKind === "1" || mockKind === "omise";
  const nextHref = (() => {
    const n = params.get("next");
    return n && n.startsWith("/") ? n : "/dashboard";
  })();
  const { user, hydrated, refreshUser, updatePlan } = useAuth();
  const [synced, setSynced] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const timeoutIds: number[] = [];
    void import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const fire = mod.default;
      const colors = ["#10b981", "#34d399", "#059669", "#fbbf24"];
      const burst = () => {
        if (cancelled) return;
        void fire({
          particleCount: 55,
          spread: 62,
          startVelocity: 32,
          origin: { y: 0.58 },
          colors
        });
      };
      burst();
      timeoutIds.push(window.setTimeout(burst, 180));
      timeoutIds.push(window.setTimeout(burst, 420));
    });
    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  /** ซิงค์แพ็กจาก client เฉพาะ MOCK เท่านั้น — production ให้ Webhook อัปเดต MongoDB */
  React.useEffect(() => {
    if (!hydrated || !user || !plan || synced || !isMockReturn) return;
    if (user.plan === plan) {
      setSynced(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await submitSelectedPlanToBackend(plan, updatePlan);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) {
          await refreshUser().catch(() => null);
          setSynced(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user, plan, synced, isMockReturn, updatePlan, refreshUser]);

  React.useEffect(() => {
    if (!hydrated || isMockReturn) return;
    void refreshUser().catch(() => null);
  }, [hydrated, isMockReturn, refreshUser]);

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="mb-5 flex justify-start">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-emerald-900"
        >
          <span aria-hidden>←</span>
          กลับ
        </Link>
      </div>
      <Card className="overflow-hidden border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 via-white to-white p-8 text-center shadow-[0_28px_60px_-40px_rgba(16,185,129,0.45)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-zinc-900">ชำระเงินสำเร็จ</h1>
        <p className="mt-2 text-sm text-zinc-600">
          ยินดีต้อนรับสู่ {plan ? planLabel(plan) : "แพ็ก Pro"} — สิทธิ์ใช้งานจะอัปเดตในระบบภายครู่
          {isMockReturn ? (
            <span className="mt-2 block rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {mockKind === "omise"
                ? "จำลอง Omise Checkout — ยังไม่มีการเรียก Omise API จริง"
                : "โหมด MOCK_BILLING: ทดสอบเท่านั้น ไม่มีการเรียกเกตเวย์จริง"}
            </span>
          ) : null}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={nextHref} className="sm:flex-1">
            <Button className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700">
              ไปที่ Dashboard
            </Button>
          </Link>
          <Link href="/transactions" className="sm:flex-1">
            <Button variant="secondary" className="h-11 w-full">
              บันทึกรายการ
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
