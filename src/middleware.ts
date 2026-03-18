import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPublicPath(pathname: string) {
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

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

  // If logged in, keep auth pages and home out of the way
  if (authed && isPublicPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

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
  matcher: ["/", "/login", "/register", "/dashboard", "/transactions", "/settings", "/account"]
};

