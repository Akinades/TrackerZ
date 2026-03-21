"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { AccountProfileClient } from "@/components/account/AccountProfileClient";

export default function AccountPage() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <Card className="rounded-3xl border-zinc-200/80 p-8 text-center text-sm text-zinc-500">กำลังโหลด…</Card>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="rounded-3xl border-zinc-200/80 p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-zinc-900">ต้องเข้าสู่ระบบก่อน</div>
          <p className="mt-2 text-sm text-zinc-600">เข้าสู่ระบบเพื่อแก้ไขโปรไฟล์และรหัสผ่าน</p>
          <div className="mt-6">
            <Link href="/login?next=/account">
              <Button>เข้าสู่ระบบ</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <AccountProfileClient user={user} />;
}
