"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useTransactionsPage } from "@/hooks/useTransactionsPage";
import { TransactionsFiltersCard } from "@/components/transactions/TransactionsFiltersCard";
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import { TransactionConfirmModal } from "@/components/transactions/TransactionConfirmModal";
import { TransactionsListCard } from "@/components/transactions/TransactionsListCard";
import { useI18n } from "@/components/shared/I18nProvider";

export default function TransactionsPage() {
  const router = useRouter();
  const m = useTransactionsPage();
  const { t } = useI18n();

  React.useEffect(() => {
    if (!m.authHydrated) return;
    if (!m.user) router.replace("/");
  }, [m.authHydrated, m.user, router]);

  if (m.authHydrated && !m.user) {
    return null;
  }

  return (
    <div className="fhd-text-tune grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">{t("transactions.title")}</h1>
          <p className="text-sm text-zinc-600">{t("transactions.subtitle")}</p>
        </div>
      </div>

      <TransactionsFiltersCard m={m} />

      {m.importError ? (
        <Card className="p-4">
          <div className="text-sm text-rose-700">{m.importError}</div>
        </Card>
      ) : null}

      {m.importSummary ? (
        <Card
          className={
            m.importSummaryKind === "warning"
              ? "border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/40"
              : "border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40"
          }
        >
          <div
            className={
              m.importSummaryKind === "warning"
                ? "text-sm text-amber-950 dark:text-amber-100"
                : "text-sm text-emerald-950 dark:text-emerald-100"
            }
          >
            {m.importSummary}
          </div>
        </Card>
      ) : null}

      <TransactionFormModal m={m} />
      <TransactionConfirmModal m={m} />
      <TransactionsListCard m={m} />
    </div>
  );
}
