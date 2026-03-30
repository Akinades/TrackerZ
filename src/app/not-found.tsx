"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/shared/I18nProvider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Card>
      <div className="grid gap-2">
        <div className="text-lg font-semibold">{t("notFound.title")}</div>
        <div className="text-sm text-zinc-300">{t("notFound.subtitle")}</div>
      </div>
      <div className="mt-4">
        <Link href="/">
          <Button>{t("common.backHome")}</Button>
        </Link>
      </div>
    </Card>
  );
}

