/** ใช้เมื่อไม่ได้ตั้ง `NEXT_PUBLIC_FEEDBACK_EMAIL` */
const DEFAULT_FEEDBACK_EMAIL = "admintrackerz@gmail.com";

/**
 * ตั้งค่าใน `.env.local` ได้: NEXT_PUBLIC_FEEDBACK_EMAIL=you@example.com
 * ถ้าไม่ตั้ง จะใช้อีเมลเริ่มต้นด้านบน
 */
export function getFeedbackEmail(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "").trim();
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return DEFAULT_FEEDBACK_EMAIL;
}

export function feedbackMailtoHref(subject: string): string | null {
  const email = getFeedbackEmail();
  if (!email || !email.includes("@")) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
