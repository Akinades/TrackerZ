import type { UserPlan } from "@/lib/authStorage";

const KEY = "trackerz_register_pending";

export type PendingRegisterPayload = {
  email: string;
  password: string;
  plan: UserPlan;
  next: string;
};

/** เก็บชั่วคราวก่อนไปหน้าชำระเงิน — mock เท่านั้น ไม่ควรใช้รหัสผ่านจริงใน sessionStorage บน production */
export function savePendingRegister(payload: PendingRegisterPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function readPendingRegister(): PendingRegisterPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as PendingRegisterPayload;
    if (typeof o.email !== "string" || typeof o.password !== "string") return null;
    if (o.plan !== "free" && o.plan !== "monthly" && o.plan !== "yearly") return null;
    return {
      email: o.email,
      password: o.password,
      plan: o.plan,
      next: typeof o.next === "string" && o.next.startsWith("/") ? o.next : "/dashboard"
    };
  } catch {
    return null;
  }
}

export function clearPendingRegister(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
