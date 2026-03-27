"use client";

import { Card } from "@/components/ui/Card";
import { useTransactionsPage } from "@/hooks/useTransactionsPage";
import { TransactionsGuestPrompt } from "@/components/transactions/TransactionsGuestPrompt";
import { TransactionsFiltersCard } from "@/components/transactions/TransactionsFiltersCard";
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import { TransactionConfirmModal } from "@/components/transactions/TransactionConfirmModal";
import { TransactionsListCard } from "@/components/transactions/TransactionsListCard";

export default function TransactionsPage() {
  const m = useTransactionsPage();

  if (m.authHydrated && !m.user) {
    return <TransactionsGuestPrompt />;
  }

  return (
    <div className="fhd-text-tune grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">บันทึกรายการซื้อ/ขาย</h1>
          <p className="text-sm text-zinc-600">เพิ่ม/แก้ไขรายการซื้อขายของคุณ</p>
        </div>
      </div>

      <TransactionsFiltersCard m={m} />

      {m.importError ? (
        <Card className="p-4">
          <div className="text-sm text-rose-700">{m.importError}</div>
        </Card>
      ) : null}

      <TransactionFormModal m={m} />
      <TransactionConfirmModal m={m} />
      <TransactionsListCard m={m} />
    </div>
  );
}
