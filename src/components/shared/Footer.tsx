"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/") ||
    pathname.startsWith("/billing/")
  ) {
    return null;
  }

  return (
    <footer className="flex flex-col items-center gap-2 py-8 text-center text-sm text-zinc-500">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/pricing" className="text-emerald-700 hover:underline">
          แพ็กเกจและราคา
        </Link>
      </div>
      <div>© 2026 TrackerZ</div>
    </footer>
  );
}

