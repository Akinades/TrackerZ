import { en } from "@/i18n/messages/en";
import { th } from "@/i18n/messages/th";

export type AppLocale = "th" | "en";

export const DEFAULT_LOCALE: AppLocale = "th";
export const LOCALES: readonly AppLocale[] = ["th", "en"] as const;

export type Messages = typeof th;

const MESSAGES_BY_LOCALE: Record<AppLocale, Messages> = {
  th,
  en: en as unknown as Messages,
};

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: any = obj; // runtime path resolution
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

export function getMessages(locale: AppLocale): Messages {
  return MESSAGES_BY_LOCALE[locale] ?? MESSAGES_BY_LOCALE[DEFAULT_LOCALE];
}

export function translate(locale: AppLocale, key: string): string {
  const m = getMessages(locale);
  const v = getByPath(m, key);
  if (typeof v === "string") return v;

  const fallback = getByPath(getMessages(DEFAULT_LOCALE), key);
  if (typeof fallback === "string") return fallback;

  return key; // last resort: show the key
}

