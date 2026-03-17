"use client";

import * as React from "react";
import type { Transaction } from "@/types/transactions";
import { loadTransactions, saveTransactions } from "@/lib/storage";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useTransactions() {
  const [txs, setTxs] = React.useState<Transaction[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setTxs(loadTransactions());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    saveTransactions(txs);
  }, [txs, hydrated]);

  const add = React.useCallback((tx: Omit<Transaction, "id" | "createdAt">) => {
    const next: Transaction = { ...tx, id: uid(), createdAt: new Date().toISOString() };
    setTxs((prev) => [next, ...prev]);
  }, []);

  const remove = React.useCallback((id: string) => {
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = React.useCallback((id: string, patch: Partial<Omit<Transaction, "id">>) => {
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  return { txs, hydrated, add, remove, update };
}

