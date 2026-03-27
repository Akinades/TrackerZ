import type { UserPlan } from "@/lib/authStorage";

/** ค่าคงที่ราคาและข้อความแพ็กเกจ — ใช้ร่วมกันหลายหน้า */
export const PRICING_COPY = {
  free: {
    titleTh: "ผู้ฝึกตน",
    headlinePrice: "0.-",
    unit: "บาท / เดือน",
    note: "จดรายการได้สูงสุด 20 รายการ/เดือน"
  },
  monthly: {
    titleTh: "จอมยุทธ์",
    promoPrice: "39.-",
    regularPrice: "79.-",
    unitFirst: "บาท เดือนแรก (โปร)",
    unitNext: "บาท/เดือนถัดไป",
    badge: "โปรเปิดสำนัก"
  },
  yearly: {
    titleTh: "มหาเซียน",
    price: "790.-",
    unit: "บาท / ปี",
    savings: "ประหยัดกว่ารายเดือน 2 เดือน",
    badge: "คุ้มสุด"
  }
} as const;

/**
 * แถวเปรียบเทียบฟีเจอร์ — ให้สอดคล้องกับการ์ดแพ็กในหน้า Register (PlanSelectorCards)
 */
export const REGISTER_FEATURE_COMPARISON_ROWS: readonly {
  feature: string;
  free: boolean;
  pro: boolean;
}[] = [
  { feature: "Dashboard และบันทึกธุรกรรม", free: true, pro: true },
  { feature: "Import CSV และเครื่องมือวิเคราะห์เต็มรูปแบบ", free: false, pro: true },
  { feature: "รายงานเชิงลึก เป้าหมายสัดส่วน และเครื่องมือ Pro", free: false, pro: true }
];

export type PaidPlan = Extract<UserPlan, "monthly" | "yearly">;

/**
 * ส่งแพ็กที่เลือกไปอัปเดต MongoDB ผ่าน Backend (PATCH /api/auth/plan → upstream)
 * ใช้หลังชำระเงินสำเร็จ (หรือเมื่อต้องซิงค์แพ็กฝั่ง client)
 */
export async function submitSelectedPlanToBackend(
  plan: UserPlan,
  updatePlan: (p: UserPlan) => Promise<unknown>
) {
  return updatePlan(plan);
}
