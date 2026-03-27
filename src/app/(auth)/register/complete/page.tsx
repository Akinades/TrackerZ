import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterCompleteClient } from "@/components/register/RegisterCompleteClient";

export const metadata: Metadata = {
  title: "กำลังสมัครสมาชิก — TrackerZ",
  description: "สร้างบัญชีหลังชำระเงิน"
};

function Fallback() {
  return (
    <div className="py-10 text-center text-sm text-zinc-600">กำลังโหลด…</div>
  );
}

export default function RegisterCompletePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <RegisterCompleteClient />
    </Suspense>
  );
}
