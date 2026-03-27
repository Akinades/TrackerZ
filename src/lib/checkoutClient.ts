import type { PaidPlan } from "@/lib/pricingPlans";

export type CheckoutSessionResponse = {
  /** URL ไปหน้าชำระเงินของผู้ให้บริการ (Stripe/Omise ฯลฯ) */
  checkoutUrl?: string;
  /** บาง Backend ใช้ key `url` */
  url?: string;
  message?: string;
};

function pickCheckoutUrl(json: CheckoutSessionResponse | null): string | undefined {
  if (!json) return undefined;
  return json.checkoutUrl || json.url;
}

/** เริ่ม Checkout — POST /api/billing/checkout แล้วได้ URL สำหรับ redirect */
export async function startCheckoutSession(plan: PaidPlan): Promise<string> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
    credentials: "same-origin"
  });
  const json = (await res.json().catch(() => null)) as CheckoutSessionResponse | null;
  if (!res.ok) {
    throw new Error(json?.message || "ไม่สามารถเปิดหน้าชำระเงินได้");
  }
  const href = pickCheckoutUrl(json);
  if (!href) {
    throw new Error("เซิร์ฟเวอร์ไม่ส่งลิงก์ชำระเงิน");
  }
  return href;
}
