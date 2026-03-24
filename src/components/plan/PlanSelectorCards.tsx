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
    name: "Free",
    price: "ฟรี",
    billingCycle: "ไม่จำกัดเวลา",
    description: "เหมาะสำหรับเริ่มต้น ใช้ติดตามพอร์ตแบบพื้นฐาน",
    highlights: [
      "ใช้งานได้เฉพาะ Dashboard และบันทึกธุรกรรม",
      "ไม่รองรับ Export/Import ข้อมูล",
      "จำกัดการบันทึก 10 รายการ/วัน"
    ],
    badge: "เริ่มต้น"
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "฿79/เดือน",
    billingCycle: "ชำระรายเดือน",
    description: "ฟีเจอร์โปรครบ เหมาะกับคนที่อยากจ่ายยืดหยุ่น",
    highlights: [
      "รายงานพอร์ตเชิงลึกมากขึ้น",
      "ส่งออกข้อมูลย้อนหลัง",
      "จัดการหลายพอร์ตและสิทธิ์ฟีเจอร์วิเคราะห์ขั้นสูง"
    ],
    badge: "ฟีเจอร์โปร"
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "฿790/ปี",
    billingCycle: "ชำระรายปี (คุ้มกว่า)",
    description: "ฟีเจอร์โปรเหมือนรายเดือน แต่ประหยัดกว่าเมื่อใช้งานยาว",
    highlights: [
      "รายงานพอร์ตเชิงลึกมากขึ้น",
      "ส่งออกข้อมูลย้อนหลัง",
      "จัดการหลายพอร์ตและสิทธิ์ฟีเจอร์วิเคราะห์ขั้นสูง"
    ],
    badge: "ฟีเจอร์โปร"
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
    <div className={className ?? "grid gap-4 lg:grid-cols-3"}>
      {PLAN_OPTIONS.map((plan) => {
        const isSelected = plan.id === selectedPlan;
        return (
          <button
            type="button"
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={
              isSelected
                ? "rounded-3xl border border-emerald-300 bg-emerald-50/60 p-6 text-left shadow-sm transition"
                : "rounded-3xl border border-zinc-200/70 bg-white p-6 text-left transition hover:border-zinc-300 hover:bg-zinc-50/60"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-3xl font-semibold text-zinc-900">{plan.name}</div>
                <div className="mt-2 text-2xl font-medium text-zinc-700">{plan.price}</div>
                <div className="text-lg text-zinc-500">{plan.billingCycle}</div>
              </div>
              {plan.badge ? (
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600">
                  {plan.badge}
                </span>
              ) : null}
            </div>
            <div className="mt-3 text-base text-zinc-600">{plan.description}</div>
            <ul className="mt-4 grid gap-2 text-base text-zinc-700">
              {plan.highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
