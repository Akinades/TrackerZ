import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** หน้าที่ยอมให้ guest เข้าได้โดยไม่มี cookie */
function isPublicGuestPath(pathname: string) {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return true;
  if (pathname === "/register/complete") return true;
  if (pathname === "/pricing" || pathname === "/pricing/success") return true;
  if (pathname === "/billing/omise") return true;
  if (pathname === "/support") return true;
  return false;
}

/** หน้า landing / auth ที่ถ้า login แล้วจะส่งไปแดชบอร์ด */
function isAuthEntryPath(pathname: string) {
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

function isStaticAssetPath(pathname: string) {
  return (
    pathname.startsWith("/asset-icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/site.webmanifest"
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("trackerz_token")?.value;
  const authed = Boolean(token?.trim());

  if (authed && isAuthEntryPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!authed && !isPublicGuestPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|webmanifest)$).*)"
  ]
};
