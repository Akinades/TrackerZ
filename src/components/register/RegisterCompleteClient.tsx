"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/useAuth";
import { notify } from "@/lib/notify";
import {
  clearPendingRegister,
  readPendingRegister,
  savePendingRegister
} from "@/lib/registerPendingStorage";
import { runRegisterCompleteOnce } from "@/lib/registerCompleteOnce";

export function RegisterCompleteClient() {
  const router = useRouter();
  const { register } = useAuth();
  const [state, setState] = React.useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    void runRegisterCompleteOnce(async () => {
      const pending = readPendingRegister();
      if (!pending) {
        router.replace("/register");
        return;
      }
      try {
        await register(pending.email, pending.password, pending.plan);
        clearPendingRegister();
        notify.success("สมัครสมาชิกสำเร็จ");
        router.replace(pending.next);
      } catch (e) {
        savePendingRegister(pending);
        const msg = e instanceof Error ? e.message : "สมัครไม่สำเร็จ";
        setErrorMsg(msg);
        setState("error");
        notify.error(msg, "สมัครสมาชิกไม่สำเร็จ");
      }
    });
  }, [register, router]);

  if (state === "error" && errorMsg) {
    return (
      <Card className="mx-auto max-w-md p-6 text-center">
        <div className="text-lg font-semibold text-zinc-900">สมัครไม่สำเร็จ</div>
        <p className="mt-2 text-sm text-zinc-600">{errorMsg}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/register">
            <Button className="w-full sm:w-auto">กลับไปแก้ไข</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8 text-center text-sm text-zinc-600">
      กำลังสร้างบัญชีหลังชำระเงิน…
    </div>
  );
}
