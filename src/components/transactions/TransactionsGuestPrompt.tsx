import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function TransactionsGuestPrompt() {
  return (
    <Card className="p-6">
      <div className="grid gap-2">
        <div className="text-lg font-semibold">เข้าสู่ระบบเพื่อบันทึกรายการ</div>
        <div className="text-sm text-zinc-600">ล็อกอินก่อน แล้วค่อยเพิ่ม/แก้ไข/ลบรายการซื้อขายได้</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link href="/login?next=/transactions" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">เข้าสู่ระบบ</Button>
          </Link>
          <Link href="/register?next=/transactions" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              สมัครสมาชิก
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
