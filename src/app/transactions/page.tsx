"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ASSET_TYPES } from "@/lib/constants";
import type { AssetType, TransactionSide } from "@/types/transactions";
import { useTransactions } from "@/store/useTransactions";
import { useAuth } from "@/store/useAuth";
import { round2, txValue } from "@/lib/calculations";
import { ASSETS_CATALOG, findAssetCatalogItem } from "@/lib/assetsCatalog";

type FormState = {
  assetName: string;
  assetLabel: string;
  assetType: AssetType;
  side: TransactionSide;
  price: string;
  amount: string;
  fee: string;
};

const initial: FormState = {
  assetName: "",
  assetLabel: "",
  assetType: "gold",
  side: "buy",
  price: "",
  amount: "",
  fee: "0"
};

function toDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function startOfYear(d: Date) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function TransactionsPage() {
  const { user, hydrated: authHydrated } = useAuth();
  const { txs, hydrated, add, remove } = useTransactions();
  const [form, setForm] = React.useState<FormState>(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [assetSuggestOpen, setAssetSuggestOpen] = React.useState(false);
  const assetSuggestWrapRef = React.useRef<HTMLDivElement | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState("");
  const [confirmBody, setConfirmBody] = React.useState<React.ReactNode>(null);
  const [confirmCta, setConfirmCta] = React.useState("ยืนยัน");
  const confirmActionRef = React.useRef<null | (() => void)>(null);

  const [pageSize, setPageSize] = React.useState<10 | 25 | 50 | 100 | "all">(10);
  const [page, setPage] = React.useState(1);
  const [rowMenuOpenId, setRowMenuOpenId] = React.useState<string | null>(null);
  const rowMenuWrapRef = React.useRef<HTMLDivElement | null>(null);

  const isEditing = editingId !== null;

  const onChange = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setForm(initial);
    setEditingId(null);
    setOpen(false);
    setAssetSuggestOpen(false);
  };

  const submitImpl = () => {
    const assetName = form.assetName.trim().toUpperCase();
    const price = Number(form.price);
    const amount = Number(form.amount);
    const fee = Number(form.fee || 0);

    if (!assetName) return;
    if (!Number.isFinite(price) || price <= 0) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!Number.isFinite(fee) || fee < 0) return;

    if (isEditing) {
      // MVP: edit via remove+add to keep hook simple
      remove(editingId!);
    }

    const catalog = findAssetCatalogItem(assetName);
    const assetLabel = (form.assetLabel || catalog?.label || "").trim();

    add({
      assetName,
      assetLabel: assetLabel || undefined,
      assetType: form.assetType,
      side: form.side,
      price: round2(price),
      amount: round2(amount),
      fee: round2(fee)
    });
    reset();
  };

  const openConfirm = React.useCallback(
    ({
      title,
      body,
      cta,
      onConfirm
    }: {
      title: string;
      body: React.ReactNode;
      cta: string;
      onConfirm: () => void;
    }) => {
      setConfirmTitle(title);
      setConfirmBody(body);
      setConfirmCta(cta);
      confirmActionRef.current = onConfirm;
      setConfirmOpen(true);
    },
    []
  );

  const submit = () => {
    if (!isEditing) return submitImpl();

    openConfirm({
      title: "ยืนยันบันทึกการแก้ไข?",
      body: (
        <div className="grid gap-2">
          <div className="text-sm text-zinc-700">
            ระบบ MVP จะบันทึกเป็นรายการใหม่ (remove + add) เพื่อความง่าย
          </div>
          <div className="text-xs text-zinc-500">
            รายการเดิมจะถูกลบทิ้ง และสร้างรายการใหม่ด้วยข้อมูลที่คุณแก้ไข
          </div>
        </div>
      ),
      cta: "ยืนยันแก้ไข",
      onConfirm: () => submitImpl()
    });
  };

  const startEdit = (id: string) => {
    const tx = txs.find((t) => t.id === id);
    if (!tx) return;
    setEditingId(tx.id);
    setForm({
      assetName: tx.assetName,
      assetLabel: tx.assetLabel ?? "",
      assetType: tx.assetType,
      side: tx.side,
      price: String(tx.price),
      amount: String(tx.amount),
      fee: String(tx.fee ?? 0)
    });
    setOpen(true);
    setAssetSuggestOpen(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(initial);
    setOpen(true);
    setAssetSuggestOpen(false);
  };

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssetSuggestOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = assetSuggestWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setAssetSuggestOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!rowMenuOpenId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRowMenuOpenId(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = rowMenuWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setRowMenuOpenId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [rowMenuOpenId]);

  const sorted = React.useMemo(() => {
    return [...txs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [txs]);

  const oldest = React.useMemo(
    () => (sorted[0]?.createdAt ? new Date(sorted[0].createdAt) : null),
    [sorted]
  );
  const newest = React.useMemo(
    () => (sorted[sorted.length - 1]?.createdAt ? new Date(sorted[sorted.length - 1].createdAt) : null),
    [sorted]
  );

  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [rangePreset, setRangePreset] = React.useState<
    "" | "today" | "yesterday" | "last7" | "last30" | "last90" | "ytd" | "last365" | "all"
  >("");

  React.useEffect(() => {
    if (!hydrated) return;
    if (!oldest || !newest) return;
    if (!rangePreset) {
      setFrom((prev) => (prev ? prev : toDateInputValue(oldest)));
      setTo((prev) => (prev ? prev : toDateInputValue(newest)));
    }
  }, [hydrated, oldest, newest, rangePreset]);

  const applyPreset = React.useCallback(
    (preset: NonNullable<typeof rangePreset>) => {
      const now = new Date();
      if (preset === "all") {
        setFrom(oldest ? toDateInputValue(oldest) : "");
        setTo(newest ? toDateInputValue(newest) : "");
        return;
      }
      if (preset === "today") {
        setFrom(toDateInputValue(now));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "yesterday") {
        const y = daysAgo(1);
        setFrom(toDateInputValue(y));
        setTo(toDateInputValue(y));
        return;
      }
      if (preset === "last7") {
        setFrom(toDateInputValue(daysAgo(6)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last30") {
        setFrom(toDateInputValue(daysAgo(29)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last90") {
        setFrom(toDateInputValue(daysAgo(89)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "ytd") {
        setFrom(toDateInputValue(startOfYear(now)));
        setTo(toDateInputValue(now));
        return;
      }
      if (preset === "last365") {
        setFrom(toDateInputValue(daysAgo(364)));
        setTo(toDateInputValue(now));
      }
    },
    [newest, oldest]
  );

  const filteredTxs = React.useMemo(() => {
    if (!from && !to) return txs;
    const fromD = from ? startOfDay(new Date(from)) : null;
    const toD = to ? endOfDay(new Date(to)) : null;
    return txs.filter((t) => {
      const d = new Date(t.createdAt);
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    });
  }, [txs, from, to]);

  const sortedFilteredTxs = React.useMemo(() => {
    return filteredTxs
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredTxs]);

  React.useEffect(() => {
    setPage(1);
  }, [from, to, pageSize, editingId]);

  const totalItems = sortedFilteredTxs.length;
  const perPage = pageSize === "all" ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const endIdx = Math.min(totalItems, startIdx + perPage);
  const pageItems = pageSize === "all" ? sortedFilteredTxs : sortedFilteredTxs.slice(startIdx, endIdx);

  if (authHydrated && !user) {
    return (
      <Card className="p-6">
        <div className="grid gap-2">
          <div className="text-lg font-semibold">เข้าสู่ระบบเพื่อบันทึกรายการ</div>
          <div className="text-sm text-zinc-600">
            ล็อกอินก่อน แล้วค่อยเพิ่ม/แก้ไข/ลบรายการซื้อขายได้
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link href="/login?next=/transactions" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/register?next=/transactions" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                สมัครสมาชิก
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">บันทึกรายการซื้อ/ขาย</h1>
        <p className="text-sm text-zinc-600">
          ข้อมูลจะถูกเก็บในเครื่องของคุณ (localStorage) เหมาะสำหรับ MVP
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <div className="text-sm font-medium">ช่วงวันที่</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:w-[260px]">
                <div className="text-xs text-zinc-400">ช่วงเวลา</div>
                <Select
                  value={rangePreset}
                  onChange={(e) => {
                    const v = e.target.value as typeof rangePreset;
                    setRangePreset(v);
                    if (!v) return;
                    applyPreset(v);
                  }}
                  disabled={!hydrated}
                  className="h-11 rounded-2xl px-3 text-xs shadow-none"
                  aria-label="Date range preset"
                >
                  <option value="">เลือกช่วงวันที่…</option>
                  <option value="today">วันนี้</option>
                  <option value="yesterday">เมื่อวาน</option>
                  <option value="last7">7 วันที่ผ่านมา</option>
                  <option value="last30">30 วันที่ผ่านมา</option>
                  <option value="last90">90 วันที่ผ่านมา</option>
                  <option value="ytd">ปีนี้ (YTD)</option>
                  <option value="last365">1 ปีที่ผ่านมา</option>
                  <option value="all">ทั้งหมด</option>
                </Select>
              </div>
              <div className="w-full sm:w-[200px]">
                <div className="text-xs text-zinc-400">จาก</div>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setRangePreset("");
                    setFrom(e.target.value);
                  }}
                  disabled={!hydrated}
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <div className="text-xs text-zinc-400">ถึง</div>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setRangePreset("");
                    setTo(e.target.value);
                  }}
                  disabled={!hydrated}
                />
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              {oldest && newest
                ? `ข้อมูลมีตั้งแต่ ${oldest.toLocaleString()} ถึง ${newest.toLocaleString()}`
                : "ยังไม่มีข้อมูล"}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Button onClick={startAdd} disabled={!hydrated}>
              เพิ่มรายการ (Modal)
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">ชื่อสินทรัพย์</label>
              <div ref={assetSuggestWrapRef} className="relative">
                <Input
                  value={form.assetName}
                  placeholder="เช่น AAPL, BTC, EURUSD, XAUUSD"
                  onFocus={() => setAssetSuggestOpen(true)}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange({ assetName: v, assetLabel: "" });
                    setAssetSuggestOpen(true);
                    const hit = ASSETS_CATALOG.find(
                      (x) => x.symbol === v.trim().toUpperCase()
                    );
                    if (hit) {
                      onChange({ assetName: hit.symbol, assetLabel: hit.label, assetType: hit.type });
                      setAssetSuggestOpen(false);
                    }
                  }}
                  onBlur={() => {
                    const sym = form.assetName.trim().toUpperCase();
                    if (!sym) return;
                    const hit = findAssetCatalogItem(sym);
                    onChange({
                      assetName: sym,
                      assetLabel: form.assetLabel || hit?.label || "",
                      assetType: hit?.type ?? form.assetType
                    });
                    setTimeout(() => setAssetSuggestOpen(false), 0);
                  }}
                />
                {(() => {
                  if (!assetSuggestOpen) return null;
                  const q = form.assetName.trim();
                  if (!q) return null;
                  const qq = q.toLowerCase();
                  const items = ASSETS_CATALOG.filter(
                    (x) => x.symbol.toLowerCase().includes(qq) || x.label.toLowerCase().includes(qq)
                  ).slice(0, 6);
                  if (items.length === 0) return null;
                  return (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_30px_70px_-55px_rgba(0,0,0,0.55)] dark:border-zinc-800/70 dark:bg-zinc-950">
                      {items.map((x) => (
                        <button
                          key={x.symbol}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onChange({ assetName: x.symbol, assetLabel: x.label, assetType: x.type });
                            setAssetSuggestOpen(false);
                          }}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{x.symbol}</div>
                            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{x.label}</div>
                          </div>
                          <div className="shrink-0 rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:text-zinc-200">
                            {x.type.toUpperCase()}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">ประเภท</label>
              <Select
                value={form.assetType}
                onChange={(e) => onChange({ assetType: e.target.value as AssetType })}
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">ฝั่ง</label>
              <Select
                value={form.side}
                onChange={(e) => onChange({ side: e.target.value as TransactionSide })}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </Select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">ราคา/หน่วย</label>
              <Input
                inputMode="decimal"
                value={form.price}
                placeholder="0"
                onChange={(e) => onChange({ price: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">จำนวน</label>
              <Input
                inputMode="decimal"
                value={form.amount}
                placeholder="0"
                onChange={(e) => onChange({ amount: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">Fee</label>
              <Input
                inputMode="decimal"
                value={form.fee}
                placeholder="0"
                onChange={(e) => onChange({ fee: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-zinc-500">
              {isEditing ? "หมายเหตุ: MVP จะบันทึกเป็นรายการใหม่ (remove + add)" : "บันทึกรายการพร้อมเวลาอัตโนมัติ"}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>
                ยกเลิก
              </Button>
              <Button onClick={submit}>{isEditing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          confirmActionRef.current = null;
        }}
        title={confirmTitle}
        className="max-w-lg"
      >
        <div className="grid gap-4">
          <div>{confirmBody}</div>
          <div className="flex gap-2 sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false);
                confirmActionRef.current = null;
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                const fn = confirmActionRef.current;
                setConfirmOpen(false);
                confirmActionRef.current = null;
                fn?.();
              }}
            >
              {confirmCta}
            </Button>
          </div>
        </div>
      </Modal>

      <Card className="p-0">
        <div className="border-b border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">รายการทั้งหมด</div>
              <div className="text-xs text-zinc-400">
                แสดง {filteredTxs.length} / ทั้งหมด {txs.length} รายการ
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="w-[150px]">
                <Select
                  value={String(pageSize)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPageSize(v === "all" ? "all" : (Number(v) as 10 | 25 | 50 | 100));
                  }}
                  className="h-9 rounded-2xl px-3 text-xs shadow-none"
                  aria-label="Page size"
                >
                  <option value="10">แสดง 10</option>
                  <option value="25">แสดง 25</option>
                  <option value="50">แสดง 50</option>
                  <option value="100">แสดง 100</option>
                  <option value="all">ดูทั้งหมด</option>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1 || pageSize === "all"}
                className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ก่อนหน้า
              </button>
              <div className="text-xs text-zinc-500">
                {pageSize === "all" ? (
                  <>แสดงทั้งหมด {totalItems} รายการ</>
                ) : (
                  <>
                    {startIdx + 1}-{endIdx} / {totalItems} (หน้า {safePage}/{totalPages})
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages || pageSize === "all"}
                className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-800">
          {!hydrated ? (
            <div className="p-5 text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          ) : filteredTxs.length === 0 ? (
            <div className="p-5 text-sm text-zinc-400">ยังไม่มีรายการ ลองเพิ่มรายการแรกได้เลย</div>
          ) : (
            <div ref={rowMenuWrapRef}>
              <div className="hidden grid-cols-12 gap-3 bg-zinc-50/60 px-5 py-3 text-xs font-medium text-zinc-600 sm:grid">
                <div className="col-span-4">สินทรัพย์</div>
                <div className="col-span-2">ฝั่ง</div>
                <div className="col-span-2 text-right">ราคา</div>
                <div className="col-span-2 text-right">จำนวน</div>
                <div className="col-span-1 text-right">มูลค่า</div>
                <div className="col-span-1 text-right">จัดการ</div>
              </div>
              {pageItems.map((t) => (
                <div key={t.id} className="grid gap-3 p-5 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-4">
                    <div className="font-medium text-zinc-900">
                      {t.assetLabel ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate">{t.assetLabel}</span>
                          <span className="rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                            {t.assetName}
                          </span>
                        </span>
                      ) : (
                        t.assetName
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {t.assetType.toUpperCase()} • {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span
                      className={
                        t.side === "buy"
                          ? "rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-700"
                      }
                    >
                      {t.side.toUpperCase()}
                    </span>
                  </div>

                  <div className="sm:col-span-2 sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">ราคา</span>
                      <span className="tabular-nums text-zinc-700">{t.price}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">จำนวน</span>
                      <span className="tabular-nums text-zinc-700">{t.amount}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-1 sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">มูลค่า</span>
                      <span className="tabular-nums font-medium text-zinc-900">{round2(txValue(t))}</span>
                    </div>
                  </div>

                  <div className="flex justify-end sm:col-span-1">
                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Row actions"
                        className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        onClick={() => setRowMenuOpenId((prev) => (prev === t.id ? null : t.id))}
                      >
                        ⋯
                      </button>
                      {rowMenuOpenId === t.id ? (
                        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-40 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_30px_70px_-55px_rgba(0,0,0,0.55)]">
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setRowMenuOpenId(null);
                              startEdit(t.id);
                            }}
                          >
                            แก้ไขรายการ
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm text-rose-700 hover:bg-rose-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setRowMenuOpenId(null);
                              openConfirm({
                                title: "ยืนยันลบรายการ?",
                                body: (
                                  <div className="grid gap-2">
                                    <div className="text-sm text-zinc-700">
                                      คุณกำลังจะลบ <span className="font-medium">{t.assetName}</span> ({t.side.toUpperCase()}){" "}
                                      มูลค่า {round2(txValue(t))}
                                    </div>
                                    <div className="text-xs text-zinc-500">การลบไม่สามารถกู้คืนได้</div>
                                  </div>
                                ),
                                cta: "ลบรายการ",
                                onConfirm: () => remove(t.id)
                              });
                            }}
                          >
                            ลบรายการ
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

