"use client";

import { Suspense } from "react";
import { RegisterClient } from "./RegisterClient";
import { useI18n } from "@/components/shared/I18nProvider";

export default function RegisterPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="text-sm text-zinc-600">{t("common.loading")}</div>}>
      <RegisterClient />
    </Suspense>
  );
}

