import Link from "next/link";

/** ข้อความสั้นๆ ชวนสนับสนุน — ใช้ใน Dashboard / โปรไฟล์ (ไม่ใช้ในหน้าสมัคร) */
export function SupportBlurb({ className }: { className?: string }) {
  return (
    <p className={className ?? "text-sm leading-relaxed text-zinc-600"}>
      ใช้งาน TrackerZ ฟรีเต็มรูปแบบ — อยากสนับสนุนสำนักได้ที่หน้า{" "}
      <Link
        href="/support"
        className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
      >
        สนับสนุนสำนัก
      </Link>
    </p>
  );
}
