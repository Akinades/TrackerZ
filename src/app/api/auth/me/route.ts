import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";
import { authCookieMaxAgeSeconds, shouldUseSecureAuthCookie } from "@/lib/authCookie";

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) return NextResponse.json({ user: null });

  const upstream = await backendFetch("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const res = NextResponse.json({ user: null }, { status: upstream.status });
    if (upstream.status === 401 || upstream.status === 403) {
      res.cookies.set("trackerz_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureAuthCookie(),
        path: "/",
        maxAge: 0
      });
    }
    return res;
  }

  const user = (json as any)?.user ?? (json as any)?.data?.user ?? json;
  // Sliding session: refresh cookie expiry on successful auth checks.
  const res = NextResponse.json({ user });
  res.cookies.set("trackerz_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureAuthCookie(),
    path: "/",
    maxAge: authCookieMaxAgeSeconds(),
  });
  return res;
}

export async function PATCH(req: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const upstream = await backendFetch("/api/auth/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body ?? {})
  });

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const msg =
      (json as { message?: string })?.message ??
      (json as { error?: string })?.error ??
      "อัปเดตโปรไฟล์ไม่สำเร็จ";
    return NextResponse.json({ message: msg }, { status: upstream.status });
  }

  const user = (json as { user?: unknown })?.user ?? (json as { data?: { user?: unknown } })?.data?.user ?? json;
  // Sliding session: also refresh cookie on successful profile updates.
  const res = NextResponse.json({ user });
  res.cookies.set("trackerz_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureAuthCookie(),
    path: "/",
    maxAge: authCookieMaxAgeSeconds(),
  });
  return res;
}

