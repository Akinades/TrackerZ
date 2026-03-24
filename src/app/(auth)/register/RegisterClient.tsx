"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/store/useAuth";
import type { UserPlan } from "@/lib/authStorage";
import { notify } from "@/lib/notify";
import { getPlanOption, PlanSelectorCards } from "@/components/plan/PlanSelectorCards";

export function RegisterClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const initialPlan = params.get("plan");

  const { user, hydrated, register } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [planId, setPlanId] = React.useState<UserPlan>("free");
  const [step, setStep] = React.useState<1 | 2>(1);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (initialPlan === "free" || initialPlan === "monthly" || initialPlan === "yearly") {
      setPlanId(initialPlan);
      setStep(2);
    }
  }, [initialPlan]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(next);
  }, [hydrated, user, router, next]);

  const submit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await register(email, password, planId);
      notify.success("สมัครสมาชิกสำเร็จ");
      router.replace(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
      setError(msg);
      notify.error(msg, "สมัครสมาชิกไม่สำเร็จ");
      setPending(false);
    }
  };

  const selectedPlan = React.useMemo(() => {
    return getPlanOption(planId);
  }, [planId]);

  return (
    <div className="grid gap-6">
      {step === 1 ? (
        <div className="rounded-3xl border border-zinc-200/70 bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-2xl font-semibold">เลือกแพ็กเกจก่อนสมัคร</div>
              <div className="text-lg text-zinc-600">Step 1: เลือกแพ็กเกจที่ต้องการก่อน</div>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-2 text-base font-medium text-emerald-700">
              Step 1: Plan
            </div>
          </div>
          <PlanSelectorCards selectedPlan={planId} onSelect={setPlanId} className="mt-5 grid gap-4 lg:grid-cols-3" />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} className="min-w-40 px-6 py-3 text-base">
              ต่อไป
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8 md:items-center">
          <div className="p-2 sm:p-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-lg font-semibold">สมัครสมาชิก</div>
                  <div className="text-sm text-zinc-600">
                    Step 2: สร้างบัญชีสำหรับแผน{" "}
                    <span className="whitespace-nowrap font-medium text-zinc-900">
                      {selectedPlan.name}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  disabled={pending}
                  className="self-start"
                >
                  เปลี่ยนแพ็กเกจ
                </Button>
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
                  มีบัญชีแล้ว?{" "}
                  <Link
                    href={`/login?next=${encodeURIComponent(next)}`}
                    className="text-zinc-900 underline underline-offset-4"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
                <Button onClick={submit} disabled={!hydrated || pending} className="w-full">
                  สร้างบัญชี ({selectedPlan.name})
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="grid place-items-center">
              <div className="relative aspect-square w-[320px] max-w-full">
                <Image
                  src="/brand/register-icon.png"
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
      )}
    </div>
  );
}

