const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isTruthy(value: string | undefined) {
  return value ? TRUE_VALUES.has(value.trim().toLowerCase()) : false;
}

export function authCookieMaxAgeSeconds() {
  const daysRaw = process.env.AUTH_COOKIE_MAX_AGE_DAYS;
  const days = daysRaw ? Number(daysRaw) : NaN;
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  return Math.round(safeDays * 24 * 60 * 60);
}

export function shouldUseSecureAuthCookie() {
  if (isTruthy(process.env.AUTH_COOKIE_SECURE)) return true;
  if (isTruthy(process.env.AUTH_COOKIE_INSECURE)) return false;

  const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  return appBaseUrl.startsWith("https://");
}

