import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Card>
      <div className="grid gap-2">
        <div className="text-lg font-semibold">ไม่พบหน้านี้</div>
        <div className="text-sm text-zinc-300">ลิงก์อาจผิด หรือหน้าถูกย้ายไปแล้ว</div>
      </div>
      <div className="mt-4">
        <Link href="/">
          <Button>กลับหน้าแรก</Button>
        </Link>
      </div>
    </Card>
  );
}

