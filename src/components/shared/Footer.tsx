"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="py-8 text-sm text-zinc-500">
      TrackerZ MVP • Minimal
    </footer>
  );
}

