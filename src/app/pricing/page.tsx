import type { Metadata } from "next";
import { PricingPageClient } from "@/components/pricing/PricingPageClient";

export const metadata: Metadata = {
  title: "ราคา — TrackerZ",
  description: "แพ็กเกจ Free, Pro Monthly และ Pro Yearly สำหรับ TrackerZ"
};

export default function PricingPage() {
  return <PricingPageClient />;
}
