import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "พอร์ตภาพรวม" },
  { href: "/transactions", label: "บันทึกรายการ" }
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200/70 bg-white/70 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight">
          TrackerZ
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
        </nav>
      </div>
    </header>
  );
}

