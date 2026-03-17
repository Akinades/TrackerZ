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
                <div className="max-w-xl rounded-3xl border border-emerald-200/70 bg-white/80 p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.25)] backdrop-blur">
                  <div className="flex items-center gap-3 justify-center">
                    
                    <div className="min-w-0">
                      <div className="text-md font-semibold italic text-zinc-900">
                        “If you can't measure it, you can't improve it.”
                      </div>
                      <div className="mt-1 text-sm text-zinc-700">
                        ถ้าคุณวัดผลไม่ได้ คุณก็พัฒนาการเทรดไม่ได้
                      </div>
                    </div>
                  </div>
                </div>
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
          <div className="grid gap-4">
            <div className="relative h-28 w-full sm:h-32">
              <Image src="/landing/reports.png" alt="" fill className="object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">บันทึกรายการ</div>
              <div className="mt-2 text-sm text-zinc-600">
                ซื้อ/ขาย, ราคา, จำนวน, ค่าธรรมเนียม พร้อมเวลา และกรองตามช่วงวันที่ได้
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid gap-4">
            <div className="relative h-28 w-full sm:h-32">
              <Image src="/landing/investing.png" alt="" fill className="object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">ต้นทุนเฉลี่ย</div>
              <div className="mt-2 text-sm text-zinc-600">
                Average Cost แยกตามสินทรัพย์ คิด realized/unrealized แบบเข้าใจง่าย
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid gap-4">
            <div className="relative h-28 w-full sm:h-32">
              <Image src="/landing/realtime.png" alt="" fill className="object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">กราฟสรุปทันที</div>
              <div className="mt-2 text-sm text-zinc-600">
                Pie สัดส่วนพอร์ต และ Bar กำไร/ขาดทุนรายสินทรัพย์ ดูง่ายบนมือถือ
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* WHY TrackerZ */}
      <section className="grid gap-4">
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold">ทำไมต้องใช้ TrackerZ?</div>
              <div className="mt-1 text-sm text-zinc-600">
                เพราะ “การเทรดที่ดี” ต้องวัดผลได้ และรู้ว่าควรปรับตรงไหน
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              Measure → Improve
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">เห็นภาพรวมไว</div>
              <div className="mt-2 text-sm text-zinc-600">
                มูลค่าพอร์ต, ROI, กำไร/ขาดทุน แสดงแบบอ่านง่ายในหน้า Dashboard
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">รู้ต้นทุนจริง</div>
              <div className="mt-2 text-sm text-zinc-600">
                คำนวณ Average Cost พร้อมรวมค่าธรรมเนียม ช่วยตัดสินใจได้แม่นขึ้น
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">ปรับปรุงได้ต่อเนื่อง</div>
              <div className="mt-2 text-sm text-zinc-600">
                บันทึกให้ครบ → วัดผลให้ชัด → รู้ว่าควรปรับแผนตรงไหน
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">ข้อมูลอยู่กับคุณ</div>
              <div className="mt-2 text-sm text-zinc-600">
                เก็บข้อมูลในเครื่อง (localStorage) เริ่มใช้งานได้ทันที ไม่ต้องตั้งค่าอะไรเยอะ
              </div>
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
            <div className="relative mx-auto mt-3 h-40 w-full max-w-md sm:h-44">
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
            <div className="relative mx-auto mt-3 h-40 w-full max-w-md sm:h-44">
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

    </div>
  );
}
