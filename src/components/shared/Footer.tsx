"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { feedbackMailtoHref } from "@/lib/siteContact";

export function Footer() {
  const feedbackHref = feedbackMailtoHref("TrackerZ — แจ้งปัญหา / ข้อเสนอแนะ");
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/support" ||
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/") ||
    pathname.startsWith("/billing/")
  ) {
    return null;
  }

  return (
    <footer className="flex flex-col items-center gap-2 py-8 text-center text-sm text-zinc-500">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/support" className="text-emerald-700 hover:underline">
          สนับสนุนสำนัก
        </Link>
        {feedbackHref ? (
          <>
            <span className="text-zinc-300" aria-hidden>
              ·
            </span>
            <a href={feedbackHref} className="text-emerald-700 hover:underline">
              แจ้งปัญหา / ข้อเสนอแนะ
            </a>
          </>
        ) : null}
      </div>
      <div>© 2026 TrackerZ</div>
    </footer>
  );
}

