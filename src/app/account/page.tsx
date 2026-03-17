"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";

export default function AccountPage() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return <Card className="p-6">กำลังโหลด…</Card>;
  }

  if (!user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">ต้องเข้าสู่ระบบก่อน</div>
          <div className="text-sm text-zinc-600">ไปที่หน้าเข้าสู่ระบบเพื่อดูข้อมูลส่วนตัว</div>
          <div className="mt-2">
            <Link href="/login?next=/account">
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
        <div className="text-xl font-semibold">ข้อมูลส่วนตัว</div>
        <div className="text-sm text-zinc-600">หน้าตัวอย่างสำหรับ MVP</div>
      </div>
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-xs text-zinc-500">อีเมล</div>
          <div className="text-sm font-medium text-zinc-900">{user.email}</div>
        </div>
      </Card>
    </div>
  );
}

