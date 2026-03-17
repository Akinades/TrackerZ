import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 py-4">
      <div className="grid gap-2">
        <div className="text-sm text-zinc-500">TrackerZ</div>
        <div className="text-2xl font-semibold tracking-tight">
          ติดตามพอร์ตแบบง่ายๆ สวยๆ บนเว็บ
        </div>
        <div className="text-sm text-zinc-600">
          บันทึกรายการซื้อ/ขาย → ดูพอร์ตภาพรวม → เห็นกำไร/ขาดทุน + กราฟสัดส่วน
        </div>
        <div className="text-sm">
          <Link href="/" className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900">
            กลับหน้าแรก
          </Link>
        </div>
      </div>

      <Card className="p-6">{children}</Card>

      <div className="text-xs text-zinc-500">
        MVP: บัญชี/ข้อมูลถูกเก็บในเครื่องคุณ (localStorage)
      </div>
    </div>
  );
}

