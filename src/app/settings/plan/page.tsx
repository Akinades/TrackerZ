"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import type { UserPlan } from "@/lib/authStorage";
import { notify } from "@/lib/notify";
import { PlanSelectorCards } from "@/components/plan/PlanSelectorCards";

export default function PlanSettingsPage() {
  const { user, hydrated, updatePlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = React.useState<UserPlan>("free");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setSelectedPlan(user.plan);
  }, [user]);

  if (!hydrated) {
    return <Card className="p-6">กำลังโหลด…</Card>;
  }

  if (!user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">ต้องเข้าสู่ระบบก่อน</div>
          <div className="text-sm text-zinc-600">ไปที่หน้าเข้าสู่ระบบเพื่อเปลี่ยนแพ็กเกจ</div>
          <div className="mt-2">
            <Link href="/login?next=/settings/plan">
              <Button>เข้าสู่ระบบ</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const currentPlan = user.plan;
  const hasChanged = selectedPlan !== currentPlan;

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold">เปลี่ยนแพ็กเกจสมาชิก</div>
        <div className="text-sm text-zinc-600">เลือกแพ็กเกจใหม่ แล้วกดอัปเดต</div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-zinc-600">แพ็กเกจปัจจุบัน:</span>
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            {currentPlan === "monthly" ? "Pro Monthly" : currentPlan === "yearly" ? "Pro Yearly" : "Free"}
          </span>
        </div>

        <PlanSelectorCards
          selectedPlan={selectedPlan}
          onSelect={setSelectedPlan}
          className="grid gap-4 lg:grid-cols-3"
        />

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Link href="/settings">
            <Button variant="secondary">ยกเลิก</Button>
          </Link>
          <Button
            disabled={!hasChanged || pending}
            onClick={async () => {
              if (!hasChanged || pending) return;
              setPending(true);
              try {
                await updatePlan(selectedPlan);
                notify.success("อัปเดตแพ็กเกจเรียบร้อยแล้ว");
              } catch (e) {
                notify.error(e, "อัปเดตแพ็กเกจไม่สำเร็จ");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "กำลังอัปเดต..." : "อัปเดตแพ็กเกจ"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
