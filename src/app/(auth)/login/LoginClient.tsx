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
import { useI18n } from "@/components/shared/I18nProvider";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { t } = useI18n();

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
      notify.success(t("auth.login.successToast"));
      router.replace(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("common.genericError");
      setError(msg);
      notify.error(msg, t("auth.login.failedTitle"));
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
      notify.success(msg || t("auth.login.otpSent"));
      setForgotStep(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("auth.login.otpSendFailed");
      const retry = (e as Error & { retryAfterSeconds?: number })?.retryAfterSeconds ?? 0;
      if (retry > 0) setRetryAfter(retry);
      setForgotError(msg);
      notify.error(msg, t("auth.login.forgotTitle"));
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
      notify.success(msg || t("auth.login.resetSuccess"));
      setForgotOpen(false);
      setPassword("");
      setOtp("");
      setNewPassword("");
      setForgotStep(1);
      setForgotError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("auth.login.resetFailed");
      const retry = (e as Error & { retryAfterSeconds?: number })?.retryAfterSeconds ?? 0;
      if (retry > 0) setRetryAfter(retry);
      setForgotError(msg);
      notify.error(msg, t("auth.login.resetPassword"));
    } finally {
      setForgotPending(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8 md:items-center">
      <div className="p-2 sm:p-4">
        <div className="grid gap-4">
          <div>
            <div className="text-lg font-semibold">{t("auth.login.title")}</div>
            <div className="text-sm text-zinc-600">{t("auth.login.subtitle")}</div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700">{t("auth.login.emailLabel")}</label>
              <Input
                value={email}
                inputMode="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700">{t("auth.login.passwordLabel")}</label>
              <PasswordInput
                value={password}
                placeholder={t("auth.login.passwordPlaceholder")}
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
                {t("auth.login.forgotPassword")}
              </button>
            </div>
            <Button
              onClick={submit}
              disabled={!hydrated || pending}
              className="w-full"
            >
              {t("auth.login.submit")}
            </Button>
            <div className="text-sm text-zinc-600">
              {t("auth.login.noAccount")}{" "}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="text-zinc-900 underline underline-offset-4"
              >
                {t("auth.login.registerLink")}
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

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title={t("auth.login.forgotModalTitle")}
      >
        <div className="grid gap-3">
          <div className="text-sm text-zinc-600">
            {forgotStep === 1
              ? t("auth.login.forgotStep1Hint")
              : t("auth.login.forgotStep2Hint")}
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-zinc-700">{t("auth.login.emailLabel")}</label>
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
                <label className="text-sm text-zinc-700">{t("auth.login.otpLabel")}</label>
                <Input
                  value={otp}
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm text-zinc-700">{t("auth.login.newPasswordLabel")}</label>
                <PasswordInput
                  value={newPassword}
                  placeholder={t("auth.login.passwordPlaceholder")}
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
              {t("auth.login.waitRetryPrefix")} {retryAfter} {t("auth.login.waitRetrySuffix")}
            </div>
          ) : null}
          <div className="flex gap-2">
            {forgotStep === 1 ? (
              <Button onClick={sendOtp} disabled={forgotPending || retryAfter > 0} className="w-full">
                {retryAfter > 0
                  ? `${t("auth.login.resendOtpInPrefix")} ${retryAfter}${t("auth.login.resendOtpInSuffix")}`
                  : t("auth.login.sendOtp")}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={sendOtp}
                  disabled={forgotPending || retryAfter > 0}
                  className="w-full"
                >
                  {retryAfter > 0
                    ? `${t("auth.login.resendOtpIn2Prefix")} ${retryAfter}${t("auth.login.resendOtpIn2Suffix")}`
                    : t("auth.login.resendOtp")}
                </Button>
                <Button onClick={resetByOtp} disabled={forgotPending} className="w-full">
                  {t("auth.login.resetPassword")}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
