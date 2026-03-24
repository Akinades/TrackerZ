"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { useAuth } from "@/store/useAuth";
import { useCurrency } from "@/store/useCurrency";
import { notify } from "@/lib/notify";

export function AuthButtons() {
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!hydrated) return null;
  if (!user) return null;

  const menuLabel = user.displayName.trim() || user.email;
  const currentPlanLabel =
    user.plan === "monthly" ? "Pro Monthly" : user.plan === "yearly" ? "Pro Yearly" : "Free";

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[320px] items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        aria-label="User menu"
      >
        <span className="max-w-[200px] truncate">{menuLabel}</span>
        <span className="text-zinc-400">▾</span>
      </button>
      <CurrencyBadge
        currency={currency}
        onToggle={() => setCurrency(currency === "USD" ? "THB" : "USD")}
        className="shadow-none"
      />
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_30px_70px_-55px_rgba(0,0,0,0.55)]">
          <div className="border-b border-zinc-200/70 px-4 py-3">
            <div className="text-xs text-zinc-500">เข้าสู่ระบบด้วย</div>
            <div className="mt-0.5 truncate text-sm font-medium text-zinc-900">{menuLabel}</div>
            {user.displayName.trim() ? (
              <div className="mt-1 truncate text-xs text-zinc-500">{user.email}</div>
            ) : null}
          </div>

          <Link
            href="/account"
            className="block px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            ข้อมูลส่วนตัว
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            ตั้งค่า
          </Link>
          <Link
            href="/settings/plan"
            className="flex items-center justify-between gap-3 border-t border-zinc-200/70 px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <span>แพ็กเกจสมาชิก</span>
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              {currentPlanLabel}
            </span>
          </Link>

          <div className="border-t border-zinc-200/70 p-2">
            <Button
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={async () => {
                if (pending) return;
                setPending(true);
                setOpen(false);
                await logout();
                notify.success("ออกจากระบบแล้ว");
                router.push("/");
              }}
            >
              ออกจากระบบ
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
