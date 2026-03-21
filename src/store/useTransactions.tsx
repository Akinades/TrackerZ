"use client";

import * as React from "react";
import type { ImportTransactionPayload } from "@/lib/transactionImport";
import type { Transaction } from "@/types/transactions";
import { findAssetCatalogItem } from "@/lib/assetsCatalog";
import { notify } from "@/lib/notify";

function parseNotes(notes: unknown): {
  fee?: number;
  tax?: number;
  assetType?: Transaction["assetType"];
  fxRateAtTrade?: number;
} | null {
  if (typeof notes !== "string" || !notes.trim()) return null;
  try {
    const obj = JSON.parse(notes) as any;
    const fee = obj?.fee;
    const tax = obj?.tax;
    const assetType = obj?.assetType;
    const fxRateAtTrade = obj?.fxRateAtTrade;
    return {
      fee: typeof fee === "number" ? fee : fee != null ? Number(fee) : undefined,
      tax: typeof tax === "number" ? tax : tax != null ? Number(tax) : undefined,
      assetType: assetType as any,
      fxRateAtTrade:
        typeof fxRateAtTrade === "number"
          ? fxRateAtTrade
          : fxRateAtTrade != null
            ? Number(fxRateAtTrade)
            : undefined
    };
  } catch {
    return null;
  }
}

export function mapTx(raw: any): Transaction | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? raw._id ?? "");

  // Backend shape support:
  const side = (raw.side ?? raw.type) as Transaction["side"];
  const assetName = String(raw.assetName ?? raw.asset_symbol ?? "");
  const assetLabel = raw.assetLabel ?? raw.asset_name;
  const amount = Number(raw.amount ?? raw.quantity);
  const price = Number(raw.price ?? raw.price_per_unit);
  const tradedAtRaw = raw.traded_at ?? raw.tradedAt;
  const tradedAt =
    typeof tradedAtRaw === "string" && tradedAtRaw.trim() ? String(tradedAtRaw).trim() : undefined;
  const createdAt = String(
    raw.createdAt ?? raw.created_at ?? tradedAt ?? new Date().toISOString()
  );
  const currencyRaw = raw.currency;
  const currency =
    currencyRaw === "THB" || currencyRaw === "USD" ? (currencyRaw as Transaction["currency"]) : undefined;

  const notesMeta = parseNotes(raw.notes);
  const catalog = assetName ? findAssetCatalogItem(assetName) : null;
  const assetTypeRaw = raw.assetType ?? notesMeta?.assetType ?? catalog?.type ?? "other";
  const assetType = assetTypeRaw as Transaction["assetType"];
  const fee = Number(raw.fee ?? notesMeta?.fee ?? 0);
  const tax = Number(raw.tax ?? notesMeta?.tax ?? 0);
  const fxRateAtTrade = notesMeta?.fxRateAtTrade;
  const assetLabelStr = assetLabel != null && String(assetLabel).trim() ? String(assetLabel) : undefined;

  if (!id || !assetName) return null;
  if (
    !Number.isFinite(price) ||
    !Number.isFinite(amount) ||
    !Number.isFinite(fee) ||
    !Number.isFinite(tax)
  )
    return null;
  return {
    id,
    assetName,
    assetType,
    side,
    price,
    amount,
    fee,
    tax,
    currency,
    fxRateAtTrade,
    tradedAt,
    createdAt,
    assetLabel: assetLabelStr
  };
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

  type CreatePayload = Omit<Transaction, "id" | "createdAt"> & { createdAt?: string };

  const add = React.useCallback(
    async (tx: CreatePayload) => {
    setError(null);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx)
    }).catch(() => null);
    const json = res ? await readJsonSafe(res) : null;
    if (!res || !res.ok) {
      const msg = (json as any)?.message || (json as any)?.error || "เพิ่มรายการไม่สำเร็จ";
      setError(msg);
      notify.error(msg, "เพิ่มรายการไม่สำเร็จ");
      return;
    }
    const created = mapTx((json as any)?.transaction ?? json);
    if (created) setTxs((prev) => [created, ...prev]);
    else await refresh();
    notify.success("เพิ่มรายการสำเร็จ");
    },
    [refresh]
  );

  const addMany = React.useCallback(
    async (items: ImportTransactionPayload[]) => {
      if (items.length === 0) return;
      setError(null);
      const res = await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      }).catch(() => null);
      const json = res ? await readJsonSafe(res) : null;
      if (!res || !res.ok) {
        const msg =
          (json as { message?: string; error?: string })?.message ||
          (json as { error?: string })?.error ||
          "นำเข้ารายการไม่สำเร็จ";
        setError(msg);
        notify.error(msg, "นำเข้าไม่สำเร็จ");
        return;
      }
      const created = (json as { created?: number }).created ?? 0;
      const total = (json as { total?: number }).total ?? items.length;
      const failed = (json as { failed?: { index: number; message: string }[] }).failed;
      await refresh();
      if (failed && failed.length > 0) {
        notify.error(`นำเข้า ${created}/${total} รายการ (ล้มเหลว ${failed.length} แถว)`, "นำเข้าบางส่วน");
      } else {
        notify.success(`นำเข้า ${created} รายการ`);
      }
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
        notify.error("ลบรายการไม่สำเร็จ");
        setTxs(prev);
        return;
      }
      notify.success("ลบรายการสำเร็จ");
    },
    [txs]
  );

  const removeAll = React.useCallback(async () => {
    setError(null);
    if (txs.length === 0) return;
    const res = await fetch("/api/transactions", { method: "DELETE" }).catch(() => null);
    const json = res ? await readJsonSafe(res) : null;
    if (!res || !res.ok) {
      setError("ลบรายการทั้งหมดไม่สำเร็จ");
      notify.error(
        (json as { message?: string })?.message || "ลบข้อมูลทั้งหมดไม่สำเร็จ — ลองใหม่หรือรีเฟรชหน้า"
      );
      await refresh();
      return;
    }
    const deleted =
      json != null && typeof json === "object" && typeof (json as { deleted?: unknown }).deleted === "number"
        ? (json as { deleted: number }).deleted
        : txs.length;
    await refresh();
    notify.success(`ลบรายการทั้งหมดแล้ว (${deleted} รายการ)`);
  }, [txs.length, refresh]);

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
        const msg = (json as any)?.message || (json as any)?.error || "แก้ไขรายการไม่สำเร็จ";
        setError(msg);
        notify.error(msg, "แก้ไขรายการไม่สำเร็จ");
        setTxs(prev);
        return;
      }
      const updated = mapTx((json as any)?.transaction ?? json);
      if (updated) setTxs((p) => p.map((t) => (t.id === id ? updated : t)));
      notify.success("บันทึกการแก้ไขสำเร็จ");
    },
    [txs]
  );

  return { txs, hydrated, error, refresh, add, addMany, remove, removeAll, update };
}

