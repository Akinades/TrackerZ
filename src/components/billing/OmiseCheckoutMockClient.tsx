"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PRICING_COPY } from "@/lib/pricingPlans";

type PaymentMethod = "card" | "promptpay" | "qr";

function amountLabel(plan: string | null): { title: string; amount: string; detail: string } {
  if (plan === "yearly") {
    return {
      title: "Pro Yearly (มหาเซียน)",
      amount: `${PRICING_COPY.yearly.price}`,
      detail: `${PRICING_COPY.yearly.unit} · ${PRICING_COPY.yearly.savings}`
    };
  }
  return {
    title: "Pro Monthly (จอมยุทธ์)",
    amount: `${PRICING_COPY.monthly.promoPrice}`,
    detail: `เดือนแรก (โปร) · ต่อด้วย ${PRICING_COPY.monthly.regularPrice} ${PRICING_COPY.monthly.unitNext}`
  };
}

/** QR จำลอง (ไม่ใช่ payload จริง) — แสดงเป็น placeholder */
function MockQrSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="120" fill="#fff" />
      <rect x="8" y="8" width="32" height="32" fill="#0f172a" />
      <rect x="12" y="12" width="24" height="24" fill="#fff" />
      <rect x="16" y="16" width="16" height="16" fill="#0f172a" />
      <rect x="80" y="8" width="32" height="32" fill="#0f172a" />
      <rect x="84" y="12" width="24" height="24" fill="#fff" />
      <rect x="88" y="16" width="16" height="16" fill="#0f172a" />
      <rect x="8" y="80" width="32" height="32" fill="#0f172a" />
      <rect x="12" y="84" width="24" height="24" fill="#fff" />
      <rect x="16" y="88" width="16" height="16" fill="#0f172a" />
      {[
        [48, 8],
        [56, 8],
        [64, 8],
        [48, 16],
        [64, 16],
        [56, 24],
        [48, 48],
        [72, 48],
        [56, 56],
        [80, 48],
        [48, 72],
        [64, 72],
        [80, 64],
        [88, 72],
        [72, 88],
        [88, 88],
        [96, 96]
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="8" height="8" fill="#0f172a" />
      ))}
    </svg>
  );
}

const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "card", label: "บัตร", hint: "Credit / Debit" },
  { id: "promptpay", label: "PromptPay", hint: "เบอร์โทร / พร้อมเพย์" },
  { id: "qr", label: "สแกน QR", hint: "พร้อมเพย์ QR" }
];

export function OmiseCheckoutMockClient() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan");
  const [method, setMethod] = React.useState<PaymentMethod>("card");

  const validPlan = plan === "monthly" || plan === "yearly";
  const { title, amount, detail } = amountLabel(validPlan ? plan : "monthly");

  const complete = () => {
    window.location.assign("/register/complete");
  };

  const cancel = () => {
    router.replace("/register");
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-[0_24px_60px_-40px_rgba(67,56,202,0.45)]">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-indigo-100">Omise Checkout</div>
              <div className="text-lg font-semibold">ชำระเงินผ่าน Omise</div>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase text-white">
              Mock
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-indigo-100">
            หน้านี้เป็นจำลอง UI เท่านั้น ยังไม่เชื่อม Omise API จริง
          </p>
        </div>

        <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
          <div className="text-xs font-medium text-zinc-500">ร้านค้า</div>
          <div className="text-base font-semibold text-zinc-900">TrackerZ</div>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <div className="text-xs text-zinc-500">แพ็กเกจ</div>
            <div className="font-medium text-zinc-900">{title}</div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-zinc-100 pt-3">
              <span className="text-2xl font-semibold text-zinc-900">{amount}</span>
              <span className="text-sm text-zinc-600">{detail}</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-medium text-zinc-700">เลือกช่องทางชำระเงิน</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={
                    method === m.id
                      ? "rounded-xl border-2 border-indigo-500 bg-indigo-50 px-2 py-2.5 text-center transition"
                      : "rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-center transition hover:border-zinc-300"
                  }
                >
                  <div className="text-xs font-semibold text-zinc-900">{m.label}</div>
                  <div className="mt-0.5 text-[10px] leading-tight text-zinc-500">{m.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
            {method === "card" ? (
              <div className="grid gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600">หมายเลขบัตร (จำลอง)</label>
                  <input
                    readOnly
                    value="4242 4242 4242 4242"
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-600">วันหมดอายุ</label>
                    <input
                      readOnly
                      value="12/30"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">CVV</label>
                    <input
                      readOnly
                      value="123"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {method === "promptpay" ? (
              <div className="grid gap-3">
                <p className="text-sm text-zinc-600">
                  Omise รองรับ <span className="font-medium text-zinc-800">PromptPay</span>{" "}
                  (source: promptpay) — กรอกเบอร์ที่ผูกพร้อมเพย์ หรือใช้เบอร์ทดสอบด้านล่าง
                </p>
                <div>
                  <label className="text-xs font-medium text-zinc-600">เบอร์พร้อมเพย์ (จำลอง)</label>
                  <input
                    readOnly
                    value="081 234 5678"
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800"
                  />
                </div>
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
                  โปรดักชัน: สร้าง charge ด้วย <code className="rounded bg-white/80 px-1">source[type]=promptpay</code>{" "}
                  แล้วให้ลูกค้ายืนยันในแอปธนาคาร
                </div>
              </div>
            ) : null}

            {method === "qr" ? (
              <div className="grid gap-4 text-center">
                <p className="text-sm text-zinc-600">
                  สแกน <span className="font-medium text-zinc-800">พร้อมเพย์ QR</span> ด้วยแอปธนาคาร (จำลอง)
                </p>
                <div className="mx-auto flex w-44 flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <MockQrSvg className="h-36 w-36" />
                  <span className="text-[10px] text-zinc-500">QR นี้เป็น placeholder — ไม่ใช่ payload จริง</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Omise ใช้ QR ผ่าน PromptPay / source type ที่รองรับ — ผูก backend แล้วค่อยแสดง QR จาก API
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-2 sm:flex sm:flex-row-reverse sm:justify-end">
            <Button
              type="button"
              className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto sm:min-w-[160px]"
              onClick={complete}
            >
              ชำระเงิน (จำลอง)
            </Button>
            <Button type="button" variant="secondary" className="h-11 w-full sm:w-auto" onClick={cancel}>
              ยกเลิก
            </Button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">
            การชำระเงินจริง: บัตร / PromptPay / QR ทำผ่าน Omise.js + Charge API บนเซิร์ฟเวอร์ — ติดต่อทีมเพื่อผูกคีย์และ webhook
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/register"
          className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
        >
          กลับไปแก้ข้อมูลสมัคร
        </Link>
      </div>
    </div>
  );
}
