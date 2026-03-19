"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { ASSET_TYPES } from "@/lib/constants";
import type { AssetType, TransactionSide } from "@/types/transactions";
import { useTransactions } from "@/store/useTransactions";
import { useAuth } from "@/store/useAuth";
import { useCurrency } from "@/store/useCurrency";
import { useFxRate } from "@/store/useFxRate";
import { round2, txValue } from "@/lib/calculations";
import { ASSETS_CATALOG, findAssetCatalogItem } from "@/lib/assetsCatalog";
import { formatMoney, formatMoneyMax } from "@/lib/format";
import { notify } from "@/lib/notify";

type FormState = {
  assetName: string;
  assetLabel: string;
  assetType: AssetType;
  side: TransactionSide;
  price: string;
  amount: string;
  fee: string;
  tax: string;
};

type FormErrors = Partial<Record<keyof Pick<FormState, "assetName" | "price" | "amount">, string>>;

const initial: FormState = {
  assetName: "",
  assetLabel: "",
  assetType: "gold",
  side: "buy",
  price: "",
  amount: "",
  fee: "0",
  tax: "0"
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

function fmtMaxDp(n: number, dp = 3) {
  const v = Number.isFinite(n) ? n : 0;
  const p = Math.pow(10, dp);
  const r = Math.round(v * p) / p;
  // avoid long floats in inputs; trim trailing zeros
  return String(r).replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
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

function sanitizeDecimalInput(raw: string) {
  // Keep only digits and one dot. This avoids users typing letters/symbols.
  const s = raw.replace(/[^\d.]/g, "");
  const [head, ...rest] = s.split(".");
  return rest.length === 0 ? head : `${head}.${rest.join("").replace(/\./g, "")}`;
}

function parseStrictPositiveNumber(raw: string) {
  const s = raw.trim();
  if (!s) return { ok: false as const, reason: "required" as const };
  // strict numeric string: digits or digits.decimals
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false as const, reason: "nan" as const };
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return { ok: false as const, reason: "nonPositive" as const };
  return { ok: true as const, value: n };
}

export default function TransactionsPage() {
  const { user, hydrated: authHydrated } = useAuth();
  const { currency } = useCurrency();
  const { usdThb } = useFxRate();
  const { txs, hydrated, add, remove, update } = useTransactions();
  const [form, setForm] = React.useState<FormState>(initial);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const editingBaseRef = React.useRef<null | {
    currency: "THB" | "USD";
    fxRateAtTrade?: number;
    price: number;
    fee: number;
    tax: number;
  }>(null);
  const [assetSuggestOpen, setAssetSuggestOpen] = React.useState(false);
  const assetSuggestWrapRef = React.useRef<HTMLDivElement | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState("");
  const [confirmBody, setConfirmBody] = React.useState<React.ReactNode>(null);
  const [confirmCta, setConfirmCta] = React.useState("ยืนยัน");
  const confirmActionRef = React.useRef<null | (() => void)>(null);
  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  // (file action select removed)

  const [pageSize, setPageSize] = React.useState<10 | 25 | 50 | 100 | "all">(10);
  const [page, setPage] = React.useState(1);
  const [rowMenuOpenId, setRowMenuOpenId] = React.useState<string | null>(null);
  const rowMenuWrapRef = React.useRef<HTMLDivElement | null>(null);

  const isEditing = editingId !== null;
  const fx = React.useMemo(() => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36), [usdThb]);

  const toDisplayMoney = React.useCallback(
    (value: number, from?: "THB" | "USD", fxAtTrade?: number) => {
      const src = from ?? currency;
      const rate = Number.isFinite(fxAtTrade) && (fxAtTrade as number) > 0 ? (fxAtTrade as number) : fx;
      if (src === currency) return value;
      if (src === "USD" && currency === "THB") return value * rate;
      if (src === "THB" && currency === "USD") return value / rate;
      return value;
    },
    [currency, fx]
  );

  const fromDisplayMoney = React.useCallback(
    (value: number, to?: "THB" | "USD", fxAtTrade?: number) => {
      const dst = to ?? currency;
      const rate = Number.isFinite(fxAtTrade) && (fxAtTrade as number) > 0 ? (fxAtTrade as number) : fx;
      if (dst === currency) return value;
      // display -> dst
      if (currency === "USD" && dst === "THB") return value * rate;
      if (currency === "THB" && dst === "USD") return value / rate;
      return value;
    },
    [currency, fx]
  );

  const onChange = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setForm(initial);
    setErrors({});
    setEditingId(null);
    setOpen(false);
    setAssetSuggestOpen(false);
  };

  // (dropdown removed) file actions handled by <Select>

  const exportCsv = React.useCallback(() => {
    const header = [
      "createdAt",
      "assetName",
      "assetLabel",
      "assetType",
      "side",
      "price",
      "amount",
      "fee",
      "tax",
      "currency",
      "fxRateAtTrade"
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = txs.map((t) =>
      [
        t.createdAt,
        t.assetName,
        t.assetLabel ?? "",
        t.assetType,
        t.side,
        t.price,
        t.amount,
        t.fee ?? 0,
        t.tax ?? 0,
        t.currency ?? "",
        t.fxRateAtTrade ?? ""
      ].map(esc).join(",")
    );
    const csv = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trackerz-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [txs]);

  const parseCsvLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let i = 0;
    let inQ = false;
    while (i < line.length) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        if (ch === '"') {
          inQ = false;
          i += 1;
          continue;
        }
        cur += ch;
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQ = true;
        i += 1;
        continue;
      }
      if (ch === ",") {
        out.push(cur);
        cur = "";
        i += 1;
        continue;
      }
      cur += ch;
      i += 1;
    }
    out.push(cur);
    return out;
  };

  const importCsv = React.useCallback(
    async (file: File) => {
      setImportError(null);
      setImporting(true);
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) throw new Error("ไฟล์ CSV ว่าง หรือไม่มีข้อมูล");
        const header = parseCsvLine(lines[0]).map((h) => h.trim());
        const idx = (k: string) => header.indexOf(k);
        const req = ["assetName", "assetType", "side", "price", "amount"];
        for (const k of req) if (idx(k) === -1) throw new Error(`CSV ต้องมีคอลัมน์ ${k}`);

        for (let r = 1; r < lines.length; r++) {
          const cols = parseCsvLine(lines[r]);
          const get = (k: string) => {
            const j = idx(k);
            return j >= 0 ? (cols[j] ?? "").trim() : "";
          };
          const assetName = get("assetName").toUpperCase();
          const assetType = (get("assetType") || "other") as AssetType;
          const side = (get("side") || "buy") as TransactionSide;
          const price = Number(get("price"));
          const amount = Number(get("amount"));
          const fee = Number(get("fee") || 0);
          const tax = Number(get("tax") || 0);
          const assetLabel = get("assetLabel") || undefined;
          const currencyFrom = (get("currency") as any) || currency;
          const fxRateAtTrade = Number(get("fxRateAtTrade") || fx);
          if (!assetName || !Number.isFinite(price) || !Number.isFinite(amount)) continue;

          // Create via API (backend sets createdAt). Keep fx/currency/tax in notes.
          await add({
            assetName,
            assetLabel,
            assetType,
            side,
            price,
            amount,
            fee: Number.isFinite(fee) ? fee : 0,
            tax: Number.isFinite(tax) ? tax : 0,
            currency: currencyFrom,
            fxRateAtTrade: Number.isFinite(fxRateAtTrade) && fxRateAtTrade > 0 ? fxRateAtTrade : fx
          } as any);
        }
      } catch (e) {
        setImportError(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
      } finally {
        setImporting(false);
      }
    },
    [add, currency, fx]
  );

  const pickCsvFile = React.useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) importCsv(f);
    };
    input.click();
  }, [importCsv]);

  const submitImpl = () => {
    const assetName = form.assetName.trim().toUpperCase();
    const priceParsed = parseStrictPositiveNumber(form.price);
    const amountParsed = parseStrictPositiveNumber(form.amount);
    const fee = Number(form.fee || 0);
    const tax = Number(form.tax || 0);

    const nextErrors: FormErrors = {};
    if (!assetName) nextErrors.assetName = "กรุณากรอกชื่อสินทรัพย์";
    if (!priceParsed.ok) {
      nextErrors.price =
        priceParsed.reason === "required"
          ? "กรุณากรอกราคา"
          : "กรุณากรอกราคาเป็นตัวเลขเท่านั้น";
    }
    if (!amountParsed.ok) {
      nextErrors.amount =
        amountParsed.reason === "required"
          ? "กรุณากรอกจำนวน"
          : "กรุณากรอกจำนวนเป็นตัวเลขเท่านั้น";
    }
    setErrors(nextErrors);
    if (!assetName || !priceParsed.ok || !amountParsed.ok || Object.keys(nextErrors).length > 0) {
      notify.error("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
      return;
    }

    const price = priceParsed.value;
    const amount = amountParsed.value;
    if (!Number.isFinite(fee) || fee < 0) return;
    if (!Number.isFinite(tax) || tax < 0) return;

    const catalog = findAssetCatalogItem(assetName);
    const assetLabel = (form.assetLabel || catalog?.label || "").trim();

    const isEditWithBase = isEditing && editingBaseRef.current;
    const base = editingBaseRef.current;

    const payload = {
      assetName,
      assetLabel: assetLabel || undefined,
      assetType: form.assetType,
      side: form.side,
      price: round2(
        isEditWithBase
          ? fromDisplayMoney(price, base!.currency, base!.fxRateAtTrade)
          : price
      ),
      amount: round2(amount),
      // Do not round fee/tax to 2 decimals.
      // Users may input very small values (e.g. 0.003) and rounding would turn them into 0.
      fee: isEditWithBase ? fromDisplayMoney(fee, base!.currency, base!.fxRateAtTrade) : fee,
      tax: isEditWithBase ? fromDisplayMoney(tax, base!.currency, base!.fxRateAtTrade) : tax,
      currency: isEditWithBase ? base!.currency : currency,
      fxRateAtTrade: isEditWithBase ? base!.fxRateAtTrade ?? fx : fx
    } as const;

    if (isEditing) update(editingId!, payload);
    else add(payload);
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
          <div className="text-sm text-zinc-700">ระบบจะบันทึกการแก้ไขรายการนี้</div>
        </div>
      ),
      cta: "ยืนยันแก้ไข",
      onConfirm: () => submitImpl()
    });
  };

  const startEdit = (id: string) => {
    const tx = txs.find((t) => t.id === id);
    if (!tx) return;
    const baseCurrency = (tx.currency ?? currency) as "THB" | "USD";
    const baseFx = tx.fxRateAtTrade;
    editingBaseRef.current = {
      currency: baseCurrency,
      fxRateAtTrade: baseFx,
      price: tx.price,
      fee: tx.fee ?? 0,
      tax: tx.tax ?? 0
    };
    setEditingId(tx.id);
    setErrors({});
    setForm({
      assetName: tx.assetName,
      assetLabel: tx.assetLabel ?? "",
      assetType: tx.assetType,
      side: tx.side,
      // Display price/fee/tax in the currently selected app currency
      price: fmtMaxDp(toDisplayMoney(tx.price, baseCurrency, baseFx), 3),
      amount: String(tx.amount),
      fee: fmtMaxDp(toDisplayMoney(tx.fee ?? 0, baseCurrency, baseFx), 3),
      tax: fmtMaxDp(toDisplayMoney(tx.tax ?? 0, baseCurrency, baseFx), 3)
    });
    setOpen(true);
    setAssetSuggestOpen(false);
  };

  const startAdd = () => {
    setEditingId(null);
    editingBaseRef.current = null;
    setForm(initial);
    setErrors({});
    setOpen(true);
    setAssetSuggestOpen(false);
  };

  React.useEffect(() => {
    if (!open) return;
    if (!isEditing) return;
    const base = editingBaseRef.current;
    if (!base) return;
    setForm((prev) => ({
      ...prev,
      price: fmtMaxDp(toDisplayMoney(base.price, base.currency, base.fxRateAtTrade), 3),
      fee: fmtMaxDp(toDisplayMoney(base.fee, base.currency, base.fxRateAtTrade), 3),
      tax: fmtMaxDp(toDisplayMoney(base.tax, base.currency, base.fxRateAtTrade), 3)
    }));
  }, [currency, open, isEditing, toDisplayMoney]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">บันทึกรายการซื้อ/ขาย</h1>
          <p className="text-sm text-zinc-600">เพิ่ม/แก้ไขรายการซื้อขายของคุณ</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 gap-1 sm:pr-4">
            <div className="text-sm font-medium">ช่วงวันที่</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:w-[220px]">
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
              <div className="w-full sm:w-[190px]">
                <div className="text-xs text-zinc-400">จาก</div>
                <Input
                  type="date"
                  className="h-11 rounded-2xl px-3 text-xs shadow-none"
                  value={from}
                  onChange={(e) => {
                    setRangePreset("");
                    setFrom(e.target.value);
                  }}
                  disabled={!hydrated}
                />
              </div>
              <div className="w-full sm:w-[190px]">
                <div className="text-xs text-zinc-400">ถึง</div>
                <Input
                  type="date"
                  className="h-11 rounded-2xl px-3 text-xs shadow-none"
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

          <div className="flex shrink-0 items-center justify-end sm:self-center">
            <Button onClick={startAdd} disabled={!hydrated} className="h-11 rounded-2xl px-4 py-0">
              เพิ่มรายการ
            </Button>
          </div>
        </div>
      </Card>

      {importError ? (
        <Card className="p-4">
          <div className="text-sm text-rose-700">{importError}</div>
        </Card>
      ) : null}

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
                  aria-invalid={Boolean(errors.assetName) || undefined}
                  className={errors.assetName ? "border-rose-300 focus:ring-rose-200" : undefined}
                  onFocus={() => setAssetSuggestOpen(true)}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange({ assetName: v, assetLabel: "" });
                    if (errors.assetName) setErrors((p) => ({ ...p, assetName: undefined }));
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
                    if (!sym) {
                      setErrors((p) => ({ ...p, assetName: "กรุณากรอกชื่อสินทรัพย์" }));
                      return;
                    }
                    const hit = findAssetCatalogItem(sym);
                    onChange({
                      assetName: sym,
                      assetLabel: form.assetLabel || hit?.label || "",
                      assetType: hit?.type ?? form.assetType
                    });
                    setTimeout(() => setAssetSuggestOpen(false), 0);
                  }}
                />
                {errors.assetName ? (
                  <div className="mt-1 text-xs text-rose-700">{errors.assetName}</div>
                ) : null}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
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
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-zinc-700 dark:text-zinc-200">ราคา/หน่วย</label>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {currency}
                </span>
              </div>
              <Input
                inputMode="decimal"
                value={form.price}
                placeholder="0"
                aria-invalid={Boolean(errors.price) || undefined}
                className={errors.price ? "border-rose-300 focus:ring-rose-200" : undefined}
                onChange={(e) => {
                  const v = sanitizeDecimalInput(e.target.value);
                  onChange({ price: v });
                  if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
                }}
                onBlur={() => {
                  const p = parseStrictPositiveNumber(form.price);
                  if (!p.ok) {
                    setErrors((prev) => ({
                      ...prev,
                      price: p.reason === "required" ? "กรุณากรอกราคา" : "กรุณากรอกราคาเป็นตัวเลขเท่านั้น"
                    }));
                  }
                }}
              />
              {errors.price ? <div className="mt-1 text-xs text-rose-700">{errors.price}</div> : null}
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">จำนวน</label>
              <Input
                inputMode="decimal"
                value={form.amount}
                placeholder="0"
                aria-invalid={Boolean(errors.amount) || undefined}
                className={errors.amount ? "border-rose-300 focus:ring-rose-200" : undefined}
                onChange={(e) => {
                  const v = sanitizeDecimalInput(e.target.value);
                  onChange({ amount: v });
                  if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
                }}
                onBlur={() => {
                  const a = parseStrictPositiveNumber(form.amount);
                  if (!a.ok) {
                    setErrors((prev) => ({
                      ...prev,
                      amount:
                        a.reason === "required" ? "กรุณากรอกจำนวน" : "กรุณากรอกจำนวนเป็นตัวเลขเท่านั้น"
                    }));
                  }
                }}
              />
              {errors.amount ? <div className="mt-1 text-xs text-rose-700">{errors.amount}</div> : null}
            </div>

            <div className="grid gap-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-zinc-700 dark:text-zinc-200">Fee</label>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {currency}
                </span>
              </div>
              <Input
                inputMode="decimal"
                value={form.fee}
                placeholder="0"
                onChange={(e) => onChange({ fee: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-zinc-700 dark:text-zinc-200">Tax</label>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {currency}
                </span>
              </div>
              <Input
                inputMode="decimal"
                value={form.tax}
                placeholder="0"
                onChange={(e) => onChange({ tax: e.target.value })}
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
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={exportCsv}
                disabled={!hydrated || txs.length === 0}
                className="h-9 rounded-2xl px-4 py-0"
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={pickCsvFile}
                disabled={!hydrated || importing}
                className="h-9 rounded-2xl px-4 py-0"
              >
                Import CSV
              </Button>
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
              <div className="hidden gap-3 bg-zinc-50/60 px-5 py-3 text-xs font-medium text-zinc-600 sm:grid sm:grid-cols-[minmax(260px,3fr)_minmax(90px,1fr)_minmax(140px,1.2fr)_minmax(110px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(140px,1.2fr)_minmax(80px,0.7fr)]">
                <div>สินทรัพย์</div>
                <div>ฝั่ง</div>
                <div className="text-right">มูลค่า</div>
                <div className="text-right">จำนวน</div>
                <div className="text-right">Fee</div>
                <div className="text-right">Tax</div>
                <div className="text-right">ราคา</div>
                <div className="text-right">จัดการ</div>
              </div>
              {pageItems.map((t) => (
                <div
                  key={t.id}
                  className="grid gap-3 p-5 sm:grid sm:grid-cols-[minmax(260px,3fr)_minmax(90px,1fr)_minmax(140px,1.2fr)_minmax(110px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(140px,1.2fr)_minmax(80px,0.7fr)] sm:items-center"
                >
                  <div>
                    <div className="font-medium text-zinc-900">
                      {t.assetLabel ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <AssetIcon symbol={t.assetName} type={t.assetType} className="h-7 w-7 rounded-xl" />
                          <span className="truncate">{t.assetLabel}</span>
                          <span className="rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                            {t.assetName}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <AssetIcon symbol={t.assetName} type={t.assetType} className="h-7 w-7 rounded-xl" />
                          <span>{t.assetName}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {t.assetType.toUpperCase()} • {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div>
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

                  <div className="sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">มูลค่า</span>
                      <span className="tabular-nums font-medium text-zinc-900">
                        {formatMoney(
                          round2(toDisplayMoney(txValue(t), t.currency, t.fxRateAtTrade)),
                          currency
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">จำนวน</span>
                      <span className="tabular-nums text-zinc-700">{t.amount}</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">Fee</span>
                      <span className="tabular-nums text-zinc-700">
                        {formatMoneyMax(
                          round2(toDisplayMoney(t.fee ?? 0, t.currency, t.fxRateAtTrade)),
                          currency,
                          3
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">Tax</span>
                      <span className="tabular-nums text-zinc-700">
                        {formatMoneyMax(
                          round2(toDisplayMoney(t.tax ?? 0, t.currency, t.fxRateAtTrade)),
                          currency,
                          3
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="flex items-center justify-between text-sm sm:block">
                      <span className="text-xs text-zinc-500 sm:hidden">ราคา</span>
                      <span className="tabular-nums text-zinc-700">
                        {formatMoney(round2(toDisplayMoney(t.price, t.currency, t.fxRateAtTrade)), currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
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
                                      มูลค่า{" "}
                                      {formatMoney(
                                        round2(toDisplayMoney(txValue(t), t.currency, t.fxRateAtTrade)),
                                        currency
                                      )}
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

        <div className="border-t border-zinc-200/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-zinc-500">
              {pageSize === "all" ? (
                <>แสดงทั้งหมด {totalItems} รายการ</>
              ) : (
                <>
                  {startIdx + 1}-{endIdx} / {totalItems} (หน้า {safePage}/{totalPages})
                </>
              )}
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
      </Card>
    </div>
  );
}

