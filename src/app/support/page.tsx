import type { Metadata } from "next";
import { SupportPageClient } from "@/components/support/SupportPageClient";

export const metadata: Metadata = {
  title: "Support — TrackerZ",
  description: "Support the TrackerZ developer (optional).",
};

export default function SupportPage() {
  return <SupportPageClient />;
}
