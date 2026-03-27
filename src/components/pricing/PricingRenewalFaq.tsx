import * as React from "react";

const items: { q: string; a: string }[] = [
  {
    q: "Pro ต่ออัตโนมัติอย่างไร?",
    a: "หลังชำระครั้งแรก ระบบจะบันทึกวิธีชำระไว้และต่ออายุตามรอบบิล (รายเดือนหรือรายปี) โดยไม่ต้องกดใหม่ทุกครั้ง คุณยกเลิกได้ก่อนวันต่ออายุครั้งถัดไป"
  },
  {
    q: "ยกเลิกสมาชิกได้เมื่อไหร่?",
    a: "ยกเลิกได้ทุกเมื่อจากหน้าบัญชีหรือช่องทางที่ระบุในอีเมลยืนยัน สิทธิ์ Pro ใช้ได้จนครบรอบที่ชำระแล้ว"
  },
  {
    q: "เปลี่ยนจากรายเดือนเป็นรายปีได้ไหม?",
    a: "ได้ — ติดต่อซัพพอร์ตหรือใช้เมนูแพ็กเกจในแอป เพื่อสลับแพ็ก โดยส่วนต่างหรือวันเหลือจะคิดตามนโยบายของผู้ให้บริการชำระเงิน"
  }
];

export function PricingRenewalFaq() {
  return (
    <section className="rounded-[1.75rem] border border-zinc-200/70 bg-white/70 p-5 sm:p-7">
      <h2 className="text-lg font-semibold text-zinc-900">คำถามเรื่องการต่ออายุ</h2>
      <p className="mt-1 text-sm text-zinc-600">ข้อมูลด้านการสมัครและต่ออายุอัตโนมัติ</p>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li
            key={item.q}
            className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-4"
          >
            <div className="text-sm font-medium text-zinc-900">{item.q}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.a}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
