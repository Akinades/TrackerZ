import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) return NextResponse.json({ user: null });

  const upstream = await backendFetch("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const res = NextResponse.json({ user: null }, { status: upstream.status });
    if (upstream.status === 401 || upstream.status === 403) {
      res.cookies.set("trackerz_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    }
    return res;
  }

  const user = (json as any)?.user ?? (json as any)?.data?.user ?? json;
  return NextResponse.json({ user });
}

