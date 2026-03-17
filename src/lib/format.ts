import type { AppCurrency } from "@/store/useCurrency";

export function formatMoney(n: number, currency: AppCurrency) {
  const v = Number.isFinite(n) ? n : 0;
  const locale = currency === "THB" ? "th-TH" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(v);
}

export function formatNumber2(n: number, locale = "th-TH") {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);
}

