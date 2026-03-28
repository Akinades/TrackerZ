"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/store/useAuth";
import { forgotPassword, resetPasswordWithOtp } from "@/lib/authStorage";
import { notify } from "@/lib/notify";
import { Modal } from "@/components/ui/Modal";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const { user, hydrated, login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [forgotStep, setForgotStep] = React.useState<1 | 2>(1);
  const [forgotPending, setForgotPending] = React.useState(false);
  const [forgotError, setForgotError] = React.useState<string | null>(null);
  const [retryAfter, setRetryAfter] = React.useState(0);

  React.useEffect(() => {
    if (retryAfter <= 0) return;
    const id = window.setInterval(() => {
      setRetryAfter((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [retryAfter]);

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
      notify.success("เข้าสู่ระบบสำเร็จ");
      router.replace(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
      setError(msg);
      notify.error(msg, "เข้าสู่ระบบไม่สำเร็จ");
      setPending(false);
    }
  };

  const openForgot = () => {
    setForgotOpen(true);
    setForgotEmail(email.trim().toLowerCase());
    setOtp("");
    setNewPassword("");
    setForgotStep(1);
    setForgotError(null);
    setRetryAfter(0);
  };

  const sendOtp = async () => {
    if (forgotPending) return;
    setForgotError(null);
    setForgotPending(true);
    try {
      const msg = await forgotPassword(forgotEmail);
      notify.success(msg || "ส่ง OTP เรียบร้อย");
      setForgotStep(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ส่ง OTP ไม่สำเร็จ";
      const retry = (e as Error & { retryAfterSeconds?: number })?.retryAfterSeconds ?? 0;
      if (retry > 0) setRetryAfter(retry);
      setForgotError(msg);
      notify.error(msg, "ลืมรหัสผ่าน");
    } finally {
      setForgotPending(false);
    }
  };

  const resetByOtp = async () => {
    if (forgotPending) return;
    setForgotError(null);
    setForgotPending(true);
    try {
      const msg = await resetPasswordWithOtp(forgotEmail, otp, newPassword);
      notify.success(msg || "รีเซ็ตรหัสผ่านสำเร็จ");
      setForgotOpen(false);
      setPassword("");
      setOtp("");
      setNewPassword("");
      setForgotStep(1);
      setForgotError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "รีเซ็ตรหัสผ่านไม่สำเร็จ";
      const retry = (e as Error & { retryAfterSeconds?: number })?.retryAfterSeconds ?? 0;
      if (retry > 0) setRetryAfter(retry);
      setForgotError(msg);
      notify.error(msg, "รีเซ็ตรหัสผ่าน");
    } finally {
      setForgotPending(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8 md:items-center">
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
              <PasswordInput
                value={password}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3">
            <div className="text-sm">
              <button
                type="button"
                onClick={openForgot}
                className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <Button
              onClick={submit}
              disabled={!hydrated || pending}
              className="w-full"
            >
              เข้าสู่ระบบ
            </Button>
            <div className="text-sm text-zinc-600">
              ยังไม่มีบัญชี?{" "}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="text-zinc-900 underline underline-offset-4"
              >
                สมัครสมาชิก
              </Link>
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

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="ลืมรหัสผ่าน (OTP)">
        <div className="grid gap-3">
          <div className="text-sm text-zinc-600">
            {forgotStep === 1
              ? "กรอกอีเมลเพื่อรับ OTP 6 หลัก"
              : "กรอก OTP 6 หลัก และตั้งรหัสผ่านใหม่"}
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-zinc-700">อีเมล</label>
            <Input
              value={forgotEmail}
              inputMode="email"
              placeholder="you@example.com"
              onChange={(e) => setForgotEmail(e.target.value)}
            />
          </div>
          {forgotStep === 2 ? (
            <>
              <div className="grid gap-1">
                <label className="text-sm text-zinc-700">OTP 6 หลัก</label>
                <Input
                  value={otp}
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm text-zinc-700">รหัสผ่านใหม่</label>
                <PasswordInput
                  value={newPassword}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : null}
          {forgotError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {forgotError}
            </div>
          ) : null}
          {retryAfter > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              กรุณารอ {retryAfter} วินาที แล้วลองใหม่
            </div>
          ) : null}
          <div className="flex gap-2">
            {forgotStep === 1 ? (
              <Button onClick={sendOtp} disabled={forgotPending || retryAfter > 0} className="w-full">
                {retryAfter > 0 ? `ส่ง OTP อีกครั้งใน ${retryAfter}s` : "ส่ง OTP"}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={sendOtp}
                  disabled={forgotPending || retryAfter > 0}
                  className="w-full"
                >
                  {retryAfter > 0 ? `ส่ง OTP ใหม่ใน ${retryAfter}s` : "ส่ง OTP ใหม่"}
                </Button>
                <Button onClick={resetByOtp} disabled={forgotPending} className="w-full">
                  รีเซ็ตรหัสผ่าน
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
