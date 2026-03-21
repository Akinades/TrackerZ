import type { Transaction } from "@/types/transactions";

/** เวลาที่ทำรายการจริง (traded_at) ถ้ามี — ไม่เช่นนั้นใช้ createdAt */
export function txExecutedAtIso(t: Transaction): string {
  const ta = t.tradedAt?.trim();
  if (ta) return ta;
  return t.createdAt;
}

export function txExecutedAtMs(t: Transaction): number {
  return new Date(txExecutedAtIso(t)).getTime();
}
