import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-full w-full max-w-6xl place-items-center py-4">
      <div className="grid w-full gap-6">
        <div className="grid gap-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-zinc-900 bg-clip-text text-sm font-semibold tracking-tight text-transparent">
              TrackerZ
            </div>
            <div className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              MVP
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            ติดตามพอร์ตแบบง่ายๆ สวยๆ บนเว็บ
          </div>
          <div className="text-sm text-zinc-600">
            บันทึกรายการซื้อ/ขาย → ดูพอร์ตภาพรวม → เห็นกำไร/ขาดทุน + กราฟสัดส่วน
          </div>
          <div className="text-sm">
            <Link
              href="/"
              className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
            >
              กลับหน้าแรก
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </div>
    </div>
  );
}
