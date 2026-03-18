"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(next);
  }, [hydrated, user, router, next]);

  const submit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setPending(false);
    }
  };

  const comingSoon = (provider: "Google" | "Facebook") => {
    setError(`ยังไม่รองรับการเข้าสู่ระบบด้วย ${provider} (MVP)`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10 md:items-center">
      <div className="p-2 sm:p-4">
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

          <div className="grid gap-3">
            <div className="text-sm text-zinc-600">
              ยังไม่มีบัญชี?{" "}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="text-zinc-900 underline underline-offset-4"
              >
                สมัครสมาชิก
              </Link>
            </div>
            <Button onClick={submit} disabled={!hydrated || pending} className="w-full">
              เข้าสู่ระบบ
            </Button>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200/80" />
              <div className="text-xs text-zinc-500">หรือเข้าสู่ระบบด้วย</div>
              <div className="h-px flex-1 bg-zinc-200/80" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center gap-2"
                onClick={() => comingSoon("Google")}
              >
                <span aria-hidden="true">G</span>
                Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center gap-2"
                onClick={() => comingSoon("Facebook")}
              >
                <span aria-hidden="true">f</span>
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid place-items-center">
          <div className="relative aspect-square w-[320px] max-w-full">
            <Image
              src="/brand/login-icon.png"
              alt="TrackerZ"
              fill
              sizes="320px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

