import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="grid gap-12 py-2">
      {/* HERO (full-bleed background) */}
      <section className="-mx-4 overflow-hidden rounded-[2.5rem] border border-zinc-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-[0_30px_90px_-70px_rgba(0,0,0,0.45)]">
        <div className="relative px-4 py-10 sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-100/80 blur-3xl"
          />

          <div className="relative grid gap-10 sm:grid-cols-2 sm:items-center">
            <div className="grid gap-5">
              <div className="grid gap-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-zinc-900 bg-clip-text text-transparent">
                    TrackerZ
                  </span>
                  <br />
                  จดไว้ให้ครบ
                  <br />
                  แล้วดูพอร์ตให้สวย
                </h1>
                <p className="max-w-xl text-base text-zinc-600">
                  บันทึกรายการซื้อ/ขาย → ใส่ราคาปัจจุบัน →
                  เห็นสัดส่วนพอร์ตและกำไร/ขาดทุนแบบเข้าใจง่าย
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="h-11 w-full px-6 text-base shadow-[0_16px_30px_-18px_rgba(0,0,0,0.45)] sm:w-auto">
                    เริ่มต้นใช้งาน (ฟรี)
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" className="h-11 w-full px-6 text-base sm:w-auto">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Responsive
                </span>
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Average Cost
                </span>
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  Pie + P/L Bar
                </span>
                <span className="rounded-full border border-zinc-200/70 bg-white px-3 py-1">
                  localStorage (MVP)
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
                <Image
                  src="/landing/personal-finance.png"
                  alt="Mobile analytics illustration"
                  fill
                  className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
                  priority
                />
              </div>
              <div className="mt-4 text-center text-xs text-zinc-500">
                MVP: ข้อมูลถูกเก็บในเครื่องของคุณ (localStorage)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">บันทึกรายการ</div>
              <div className="mt-2 text-sm text-zinc-600">
                ซื้อ/ขาย, ราคา, จำนวน, ค่าธรรมเนียม พร้อมเวลา
                และกรองตามช่วงวันที่ได้
              </div>
            </div>
            <div className="relative h-20 w-20 shrink-0">
              <Image
                src="/landing/reports.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">ต้นทุนเฉลี่ย</div>
              <div className="mt-2 text-sm text-zinc-600">
                Average Cost แยกตามสินทรัพย์ คิด realized/unrealized
                แบบเข้าใจง่าย
              </div>
            </div>
            <div className="relative h-20 w-20 shrink-0">
              <Image
                src="/landing/investing.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">กราฟสรุปทันที</div>
              <div className="mt-2 text-sm text-zinc-600">
                Pie สัดส่วนพอร์ต และ Bar กำไร/ขาดทุนรายสินทรัพย์ ดูง่ายบนมือถือ
              </div>
            </div>
            <div className="relative h-20 w-20 shrink-0">
              <Image
                src="/landing/realtime.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="text-sm font-semibold">ทำงานยังไง?</div>
          <div className="mt-2 grid gap-3 text-sm text-zinc-600">
            <div>
              <span className="font-medium text-zinc-900">1)</span>{" "}
              เพิ่มรายการซื้อ/ขายในหน้า “บันทึกรายการ”
            </div>
            <div>
              <span className="font-medium text-zinc-900">2)</span>{" "}
              ใส่ราคาปัจจุบันใน Dashboard
            </div>
            <div>
              <span className="font-medium text-zinc-900">3)</span>{" "}
              ดูสัดส่วนพอร์ต + กำไร/ขาดทุนแบบกราฟ
            </div>
            <div className="relative mx-auto mt-2 aspect-[4/3] w-1/2 max-w-md">
              <Image
                src="/landing/dashboard.png"
                alt=""
                fill
                className="object-contain opacity-95"
              />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-emerald-50" />
          <div className="relative grid gap-3">
            <div className="text-sm font-semibold">ใช้งานสะดวกทุกอุปกรณ์</div>
            <div className="text-sm text-zinc-600">
              ใช้ได้ลื่นทั้งคอม/แล็ปท็อป/มือถือ — บนหน้าจอใหญ่ดูภาพรวมได้ครบ
              ทั้งกราฟสัดส่วนพอร์ต, P/L และตารางรายการแบบอ่านง่าย ขณะที่บนมือถือ
              ปุ่ม/ฟอร์มถูกจัดให้กดและกรอกสะดวก เลื่อนดูไว และเพิ่ม/แก้รายการผ่าน
              Modal ได้ทันที เหมาะกับการเช็คพอร์ตระหว่างวัน
            </div>
            <div className="relative mx-auto mt-2 aspect-[4/3] w-1/2 items-end justify-end max-w-xs sm:max-w-sm">
              <Image
                src="/landing/mobile.png"
                alt=""
                fill
                className="object-contain opacity-95"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* FINAL NOTE */}
      <section className="pb-6 text-center text-xs text-zinc-500">
        TrackerZ MVP • ข้อมูลเก็บในเครื่อง (localStorage)
      </section>
    </div>
  );
}
