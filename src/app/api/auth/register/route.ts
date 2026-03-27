import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendServer";
import { shouldUseSecureAuthCookie } from "@/lib/authCookie";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const upstream = await backendFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(json ?? { message: "สมัครสมาชิกไม่สำเร็จ" }, { status: upstream.status });
  }

  const token = (json as any)?.access_token as string | undefined;
  const user = (json as any)?.user ?? (json as any)?.data?.user ?? null;

  const res = NextResponse.json({ user });
  if (token) {
    const secureCookie = shouldUseSecureAuthCookie();
    res.cookies.set("trackerz_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
      path: "/"
    });
  }
  return res;
}

