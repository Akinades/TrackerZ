import type { Metadata } from "next";
import { SupportPageClient } from "@/components/support/SupportPageClient";

export const metadata: Metadata = {
  title: "สนับสนุนสำนัก — TrackerZ",
  description: "ใช้ TrackerZ ฟรีเต็มรูปแบบ — สนับสนุนผู้พัฒนาด้วย PromptPay แบบไม่บังคับ",
};

export default function SupportPage() {
  return <SupportPageClient />;
}
