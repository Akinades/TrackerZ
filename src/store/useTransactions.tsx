"use client";

import * as React from "react";
import type { Transaction } from "@/types/transactions";

function parseNotes(notes: unknown): { fee?: number; assetType?: Transaction["assetType"] } | null {
  if (typeof notes !== "string" || !notes.trim()) return null;
  try {
    const obj = JSON.parse(notes) as any;
    const fee = obj?.fee;
    const assetType = obj?.assetType;
    return {
      fee: typeof fee === "number" ? fee : fee != null ? Number(fee) : undefined,
      assetType: assetType as any
    };
  } catch {
    return null;
  }
}

function mapTx(raw: any): Transaction | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? raw._id ?? "");

  // Backend shape support:
  const side = (raw.side ?? raw.type) as Transaction["side"];
  const assetName = String(raw.assetName ?? raw.asset_symbol ?? "");
  const assetLabel = raw.assetLabel ?? raw.asset_name;
  const amount = Number(raw.amount ?? raw.quantity);
  const price = Number(raw.price ?? raw.price_per_unit);
  const createdAt = String(raw.createdAt ?? raw.created_at ?? new Date().toISOString());
  const currencyRaw = raw.currency;
  const currency =
    currencyRaw === "THB" || currencyRaw === "USD" ? (currencyRaw as Transaction["currency"]) : undefined;

  const notesMeta = parseNotes(raw.notes);
  const assetType = (raw.assetType ?? notesMeta?.assetType ?? "other") as Transaction["assetType"];
  const fee = Number(raw.fee ?? notesMeta?.fee ?? 0);
  const assetLabelStr = assetLabel != null && String(assetLabel).trim() ? String(assetLabel) : undefined;

  if (!id || !assetName) return null;
  if (!Number.isFinite(price) || !Number.isFinite(amount) || !Number.isFinite(fee)) return null;
  return { id, assetName, assetType, side, price, amount, fee, createdAt, assetLabel: assetLabelStr, currency };
}

async function readJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function useTransactions() {
  const [txs, setTxs] = React.useState<Transaction[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      const res = await fetch("/api/transactions", { method: "GET" }).catch(() => null);
      const json = res ? await readJsonSafe(res) : null;
      if (!mounted) return;
      if (!res || !res.ok) {
        setError((json as any)?.message || (json as any)?.error || "โหลดรายการไม่สำเร็จ");
        setHydrated(true);
        return;
      }

      const list = (json as any)?.transactions ?? json;
      const mapped = Array.isArray(list) ? (list.map(mapTx).filter(Boolean) as Transaction[]) : [];
      setTxs(mapped);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/transactions", { method: "GET" }).catch(() => null);
    const json = res ? await readJsonSafe(res) : null;
    if (!res || !res.ok) {
      setError((json as any)?.message || (json as any)?.error || "โหลดรายการไม่สำเร็จ");
      return;
    }
    const list = (json as any)?.transactions ?? json;
    const mapped = Array.isArray(list) ? (list.map(mapTx).filter(Boolean) as Transaction[]) : [];
    setTxs(mapped);
  }, []);

  const add = React.useCallback(
    async (tx: Omit<Transaction, "id" | "createdAt">) => {
    setError(null);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx)
    }).catch(() => null);
    const json = res ? await readJsonSafe(res) : null;
    if (!res || !res.ok) {
      setError((json as any)?.message || (json as any)?.error || "เพิ่มรายการไม่สำเร็จ");
      return;
    }
    const created = mapTx((json as any)?.transaction ?? json);
    if (created) setTxs((prev) => [created, ...prev]);
    else await refresh();
    },
    [refresh]
  );

  const remove = React.useCallback(
    async (id: string) => {
      setError(null);
      const prev = txs;
      setTxs((p) => p.filter((t) => t.id !== id));
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(
        () => null
      );
      if (!res || !res.ok) {
        setError("ลบรายการไม่สำเร็จ");
        setTxs(prev);
      }
    },
    [txs]
  );

  const update = React.useCallback(
    async (id: string, patch: Partial<Omit<Transaction, "id">>) => {
      setError(null);
      const prev = txs;
      setTxs((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      }).catch(() => null);
      const json = res ? await readJsonSafe(res) : null;
      if (!res || !res.ok) {
        setError((json as any)?.message || (json as any)?.error || "แก้ไขรายการไม่สำเร็จ");
        setTxs(prev);
        return;
      }
      const updated = mapTx((json as any)?.transaction ?? json);
      if (updated) setTxs((p) => p.map((t) => (t.id === id ? updated : t)));
    },
    [txs]
  );

  return { txs, hydrated, error, refresh, add, remove, update };
}

