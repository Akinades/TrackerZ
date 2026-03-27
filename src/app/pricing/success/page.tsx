import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingSuccessClient } from "@/components/pricing/PricingSuccessClient";

export const metadata: Metadata = {
  title: "ชำระเงินสำเร็จ — TrackerZ",
  description: "ขอบคุณที่สมัคร TrackerZ Pro"
};

function SuccessFallback() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center text-sm text-zinc-600">กำลังโหลด…</div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <PricingSuccessClient />
    </Suspense>
  );
}
