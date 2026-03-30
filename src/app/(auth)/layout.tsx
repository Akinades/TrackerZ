"use client";

import Link from "next/link";
import { useI18n } from "@/components/shared/I18nProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
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
            {t("authLayout.headline")}
          </div>
          <div className="text-sm text-zinc-600">
            {t("authLayout.subhead")}
          </div>
          <div className="text-sm">
            <Link
              href="/"
              className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
            >
              {t("authLayout.backHomeLink")}
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </div>
    </div>
  );
}
