import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold">TrackerZ</h1>
          <p className="text-zinc-300">
            MVP สำหรับบันทึกรายการซื้อ/ขาย และดูภาพรวมพอร์ตแบบง่ายๆ (Responsive)
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">ไปหน้า Dashboard</Button>
          </Link>
          <Link href="/transactions" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              บันทึกรายการ
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-3 text-sm text-zinc-300">
        <div>
          - เก็บข้อมูลในเครื่องด้วย <span className="font-medium">localStorage</span>{" "}
          (เหมาะกับ MVP)
        </div>
        <div>
          - โครงสร้างเตรียมพร้อมต่อยอดไป API/DB ได้ (เช่น Supabase/Prisma)
        </div>
      </div>
    </div>
  );
}

