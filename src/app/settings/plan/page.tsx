"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { useI18n } from "@/components/shared/I18nProvider";

export default function PlanSettingsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { t } = useI18n();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <Card className="p-6">{t("common.loading")}</Card>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold">{t("plan.supportTitle")}</div>
        <div className="text-sm text-zinc-600">
          {t("plan.supportDesc")}
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-zinc-700">
          {t("plan.supportBody")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/support">
            <Button>{t("plan.goSupport")}</Button>
          </Link>
          <Link href="/settings">
            <Button variant="secondary">{t("plan.backSettings")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
