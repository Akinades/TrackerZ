import { Suspense } from "react";
import { RegisterClient } from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-600">กำลังโหลด…</div>}>
      <RegisterClient />
    </Suspense>
  );
}

