import type { PublicUser } from "@/types/publicUser";

/** ฟอร์มโปรไฟล์ (ไม่รวม id / email) — ตรงกับฟิลด์ที่ PATCH /api/auth/me รับ */
export type UserProfile = Pick<
  PublicUser,
  "displayName" | "phone" | "lineId" | "country" | "occupation" | "bio" | "notes" | "updatedAt"
>;

export function publicUserToProfileForm(u: PublicUser): UserProfile {
  return {
    displayName: u.displayName,
    phone: u.phone,
    lineId: u.lineId,
    country: u.country || "TH",
    occupation: u.occupation,
    bio: u.bio,
    notes: u.notes,
    updatedAt: u.updatedAt
  };
}

export const emptyUserProfile = (): UserProfile => ({
  displayName: "",
  phone: "",
  lineId: "",
  country: "TH",
  occupation: "",
  bio: "",
  notes: "",
  updatedAt: ""
});
