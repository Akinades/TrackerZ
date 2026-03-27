"use client";

import * as React from "react";
import type { UserPlan } from "@/lib/authStorage";

export type PlanOption = {
  id: UserPlan;
  name: string;
  price: string;
  billingCycle: string;
  description: string;
  highlights: string[];
  badge?: string;
};

export const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "free",
    name: "Free (ผู้ฝึกตน)",
    price: "0 บาท",
    billingCycle: "จดรายการจำกัด 20 รายการ/เดือน",
    description: "เริ่มวัดผลพอร์ตได้ทันที ไม่ต้องจ่าย",
    highlights: [
      "Dashboard และบันทึกธุรกรรม",
      "เหมาะกับผู้เริ่มต้นและทดลองระบบ"
    ],
    badge: "เริ่มต้น"
  },
  {
    id: "monthly",
    name: "Pro Monthly (จอมยุทธ์)",
    price: "฿39 เดือนแรก → ฿79/เดือน",
    billingCycle: "ชำระรายเดือน · โปรเปิดสำนัก",
    description: "ฟีเจอร์ Pro ครบ ยืดหยุ่นเรื่องการจ่าย",
    highlights: [
      "Import CSV และเครื่องมือวิเคราะห์เต็มรูปแบบ",
      "รายงานเชิงลึก เป้าหมายสัดส่วน และอื่นๆ ตามแพ็ก Pro",
      "ส่งออกข้อมูลและมุมมองพอร์ตขั้นสูง"
    ],
    badge: "โปรเปิดสำนัก"
  },
  {
    id: "yearly",
    name: "Pro Yearly (มหาเซียน)",
    price: "฿790/ปี",
    billingCycle: "ชำระรายปี · ประหยัด 2 เดือน",
    description: "ฟีเจอร์เดียวกับรายเดือน แต่คุ้มที่สุดเมื่อใช้ยาว",
    highlights: [
      "Import CSV และเครื่องมือวิเคราะห์เต็มรูปแบบ",
      "รายงานเชิงลึก เป้าหมายสัดส่วน และอื่นๆ ตามแพ็ก Pro",
      "ส่งออกข้อมูลและมุมมองพอร์ตขั้นสูง"
    ],
    badge: "คุ้มสุด"
  }
];

export function getPlanOption(planId: UserPlan): PlanOption {
  return PLAN_OPTIONS.find((plan) => plan.id === planId) ?? PLAN_OPTIONS[0];
}

type Props = {
  selectedPlan: UserPlan;
  onSelect: (plan: UserPlan) => void;
  className?: string;
};

export function PlanSelectorCards({ selectedPlan, onSelect, className }: Props) {
  return (
    <div className={className ?? "grid gap-3 sm:gap-4 lg:grid-cols-3 lg:items-stretch"}>
      {PLAN_OPTIONS.map((plan) => {
        const isSelected = plan.id === selectedPlan;
        return (
          <button
            type="button"
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={
              isSelected
                ? "flex h-full min-h-0 flex-col rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 text-left shadow-sm transition sm:rounded-3xl sm:p-5"
                : "flex h-full min-h-0 flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50/60 sm:rounded-3xl sm:p-5"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-left text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
                  {plan.name}
                </div>
                <div className="mt-2 text-sm font-semibold leading-snug text-zinc-800 sm:text-base">
                  {plan.price}
                </div>
                <div className="mt-1 text-xs font-medium leading-normal text-zinc-500 sm:text-sm">
                  {plan.billingCycle}
                </div>
              </div>
              {plan.badge ? (
                <span className="max-w-[46%] shrink-0 rounded-full border border-zinc-200/90 bg-white px-2 py-1 text-center text-[11px] font-medium leading-tight text-zinc-600 sm:max-w-none sm:px-2.5 sm:text-xs">
                  {plan.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{plan.description}</p>
            <ul className="mt-3 flex flex-1 flex-col gap-2 border-t border-zinc-200/60 pt-3 text-left text-sm leading-relaxed text-zinc-700">
              {plan.highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/80" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
