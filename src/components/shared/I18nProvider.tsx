"use client";

import * as React from "react";
import type { AppLocale } from "@/i18n";
import { DEFAULT_LOCALE, LOCALES, translate } from "@/i18n";
import { useAuth } from "@/store/useAuth";

type I18nContextValue = {
  locale: AppLocale;
  hydrated: boolean;
  setLocale: (v: AppLocale) => void;
  t: (key: string) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

const KEY = "trackerz.locale.v1";
const EVT = "trackerz:locale";

function safeRead(): AppLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "th" || v === "en") return v;
    return null;
  } catch {
    return null;
  }
}

function safeWrite(v: AppLocale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    // ignore
  }
}

function detectInitialLocale(): AppLocale {
  const stored = safeRead();
  if (stored) return stored;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<AppLocale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = React.useState(false);
  const { user, hydrated: authHydrated, updateProfile } = useAuth();

  React.useEffect(() => {
    setLocaleState(detectInitialLocale());
    setHydrated(true);

    const onLocale = (e: Event) => {
      const ce = e as CustomEvent<AppLocale>;
      const v = ce.detail;
      if (v === "th" || v === "en") setLocaleState(v);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const v = safeRead();
      if (v) setLocaleState(v);
    };
    const onFocus = () => {
      const v = safeRead();
      if (v) setLocaleState(v);
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const v = safeRead();
      if (v) setLocaleState(v);
    };

    window.addEventListener(EVT, onLocale as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener(EVT, onLocale as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Prefer user.language (server source of truth) once auth is hydrated.
  React.useEffect(() => {
    if (!authHydrated) return;
    const stored = safeRead();
    const uLang = user?.language;

    // If user selected a locale before auth finished (stored exists),
    // keep the UI consistent and sync it to backend once we have a user.
    if (user && (stored === "th" || stored === "en") && stored !== uLang) {
      if (stored !== locale) {
        setLocaleState(stored);
        safeWrite(stored);
        try {
          window.dispatchEvent(new CustomEvent<AppLocale>(EVT, { detail: stored }));
        } catch {
          // ignore
        }
      }
      void updateProfile({ language: stored }).catch(() => {
        // ignore: backend may reject, UI still uses local selection
      });
      return;
    }

    // Default: follow server preference.
    if (uLang !== "th" && uLang !== "en") return;
    if (uLang === locale) return;
    setLocaleState(uLang);
    safeWrite(uLang);
    try {
      window.dispatchEvent(new CustomEvent<AppLocale>(EVT, { detail: uLang }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHydrated, user?.language]);

  const setLocale = React.useCallback((v: AppLocale) => {
    const next: AppLocale = LOCALES.includes(v) ? v : DEFAULT_LOCALE;
    setLocaleState(next);
    safeWrite(next);
    try {
      window.dispatchEvent(new CustomEvent<AppLocale>(EVT, { detail: next }));
    } catch {
      // ignore
    }
    // Persist to backend when logged in (best-effort).
    if (user && user.language !== next) {
      void updateProfile({ language: next }).catch(() => {
        // ignore: UI still switches locally
      });
    }
  }, [updateProfile, user]);

  const t = React.useCallback((key: string) => translate(locale, key), [locale]);

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, hydrated, setLocale, t }),
    [locale, hydrated, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      hydrated: false,
      setLocale: () => {},
      t: (key: string) => translate(DEFAULT_LOCALE, key),
    } satisfies I18nContextValue;
  }
  return ctx;
}

