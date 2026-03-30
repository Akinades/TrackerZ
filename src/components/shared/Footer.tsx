"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { feedbackMailtoHref } from "@/lib/siteContact";
import { useI18n } from "@/components/shared/I18nProvider";

export function Footer() {
  const { t } = useI18n();
  const feedbackHref = feedbackMailtoHref(t("feedback.subject"));
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/support"
  ) {
    return null;
  }

  return (
    <footer className="flex flex-col items-center gap-2 py-8 text-center text-sm text-zinc-500">
      {/* <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/support" className="text-emerald-700 hover:underline">
          สนับสนุนสำนัก
        </Link>
        {feedbackHref ? (
          <>
            <span className="text-zinc-300" aria-hidden>
              ·
            </span>
            <a href={feedbackHref} className="text-emerald-700 hover:underline">
              แจ้งปัญหา / ข้อเสนอแนะ
            </a>
          </>
        ) : null}
      </div> */}
      <div>{t("footer.copyright")}</div>
    </footer>
  );
}

