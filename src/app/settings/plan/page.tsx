"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";

export default function PlanSettingsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <Card className="p-6">กำลังโหลด…</Card>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold">สนับสนุนสำนัก</div>
        <div className="text-sm text-zinc-600">
          TrackerZ ไม่มีแพ็กเกจแบ่งชั้นแล้ว — ฟีเจอร์ทั้งหมดเปิดให้ใช้ฟรี
          ถ้าอยากช่วยค่าน้ำชาหรือค่าพัฒนา ไปที่หน้าสนับสนุนได้เลย ไม่บังคับ
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-zinc-700">
          ร่วมสร้างตำนาน TrackerZ ด้วยการโอนผ่าน PromptPay หรือแค่แชร์ให้เพื่อนในยุทธภพก็เป็นกำลังใจแล้ว
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/support">
            <Button>ไปหน้าสนับสนุนสำนัก</Button>
          </Link>
          <Link href="/settings">
            <Button variant="secondary">กลับการตั้งค่า</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
