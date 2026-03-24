/**
 * รูปแบบ user ที่ backend ส่งออก (PublicUser) — ไม่มี password / passwordHash
 */
export type PublicUser = {
  id: string;
  email: string;
  plan: "free" | "monthly" | "yearly";
  /** ISO 8601 หรือ null */
  planStartedAt: string | null;
  /** ISO 8601 หรือ null */
  planExpiresAt: string | null;
  displayName: string;
  phone: string;
  lineId: string;
  country: string;
  occupation: string;
  bio: string;
  notes: string;
  /** ISO 8601 จาก backend */
  updatedAt: string;
  /** ISO date (yyyy-mm-dd) ของตัวนับแพ็กเกจ Free */
  freePlanDailyCountDate?: string | null;
  /** จำนวนครั้งที่สร้างรายการวันนี้ (เฉพาะ Free) */
  freePlanDailyCount?: number;
};

export type UserProfilePatch = Partial<
  Pick<PublicUser, "displayName" | "phone" | "lineId" | "country" | "occupation" | "bio" | "notes">
>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function nullableIso(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

/** แปลง response จาก API ให้ได้ PublicUser เสมอ (ค่าเก่าใน DB ที่ไม่มีฟิลด์ → "") */
export function normalizePublicUser(input: unknown): PublicUser | null {
  if (input == null || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const id = o.id;
  const email = o.email;
  if (typeof id !== "string" || typeof email !== "string") return null;
  return {
    id,
    email,
    plan: o.plan === "monthly" || o.plan === "yearly" ? o.plan : "free",
    planStartedAt: nullableIso(o.planStartedAt),
    planExpiresAt: nullableIso(o.planExpiresAt),
    displayName: str(o.displayName),
    phone: str(o.phone),
    lineId: str(o.lineId),
    country: str(o.country, "TH"),
    occupation: str(o.occupation),
    bio: str(o.bio),
    notes: str(o.notes),
    updatedAt: str(o.updatedAt),
    freePlanDailyCountDate:
      typeof o.freePlanDailyCountDate === "string" ? o.freePlanDailyCountDate : null,
    freePlanDailyCount:
      typeof o.freePlanDailyCount === "number" && Number.isFinite(o.freePlanDailyCount)
        ? Math.max(0, Math.floor(o.freePlanDailyCount))
        : undefined
  };
}
