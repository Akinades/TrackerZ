"use client";

import * as React from "react";
import type { AppCurrency } from "@/store/useCurrency";
import { useTransactions } from "@/store/useTransactions";
import { useAuth } from "@/store/useAuth";
import { useCurrency } from "@/store/useCurrency";
import { useFxRate } from "@/store/useFxRate";
import { round2 } from "@/lib/calculations";
import { ASSETS_CATALOG, findAssetCatalogItem } from "@/lib/assetsCatalog";
import { notify } from "@/lib/notify";
import {
  assertCsvHasRequiredColumns,
  assertImportHasRequiredKeys,
  mapFlatRecordToImportPayload,
  normImportKey,
  parseTransactionsJson,
} from "@/lib/transactionImport";
import {
  daysAgo,
  endOfDay,
  RangePreset,
  startOfDay,
  startOfYear,
  toDateInputValue,
} from "@/lib/assetTimeline";
import {
  defaultTransactionForm,
  fmtMaxDp,
  isoToDateAndTime,
  localDateTimeToIso,
  parseCsvLine,
  parseStrictPositiveNumber,
  visiblePageNumbers,
} from "@/lib/transactionPageUtils";
import type {
  TransactionFormErrors,
  TransactionFormState,
} from "@/types/transactionForm";
import type { Transaction } from "@/types/transactions";

export type TransactionsPageModel = {
  authHydrated: boolean;
  user: ReturnType<typeof useAuth>["user"];
  isFreePlan: boolean;
  todayCreatedCount: number;
  freeDailyLimit: number;
  freeLimitReached: boolean;
  hydrated: boolean;
  txs: Transaction[];
  currency: AppCurrency;
  importError: string | null;
  importing: boolean;
  from: string;
  setFrom: React.Dispatch<React.SetStateAction<string>>;
  to: string;
  setTo: React.Dispatch<React.SetStateAction<string>>;
  rangePreset: RangePreset;
  setRangePreset: React.Dispatch<React.SetStateAction<RangePreset>>;
  applyPreset: (preset: NonNullable<RangePreset>) => void;
  oldest: Date | null;
  newest: Date | null;
  startAdd: () => void;
  openConfirm: (args: {
    title: string;
    body: React.ReactNode;
    cta: string;
    onConfirm: () => void;
  }) => void;
  removeAll: (assetSymbol?: string) => Promise<void>;
  exportCsv: () => void;
  pickImportFile: () => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  form: TransactionFormState;
  errors: TransactionFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<TransactionFormErrors>>;
  onChange: (patch: Partial<TransactionFormState>) => void;
  reset: () => void;
  submit: () => void;
  assetSuggestOpen: boolean;
  setAssetSuggestOpen: React.Dispatch<React.SetStateAction<boolean>>;
  assetSuggestWrapRef: React.RefObject<HTMLDivElement | null>;
  confirmOpen: boolean;
  setConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  confirmTitle: string;
  confirmBody: React.ReactNode;
  confirmCta: string;
  confirmActionRef: React.MutableRefObject<null | (() => void)>;
  rowMenuOpenId: string | null;
  setRowMenuOpenId: React.Dispatch<React.SetStateAction<string | null>>;
  rowMenuWrapRef: React.RefObject<HTMLDivElement | null>;
  filteredTxs: Transaction[];
  pageItems: Transaction[];
  pageSize: 10 | 25 | 50 | 100 | "all";
  setPageSize: React.Dispatch<React.SetStateAction<10 | 25 | 50 | 100 | "all">>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalItems: number;
  perPage: number;
  totalPages: number;
  safePage: number;
  startIdx: number;
  endIdx: number;
  pageButtons: (number | "gap")[];
  toDisplayMoney: (
    value: number,
    from?: "THB" | "USD",
    fxAtTrade?: number,
  ) => number;
  startEdit: (id: string) => void;
  remove: (id: string) => Promise<void>;
};

export function useTransactionsPage(): TransactionsPageModel {
  const { user, hydrated: authHydrated } = useAuth();
  const { currency } = useCurrency();
  const { usdThb } = useFxRate();
  const { txs, hydrated, add, addMany, remove, removeAll, update } =
    useTransactions();
  const [form, setForm] = React.useState<TransactionFormState>(() =>
    defaultTransactionForm(),
  );
  const [errors, setErrors] = React.useState<TransactionFormErrors>({});
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
  const [pageSize, setPageSize] = React.useState<10 | 25 | 50 | 100 | "all">(
    10,
  );
  const [page, setPage] = React.useState(1);
  const [rowMenuOpenId, setRowMenuOpenId] = React.useState<string | null>(null);
  const rowMenuWrapRef = React.useRef<HTMLDivElement | null>(null);
  const FREE_DAILY_LIMIT = 10;
  const [freeCreatedTodayCount, setFreeCreatedTodayCount] = React.useState<number | null>(null);

  const isEditing = editingId !== null;
  const fx = React.useMemo(
    () => (Number.isFinite(usdThb) && usdThb > 0 ? usdThb : 36),
    [usdThb],
  );

  const toDisplayMoney = React.useCallback(
    (value: number, from?: "THB" | "USD", fxAtTrade?: number) => {
      const src = from ?? currency;
      const rate =
        Number.isFinite(fxAtTrade) && (fxAtTrade as number) > 0
          ? (fxAtTrade as number)
          : fx;
      if (src === currency) return value;
      if (src === "USD" && currency === "THB") return value * rate;
      if (src === "THB" && currency === "USD") return value / rate;
      return value;
    },
    [currency, fx],
  );

  const fromDisplayMoney = React.useCallback(
    (value: number, to?: "THB" | "USD", fxAtTrade?: number) => {
      const dst = to ?? currency;
      const rate =
        Number.isFinite(fxAtTrade) && (fxAtTrade as number) > 0
          ? (fxAtTrade as number)
          : fx;
      if (dst === currency) return value;
      if (currency === "USD" && dst === "THB") return value * rate;
      if (currency === "THB" && dst === "USD") return value / rate;
      return value;
    },
    [currency, fx],
  );

  const onChange = (patch: Partial<TransactionFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setForm(defaultTransactionForm());
    setErrors({});
    setEditingId(null);
    setOpen(false);
    setAssetSuggestOpen(false);
  };

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
      "fxRateAtTrade",
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
        t.fxRateAtTrade ?? "",
      ]
        .map(esc)
        .join(","),
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

  const importTransactionsFile = React.useCallback(
    async (file: File) => {
      setImportError(null);
      setImporting(true);
      try {
        const lower = file.name.toLowerCase();
        const defaults = { currency, fx };

        if (lower.endsWith(".json")) {
          const text = await file.text();
          const rows = parseTransactionsJson(text);
          if (rows.length === 0) throw new Error("JSON ไม่มีรายการ");
          const keySet = new Set(Object.keys(rows[0]).map(normImportKey));
          assertImportHasRequiredKeys(keySet);
          const payloads = rows
            .map((row) => mapFlatRecordToImportPayload(row, defaults))
            .filter((p): p is NonNullable<typeof p> => p != null);
          if (payloads.length === 0)
            throw new Error("ไม่มีแถวข้อมูลที่ถูกต้อง");
          await addMany(payloads);
          return;
        }

        if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
          const XLSX = await import("xlsx");
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });
          const sn = wb.SheetNames[0];
          if (!sn) throw new Error("Excel ไม่มีข้อมูล");
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            wb.Sheets[sn],
            {
              defval: "",
              raw: false,
            },
          );
          if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("Excel ไม่มีแถวข้อมูล");
          }
          const keySet = new Set(Object.keys(rows[0]).map(normImportKey));
          assertImportHasRequiredKeys(keySet);
          const payloads = rows
            .map((row) => mapFlatRecordToImportPayload(row, defaults))
            .filter((p): p is NonNullable<typeof p> => p != null);
          if (payloads.length === 0)
            throw new Error("ไม่มีแถวข้อมูลที่ถูกต้อง");
          await addMany(payloads);
          return;
        }

        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) throw new Error("ไฟล์ CSV ว่าง หรือไม่มีข้อมูล");
        const headerLine = parseCsvLine(lines[0]).map((h) => h.trim());
        const colByNorm = new Map<string, number>();
        headerLine.forEach((h, i) => {
          const k = normImportKey(h);
          if (!colByNorm.has(k)) colByNorm.set(k, i);
        });
        assertCsvHasRequiredColumns(colByNorm);

        const payloads: NonNullable<
          ReturnType<typeof mapFlatRecordToImportPayload>
        >[] = [];
        for (let r = 1; r < lines.length; r++) {
          const cols = parseCsvLine(lines[r]);
          const record: Record<string, unknown> = {};
          headerLine.forEach((h, i) => {
            record[h] = cols[i] ?? "";
          });
          const payload = mapFlatRecordToImportPayload(record, defaults);
          if (payload) payloads.push(payload);
        }
        if (payloads.length === 0) throw new Error("ไม่มีแถวข้อมูลที่ถูกต้อง");
        await addMany(payloads);
      } catch (e) {
        setImportError(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
      } finally {
        setImporting(false);
      }
    },
    [addMany, currency, fx],
  );

  const pickImportFile = React.useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      ".csv,.tsv,.json,.xlsx,.xls,text/csv,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) importTransactionsFile(f);
    };
    input.click();
  }, [importTransactionsFile]);

  const submitImpl = async () => {
    const assetName = form.assetName.trim().toUpperCase();
    const priceParsed = parseStrictPositiveNumber(form.price);
    const amountParsed = parseStrictPositiveNumber(form.amount);
    const fee = Number(form.fee || 0);
    const tax = Number(form.tax || 0);

    const nextErrors: TransactionFormErrors = {};
    if (!assetName) nextErrors.assetName = "กรุณากรอกชื่อสินทรัพย์";
    if (!form.tradeDate?.trim())
      nextErrors.tradeDate = "กรุณาเลือกวันที่ทำรายการ";
    if (!priceParsed.ok) {
      nextErrors.price =
        priceParsed.reason === "required"
          ? "กรุณากรอกราคา"
          : "กรุณากรอกราคาเป็นตัวเลขเท่านั้น";
    }
    if (!amountParsed.ok) {
      nextErrors.amount = "กรุณากรอกจำนวน";
    }
    setErrors(nextErrors);
    if (
      !assetName ||
      !priceParsed.ok ||
      !amountParsed.ok ||
      !form.tradeDate?.trim() ||
      Object.keys(nextErrors).length > 0
    ) {
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

    const createdAtIso = localDateTimeToIso(
      form.tradeDate.trim(),
      form.tradeTime,
    );

    const payload = {
      assetName,
      assetLabel: assetLabel || undefined,
      assetType: form.assetType,
      side: form.side,
      price: round2(
        isEditWithBase
          ? fromDisplayMoney(price, base!.currency, base!.fxRateAtTrade)
          : price,
      ),
      amount: round2(amount),
      fee: isEditWithBase
        ? fromDisplayMoney(fee, base!.currency, base!.fxRateAtTrade)
        : fee,
      tax: isEditWithBase
        ? fromDisplayMoney(tax, base!.currency, base!.fxRateAtTrade)
        : tax,
      currency: isEditWithBase ? base!.currency : currency,
      fxRateAtTrade: isEditWithBase ? (base!.fxRateAtTrade ?? fx) : fx,
      createdAt: createdAtIso,
    } as const;

    if (isEditing) {
      await update(editingId!, payload);
      reset();
      return;
    }

    const result = await add(payload);
    if (!result.ok) return;

    if (isFreePlan) {
      if (typeof result.dailyLimit === "number" && typeof result.remainingToday === "number") {
        setFreeCreatedTodayCount(result.dailyLimit - result.remainingToday);
      } else {
        setFreeCreatedTodayCount((prev) => (prev ?? 0) + 1);
      }
    }
    reset();
  };

  const openConfirm = React.useCallback(
    ({
      title,
      body,
      cta,
      onConfirm,
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
    [],
  );

  const submit = () => {
    if (!isEditing) {
      void submitImpl();
      return;
    }

    openConfirm({
      title: "ยืนยันบันทึกการแก้ไข?",
      body: (
        <div className="grid gap-2">
          <div className="text-sm text-zinc-700">
            ระบบจะบันทึกการแก้ไขรายการนี้
          </div>
        </div>
      ),
      cta: "ยืนยันแก้ไข",
      onConfirm: () => void submitImpl(),
    });
  };

  const startEdit = (id: string) => {
    if (user?.plan === "free") {
      notify.info("แพ็กเกจ Free ไม่รองรับการแก้ไขรายการ");
      return;
    }
    const tx = txs.find((t) => t.id === id);
    if (!tx) return;
    const baseCurrency = (tx.currency ?? currency) as "THB" | "USD";
    const baseFx = tx.fxRateAtTrade;
    editingBaseRef.current = {
      currency: baseCurrency,
      fxRateAtTrade: baseFx,
      price: tx.price,
      fee: tx.fee ?? 0,
      tax: tx.tax ?? 0,
    };
    setEditingId(tx.id);
    setErrors({});
    const { date: td, time: tt } = isoToDateAndTime(tx.createdAt);
    setForm({
      assetName: tx.assetName,
      assetLabel: tx.assetLabel ?? "",
      assetType: tx.assetType,
      side: tx.side,
      price: fmtMaxDp(toDisplayMoney(tx.price, baseCurrency, baseFx), 3),
      amount: String(tx.amount),
      fee: fmtMaxDp(toDisplayMoney(tx.fee ?? 0, baseCurrency, baseFx), 3),
      tax: fmtMaxDp(toDisplayMoney(tx.tax ?? 0, baseCurrency, baseFx), 3),
      tradeDate: td,
      tradeTime: tt,
    });
    setOpen(true);
    setAssetSuggestOpen(false);
  };

  const startAdd = () => {
    setEditingId(null);
    editingBaseRef.current = null;
    setForm(defaultTransactionForm());
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
      price: fmtMaxDp(
        toDisplayMoney(base.price, base.currency, base.fxRateAtTrade),
        3,
      ),
      fee: fmtMaxDp(
        toDisplayMoney(base.fee, base.currency, base.fxRateAtTrade),
        3,
      ),
      tax: fmtMaxDp(
        toDisplayMoney(base.tax, base.currency, base.fxRateAtTrade),
        3,
      ),
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
      if (e.target instanceof Node && !el.contains(e.target))
        setAssetSuggestOpen(false);
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
      if (e.target instanceof Node && !el.contains(e.target))
        setRowMenuOpenId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [rowMenuOpenId]);

  const sorted = React.useMemo(() => {
    return [...txs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [txs]);

  const isFreePlan = user?.plan === "free";
  const todayCreatedCountFromTxs = React.useMemo(() => {
    if (!isFreePlan) return 0;
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    return txs.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= start && d <= end;
    }).length;
  }, [isFreePlan, txs]);
  React.useEffect(() => {
    if (!isFreePlan) {
      setFreeCreatedTodayCount(null);
      return;
    }
    setFreeCreatedTodayCount((prev) => {
      const backendCount =
        typeof user?.freePlanDailyCount === "number" && Number.isFinite(user.freePlanDailyCount)
          ? Math.max(0, Math.floor(user.freePlanDailyCount))
          : null;
      const initial = Math.max(todayCreatedCountFromTxs, backendCount ?? 0);
      if (prev == null) return initial;
      return Math.max(prev, initial);
    });
  }, [isFreePlan, todayCreatedCountFromTxs, user?.freePlanDailyCount]);
  const todayCreatedCount = isFreePlan ? freeCreatedTodayCount ?? todayCreatedCountFromTxs : 0;
  const freeLimitReached = isFreePlan && todayCreatedCount >= FREE_DAILY_LIMIT;

  const oldest = React.useMemo(
    () => (sorted[0]?.createdAt ? new Date(sorted[0].createdAt) : null),
    [sorted],
  );
  const newest = React.useMemo(
    () =>
      sorted[sorted.length - 1]?.createdAt
        ? new Date(sorted[sorted.length - 1].createdAt)
        : null,
    [sorted],
  );

  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [rangePreset, setRangePreset] = React.useState<RangePreset>("");

  React.useEffect(() => {
    if (!hydrated) return;
    if (!oldest || !newest) return;
    if (!rangePreset) {
      setFrom((prev) => (prev ? prev : toDateInputValue(oldest)));
      setTo((prev) => (prev ? prev : toDateInputValue(newest)));
    }
  }, [hydrated, oldest, newest, rangePreset]);

  const applyPreset = React.useCallback(
    (preset: NonNullable<RangePreset>) => {
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
    [newest, oldest],
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
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
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
  const pageItems =
    pageSize === "all"
      ? sortedFilteredTxs
      : sortedFilteredTxs.slice(startIdx, endIdx);

  React.useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageButtons = React.useMemo(
    () => (pageSize === "all" ? [] : visiblePageNumbers(safePage, totalPages)),
    [pageSize, safePage, totalPages],
  );

  return {
    authHydrated,
    user,
    isFreePlan,
    todayCreatedCount,
    freeDailyLimit: FREE_DAILY_LIMIT,
    freeLimitReached,
    hydrated,
    txs,
    currency,
    importError,
    importing,
    from,
    setFrom,
    to,
    setTo,
    rangePreset,
    setRangePreset,
    applyPreset,
    oldest,
    newest,
    startAdd,
    openConfirm,
    removeAll,
    exportCsv,
    pickImportFile,
    open,
    setOpen,
    isEditing,
    form,
    errors,
    setErrors,
    onChange,
    reset,
    submit,
    assetSuggestOpen,
    setAssetSuggestOpen,
    assetSuggestWrapRef,
    confirmOpen,
    setConfirmOpen,
    confirmTitle,
    confirmBody,
    confirmCta,
    confirmActionRef,
    rowMenuOpenId,
    setRowMenuOpenId,
    rowMenuWrapRef,
    filteredTxs,
    pageItems,
    pageSize,
    setPageSize,
    page,
    setPage,
    totalItems,
    perPage,
    totalPages,
    safePage,
    startIdx,
    endIdx,
    pageButtons,
    toDisplayMoney,
    startEdit,
    remove,
  };
}
