import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/transactions" ||
    pathname === "/settings" ||
    pathname === "/account"
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get("trackerz_token")?.value;
  const authed = Boolean(token);

  // ไม่รีไดเร็กต์จาก /login /register เมื่อมี cookie — cookie อาจหมดอายุ/เพี้ยน แต่ client ยังไม่มี user
  // หน้า login/register จะ router.replace ไป dashboard เองเมื่อ /api/auth/me สำเร็จ

  // If not logged in, protect private pages
  if (!authed && isProtectedPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const next = `${pathname}${search || ""}`;
    url.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/dashboard", "/transactions", "/settings", "/account"]
};

