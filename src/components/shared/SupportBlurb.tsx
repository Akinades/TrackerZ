import Link from "next/link";
import { useI18n } from "@/components/shared/I18nProvider";

/** ข้อความสั้นๆ ชวนสนับสนุน — ใช้ใน Dashboard / โปรไฟล์ (ไม่ใช้ในหน้าสมัคร) */
export function SupportBlurb({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p className={className ?? "text-sm leading-relaxed text-zinc-600"}>
      {t("support.supportBlurbPrefix")}{" "}
      <Link
        href="/support"
        className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
      >
        {t("authMenu.support")}
      </Link>
    </p>
  );
}
