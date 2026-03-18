import "server-only";

import { cookies } from "next/headers";

export const BACKEND_BASE =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function getAccessTokenFromCookies() {
  const c = await cookies();
  return c.get("trackerz_token")?.value ?? null;
}

export async function backendFetch(path: string, init?: RequestInit) {
  const url = `${BACKEND_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, init);
}

