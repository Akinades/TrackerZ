"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/store/useAuth";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const { user, hydrated, login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(next);
  }, [hydrated, user, router, next]);

  const submit = () => {
    setError(null);
    try {
      login(email, password);
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-lg font-semibold">เข้าสู่ระบบ</div>
        <div className="text-sm text-zinc-600">ยินดีต้อนรับกลับมา</div>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-zinc-700">อีเมล</label>
          <Input
            value={email}
            inputMode="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-zinc-700">รหัสผ่าน</label>
          <Input
            value={password}
            type="password"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-600">
          ยังไม่มีบัญชี?{" "}
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="text-zinc-900 underline underline-offset-4"
          >
            สมัครสมาชิก
          </Link>
        </div>
        <Button onClick={submit} disabled={!hydrated}>
          เข้าสู่ระบบ
        </Button>
      </div>
    </div>
  );
}

