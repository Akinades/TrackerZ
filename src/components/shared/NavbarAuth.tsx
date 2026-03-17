"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";

export function AuthButtons() {
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost">เข้าสู่ระบบ</Button>
        </Link>
        <Link href="/register">
          <Button>สมัคร</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="max-w-[220px] truncate rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-600">
        {user.email}
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          logout();
          router.push("/");
        }}
      >
        ออกจากระบบ
      </Button>
    </div>
  );
}

