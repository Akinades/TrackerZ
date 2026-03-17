"use client";

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
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200/70 bg-white/70 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="relative h-8 w-8 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
            <Image src="/logo.png" alt="TrackerZ logo" fill className="object-cover" />
          </span>
          <span>TrackerZ</span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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

