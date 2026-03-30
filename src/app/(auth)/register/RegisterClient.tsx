"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/store/useAuth";
import { notify } from "@/lib/notify";
import { useI18n } from "@/components/shared/I18nProvider";

export function RegisterClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { t, locale } = useI18n();

  const { user, hydrated, register } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [termsModalOpen, setTermsModalOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(next);
  }, [hydrated, user, router, next]);

  const submit = async () => {
    if (pending) return;
    setError(null);
    if (!termsAccepted) {
      setError(t("auth.register.mustAcceptTerms"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.register.pwMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.register.pwMin"));
      return;
    }
    setPending(true);
    try {
      await register(email, password, locale);
      notify.success(t("auth.register.successToast"));
      setPending(false);
      router.replace(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("common.genericError");
      setError(msg);
      notify.error(msg, t("auth.register.failedTitle"));
      setPending(false);
    }
  };

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
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8 md:items-center">
      <div className="p-2 sm:p-4">
        <div className="grid gap-4">
          <div>
            <div className="text-lg font-semibold">{t("auth.register.title")}</div>
            <div className="text-sm text-zinc-600">
              {t("auth.register.subtitle")}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700">{t("auth.register.emailLabel")}</label>
              <Input
                value={email}
                inputMode="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700">{t("auth.register.passwordLabel")}</label>
              <PasswordInput
                value={password}
                placeholder={t("auth.login.passwordPlaceholder")}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700" htmlFor="register-confirm-password">
                {t("auth.register.confirmPasswordLabel")}
              </label>
              <PasswordInput
                id="register-confirm-password"
                value={confirmPassword}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
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
                  {t("auth.register.mismatchHint")}
                </p>
              ) : null}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-3 sm:px-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-sm leading-snug text-zinc-700">
                {t("auth.register.acceptPrefix")}{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsModalOpen(true);
                  }}
                  className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                >
                  {t("auth.register.termsLink")}
                </button>{" "}
                {t("auth.register.acceptSuffix")}
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
              {t("auth.register.haveAccount")}{" "}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="text-zinc-900 underline underline-offset-4"
              >
                {t("auth.register.loginLink")}
              </Link>
            </div>
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {t("auth.register.createAccount")}
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

      <Modal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title={t("auth.register.termsModalTitle")}
        className="max-h-[85vh] max-w-lg overflow-y-auto sm:p-6"
      >
        <p className="text-sm text-zinc-600">
          {t("auth.register.termsShort")}
        </p>
        <div className="mt-4 grid gap-3 text-sm leading-relaxed text-zinc-700">
          <p>
            <span className="font-medium text-zinc-900">{t("auth.register.terms1Title")}</span>{" "}
            — {t("auth.register.terms1Body")}
          </p>
          <p>
            <span className="font-medium text-zinc-900">{t("auth.register.terms2Title")}</span>{" "}
            — {t("auth.register.terms2Body")}
          </p>
          <p>
            <span className="font-medium text-zinc-900">{t("auth.register.terms3Title")}</span>{" "}
            — {t("auth.register.terms3Body")}
          </p>
          <p>
            <span className="font-medium text-zinc-900">{t("auth.register.terms4Title")}</span>{" "}
            — {t("auth.register.terms4Body")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
