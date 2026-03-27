"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/store/useAuth";
import type { UserPlan } from "@/lib/authStorage";
import { notify } from "@/lib/notify";
import { getPlanOption, PlanSelectorCards } from "@/components/plan/PlanSelectorCards";
import { readPendingRegister, savePendingRegister } from "@/lib/registerPendingStorage";

export function RegisterClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const initialPlan = params.get("plan");

  const { user, hydrated, register } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [termsModalOpen, setTermsModalOpen] = React.useState(false);
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

  /** กลับจาก Omise แล้วยังมีข้อมูลค้าง — โหลดฟอร์มต่อ (mock) */
  React.useEffect(() => {
    const pending = readPendingRegister();
    if (!pending) return;
    setEmail(pending.email);
    setPassword(pending.password);
    setConfirmPassword(pending.password);
    setPlanId(pending.plan);
    setStep(2);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(next);
  }, [hydrated, user, router, next]);

  const submit = async () => {
    if (pending) return;
    setError(null);
    if (!termsAccepted) {
      setError("กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัคร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setPending(true);
    try {
      if (planId === "monthly" || planId === "yearly") {
        savePendingRegister({
          email: email.trim(),
          password,
          plan: planId,
          next
        });
        setPending(false);
        router.push(`/billing/omise?plan=${planId}&next=${encodeURIComponent(next)}`);
        return;
      }
      await register(email, password, planId);
      notify.success("สมัครสมาชิกสำเร็จ");
      setPending(false);
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

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    hydrated &&
    !pending &&
    termsAccepted &&
    Boolean(email.trim()) &&
    password.length >= 6 &&
    !passwordMismatch;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <div className="grid gap-6">
      {step === 1 ? (
        <div className="rounded-3xl border border-zinc-200/70 bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                เลือกแพ็กเกจก่อนสมัคร
              </div>
              <div className="mt-1 text-sm leading-relaxed text-zinc-600 sm:text-base">
                Step 1: เลือกแพ็กเกจที่ต้องการก่อน
              </div>
            </div>
            <div className="shrink-0 self-start rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
              Step 1: Plan
            </div>
          </div>
          <PlanSelectorCards
            selectedPlan={planId}
            onSelect={setPlanId}
            className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3 lg:items-stretch"
          />
          <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button onClick={() => setStep(2)} className="min-w-40 w-full px-5 py-2.5 text-sm sm:w-auto sm:py-3 sm:text-base">
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    autoComplete="new-password"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm text-zinc-700" htmlFor="register-confirm-password">
                    ยืนยันรหัสผ่าน
                  </label>
                  <Input
                    id="register-confirm-password"
                    value={confirmPassword}
                    type="password"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    autoComplete="new-password"
                    aria-invalid={passwordMismatch}
                    aria-describedby={passwordMismatch ? "register-confirm-password-hint" : undefined}
                    className={
                      passwordMismatch
                        ? "border-rose-400 ring-rose-200 focus:ring-rose-300"
                        : undefined
                    }
                  />
                  {passwordMismatch ? (
                    <p id="register-confirm-password-hint" className="text-sm text-rose-600" role="alert">
                      รหัสผ่านไม่ตรงกัน กรุณากรอกให้เหมือนกับช่องรหัสผ่านด้านบน
                    </p>
                  ) : null}
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-3 sm:px-4">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm leading-snug text-zinc-700">
                    ฉันได้อ่านและยอมรับ{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsModalOpen(true);
                      }}
                      className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                    >
                      เงื่อนไขการใช้งาน
                    </button>{" "}
                    ของ TrackerZ
                  </span>
                </label>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <form className="grid gap-3" onSubmit={handleFormSubmit} noValidate>
                <div className="text-sm text-zinc-600">
                  มีบัญชีแล้ว?{" "}
                  <Link
                    href={`/login?next=${encodeURIComponent(next)}`}
                    className="text-zinc-900 underline underline-offset-4"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
                <Button type="submit" disabled={!canSubmit} className="w-full">
                  สร้างบัญชี ({selectedPlan.name})
                </Button>
              </form>
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

      <Modal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="เงื่อนไขการใช้งาน"
        className="max-h-[85vh] max-w-lg overflow-y-auto sm:p-6"
      >
        <p className="text-sm text-zinc-600">
          ฉบับย่อสำหรับ MVP — ปรับแต่งกับทีมกฎหมายก่อนใช้งานจริง
        </p>
        <div className="mt-4 grid gap-3 text-sm leading-relaxed text-zinc-700">
          <p>
            <span className="font-medium text-zinc-900">1. การให้บริการ</span> — TrackerZ
            ให้บริการบันทึกและวิเคราะห์พอร์ตการลงทุนตามที่ระบุบนเว็บไซต์
            ข้อมูลที่แสดงไม่ถือเป็นคำแนะนำการลงทุน
          </p>
          <p>
            <span className="font-medium text-zinc-900">2. บัญชีผู้ใช้</span> — คุณต้องรักษาความลับของรหัสผ่าน
            และรับผิดชอบต่อกิจกรรมภายใต้บัญชีของคุณ
          </p>
          <p>
            <span className="font-medium text-zinc-900">3. การสมัครและแพ็กเกจ</span> — ค่าบริการและการต่ออายุเป็นไปตามแพ็กเกจและช่องทางชำระเงินที่ระบุ
          </p>
          <p>
            <span className="font-medium text-zinc-900">4. การเปลี่ยนแปลง</span> — เราอาจปรับปรุงเงื่อนไขนี้ได้ โดยแจ้งผ่านเว็บไซต์หรือช่องทางที่เหมาะสม
          </p>
        </div>
      </Modal>
    </div>
  );
}

