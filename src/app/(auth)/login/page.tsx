"use client";

import { Suspense } from "react";
import { LoginClient } from "./LoginClient";
import { useI18n } from "@/components/shared/I18nProvider";

export default function LoginPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="text-sm text-zinc-600">{t("common.loading")}</div>}>
      <LoginClient />
    </Suspense>
  );
}

