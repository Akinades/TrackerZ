/**
 * รูปแบบ user ที่ backend ส่งออก (PublicUser) — ไม่มี password / passwordHash
 */
export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  lineId: string;
  country: string;
  occupation: string;
  bio: string;
  notes: string;
  /** ISO 8601 จาก backend */
  updatedAt: string;
};

export type UserProfilePatch = Partial<
  Pick<PublicUser, "displayName" | "phone" | "lineId" | "country" | "occupation" | "bio" | "notes">
>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
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
    displayName: str(o.displayName),
    phone: str(o.phone),
    lineId: str(o.lineId),
    country: str(o.country, "TH"),
    occupation: str(o.occupation),
    bio: str(o.bio),
    notes: str(o.notes),
    updatedAt: str(o.updatedAt)
  };
}
