const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isTruthy(value: string | undefined) {
  return value ? TRUE_VALUES.has(value.trim().toLowerCase()) : false;
}

export function shouldUseSecureAuthCookie() {
  if (isTruthy(process.env.AUTH_COOKIE_SECURE)) return true;
  if (isTruthy(process.env.AUTH_COOKIE_INSECURE)) return false;

  const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  return appBaseUrl.startsWith("https://");
}

