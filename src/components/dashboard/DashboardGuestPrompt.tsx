import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DashboardGuestPrompt() {
  return (
    <Card className="p-6">
      <div className="grid gap-2">
        <div className="text-lg font-semibold">เข้าสู่ระบบเพื่อดู Dashboard</div>
        <div className="text-sm text-zinc-600">
          เพื่อให้ข้อมูลพอร์ตเป็นของคุณเอง กรุณาเข้าสู่ระบบก่อนใช้งาน
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link href="/login?next=/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">เข้าสู่ระบบ</Button>
          </Link>
          <Link href="/register?next=/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              สมัครสมาชิก
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
