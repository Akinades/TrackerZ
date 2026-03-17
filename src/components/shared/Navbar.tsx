"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AuthButtons } from "@/components/shared/NavbarAuth";

const nav = [
  { href: "/dashboard", label: "พอร์ตภาพรวม" },
  { href: "/transactions", label: "บันทึกรายการ" }
] as const;

export function Navbar() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-20 -mx-4 bg-transparent px-4 py-5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
            <Image src="/logo.png" alt="TrackerZ logo" fill className="object-cover" />
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-zinc-900 bg-clip-text text-lg font-semibold text-transparent sm:text-xl">
              TrackerZ
            </span>
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              MVP
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
                  : "rounded-2xl px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-2 hidden sm:block">
            <AuthButtons />
          </div>
        </nav>
      </div>
    </header>
  );
}

