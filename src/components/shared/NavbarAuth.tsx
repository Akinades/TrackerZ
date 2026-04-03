"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { useAuth } from "@/store/useAuth";
import { useCurrency } from "@/store/useCurrency";
import { notify } from "@/lib/notify";
import { useI18n } from "@/components/shared/I18nProvider";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ExternalLink } from "lucide-react";

type MobileNavItem = {
  href: string;
  label: string;
};

type AuthButtonsProps = {
  mobileNavItems?: readonly MobileNavItem[];
  currentPath?: string;
};

export function AuthButtons({
  mobileNavItems = [],
  currentPath,
}: AuthButtonsProps) {
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!hydrated) return null;
  if (!user) return null;

  const menuLabel = user.displayName.trim() || user.email;

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[320px] items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        aria-label={t("authMenu.userMenuAria")}
      >
        <span className="max-w-[200px] truncate">{menuLabel}</span>
        <span className="text-zinc-400">▾</span>
      </button>
      <CurrencyBadge
        currency={currency}
        onToggle={() => setCurrency(currency === "USD" ? "THB" : "USD")}
        className="hidden shadow-none md:inline-flex"
      />
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_30px_70px_-55px_rgba(0,0,0,0.55)]">
          <div className="border-b border-zinc-200/70 px-4 py-3">
            <div className="text-xs text-zinc-500">{t("authMenu.signedInWith")}</div>
            <div className="mt-0.5 truncate text-sm font-medium text-zinc-900">
              {menuLabel}
            </div>
            {user.displayName.trim() ? (
              <div className="mt-1 truncate text-xs text-zinc-500">
                {user.email}
              </div>
            ) : null}
          </div>

          <Link
            href="/account"
            className="hidden px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50 md:block"
            onClick={() => setOpen(false)}
          >
            {t("authMenu.profile")}
          </Link>
          <Link
            href="/settings"
            className="hidden px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50 md:block"
            onClick={() => setOpen(false)}
          >
            {t("authMenu.settings")}
          </Link>
          <Link
            href="/support"
            className="hidden border-t border-zinc-200/70 px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50 md:block"
            onClick={() => setOpen(false)}
          >
            {t("authMenu.support")}
          </Link>
          <a
            href="https://debtz.site"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("authMenu.debtzAppAria")}
            className="hidden items-center justify-between gap-2 border-t border-zinc-200/70 px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50 md:flex"
            onClick={() => setOpen(false)}
          >
            <span>{t("authMenu.debtzApp")}</span>
            <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          </a>

          <div className="hidden border-t border-zinc-200/70 px-4 py-3 md:block">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-zinc-600">{t("authMenu.language")}</div>
              <LanguageToggle />
            </div>
          </div>

          {mobileNavItems.length ? (
            <div className="border-t border-zinc-200/70 md:hidden">
              {mobileNavItems.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive
                        ? "block bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
                        : "block px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {/* Mobile-only: keep main nav first, then account/settings. */}
          <div className="border-t border-zinc-200/70 md:hidden">
            <Link
              href="/account"
              className="block px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              {t("authMenu.profile")}
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              {t("authMenu.settings")}
            </Link>
            <Link
              href="/support"
              className="block border-t border-zinc-200/70 px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              {t("authMenu.support")}
            </Link>
            <a
              href="https://debtz.site"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("authMenu.debtzAppAria")}
              className="flex items-center justify-between gap-2 border-t border-zinc-200/70 px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              <span>{t("authMenu.debtzApp")}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            </a>
          </div>

          <div className="border-t border-zinc-200/70 px-4 py-3 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-zinc-600">{t("authMenu.currency")}</div>
              <CurrencyBadge
                currency={currency}
                size="sm"
                onToggle={() => setCurrency(currency === "USD" ? "THB" : "USD")}
                ariaLabel={t("authMenu.currencyToggleAria")}
              />
            </div>
          </div>

          <div className="border-t border-zinc-200/70 px-4 py-3 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-zinc-600">{t("authMenu.language")}</div>
              <LanguageToggle />
            </div>
          </div>

          <div className="border-t border-zinc-200/70 p-2">
            <Button
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={async () => {
                if (pending) return;
                setPending(true);
                setOpen(false);
                await logout();
                notify.success(t("authMenu.signedOutToast"));
                router.push("/");
              }}
            >
              {t("authMenu.signOut")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
