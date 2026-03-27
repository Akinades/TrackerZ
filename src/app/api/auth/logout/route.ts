import { NextResponse } from "next/server";
import { shouldUseSecureAuthCookie } from "@/lib/authCookie";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("trackerz_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureAuthCookie(),
    path: "/",
    maxAge: 0
  });
  return res;
}

