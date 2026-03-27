import type { Metadata } from "next";
import { Suspense } from "react";
import { OmiseCheckoutMockClient } from "@/components/billing/OmiseCheckoutMockClient";

export const metadata: Metadata = {
  title: "ชำระเงิน (Omise Mock) — TrackerZ",
  description: "หน้าจำลอง Omise Checkout สำหรับทดสอบ"
};

function Fallback() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center text-sm text-zinc-600">กำลังโหลด…</div>
  );
}

export default function BillingOmiseMockPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <OmiseCheckoutMockClient />
    </Suspense>
  );
}
