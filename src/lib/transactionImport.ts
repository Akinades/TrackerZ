import type { AppCurrency } from "@/store/useCurrency";
import type { AssetType, TransactionSide } from "@/types/transactions";
import { findAssetCatalogItem } from "@/lib/assetsCatalog";

/** Normalize header / JSON keys for matching */
export function normImportKey(s: string): string {
  return String(s)
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/** Groups: at least one alias per group must exist (CSV header or first JSON row keys) */
export const IMPORT_REQUIRED_ALIAS_GROUPS = [
  ["assetName", "asset_symbol", "symbol"],
  ["price", "price_per_unit"],
  ["amount", "quantity"],
  ["side", "type"]
] as const;

export function assertImportHasRequiredKeys(keySet: Set<string>) {
  for (const group of IMPORT_REQUIRED_ALIAS_GROUPS) {
    const ok = group.some((a) => keySet.has(normImportKey(a)));
    if (!ok) {
      throw new Error(`ไฟล์ต้องมีฟิลด์อย่างน้อยหนึ่งค่าในกลุ่ม: ${group.join(" / ")}`);
    }
  }
}

export function assertCsvHasRequiredColumns(colByNorm: Map<string, number>) {
  const keys = new Set(colByNorm.keys());
  assertImportHasRequiredKeys(keys);
}

function buildNormalizedStringMap(raw: Record<string, unknown>): Map<string, string> {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      // skip nested objects (e.g. Mongo _id) unless plain
      if (!Array.isArray(v) && v.constructor === Object) continue;
    }
    const val =
      typeof v === "number" || typeof v === "boolean"
        ? String(v)
        : typeof v === "string"
          ? v.trim()
          : String(v).trim();
    m.set(normImportKey(k), val);
  }
  return m;
}

function getM(m: Map<string, string>, ...aliases: string[]): string {
  for (const a of aliases) {
    const v = m.get(normImportKey(a));
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

export type ImportTransactionPayload = {
  assetName: string;
  assetLabel?: string;
  assetType: AssetType;
  side: TransactionSide;
  price: number;
  amount: number;
  fee: number;
  tax: number;
  currency: AppCurrency;
  fxRateAtTrade: number;
  /** ISO จากคอลัมน์ traded_at / tradedAt — ใช้เวลาซื้อขายจริงตอน import */
  tradedAt?: string;
  /** ISO สำรอง (created_at / createdAt) */
  createdAt?: string;
};

export type ImportRowSkipReason =
  | "empty_row"
  | "missing_asset"
  | "invalid_price"
  | "invalid_amount";

const SKIP_REASON_TH: Record<ImportRowSkipReason, string> = {
  empty_row: "แถวว่าง",
  missing_asset: "ไม่มีชื่อสินทรัพย์",
  invalid_price: "ราคาไม่ถูกต้อง",
  invalid_amount: "จำนวนไม่ถูกต้อง"
};

export function importRowSkipReasonMessage(r: ImportRowSkipReason): string {
  return SKIP_REASON_TH[r];
}

export type ImportSkipDetail = { dataRowIndex: number; reason: string };

/** Split rows into valid payloads vs skipped (with 1-based data row index for messages). */
export function partitionImportRows(
  rows: Record<string, unknown>[],
  defaults: { currency: AppCurrency; fx: number }
): {
  payloads: ImportTransactionPayload[];
  skips: ImportSkipDetail[];
} {
  const payloads: ImportTransactionPayload[] = [];
  const skips: ImportSkipDetail[] = [];
  rows.forEach((row, i) => {
    const r = mapFlatRecordToImportRowResult(row, defaults);
    if (r.ok) payloads.push(r.payload);
    else
      skips.push({
        dataRowIndex: i + 1,
        reason: importRowSkipReasonMessage(r.reason)
      });
  });
  return { payloads, skips };
}

export function formatImportOutcomeMessage(
  ok: number,
  skips: ImportSkipDetail[]
): string {
  if (skips.length === 0) return `นำเข้า ${ok} รายการสำเร็จ`;
  const head = skips
    .slice(0, 8)
    .map((s) => `แถว ${s.dataRowIndex}: ${s.reason}`)
    .join(" · ");
  const tail =
    skips.length > 8 ? ` · …และอีก ${skips.length - 8} แถว` : "";
  return `นำเข้า ${ok} รายการ · ข้าม ${skips.length} แถว (${head}${tail})`;
}

export type ImportRowResult =
  | { ok: true; payload: ImportTransactionPayload }
  | { ok: false; reason: ImportRowSkipReason };

function isImportRowVisuallyEmpty(raw: Record<string, unknown>): boolean {
  for (const v of Object.values(raw)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      if (Array.isArray(v) && v.length > 0) return false;
      if (!Array.isArray(v) && v.constructor === Object) continue;
    }
    const s =
      typeof v === "number" || typeof v === "boolean"
        ? String(v)
        : typeof v === "string"
          ? v.trim()
          : String(v).trim();
    if (s !== "") return false;
  }
  return true;
}

/**
 * Map one flat row (CSV columns as record, Excel row, or JSON object) to API add payload.
 * Returns a result with skip reason for user-visible import summaries.
 */
export function mapFlatRecordToImportRowResult(
  raw: Record<string, unknown>,
  defaults: { currency: AppCurrency; fx: number }
): ImportRowResult {
  if (isImportRowVisuallyEmpty(raw)) return { ok: false, reason: "empty_row" };

  const m = buildNormalizedStringMap(raw);
  const assetName = getM(m, "assetName", "asset_symbol", "symbol").toUpperCase();
  const assetTypeRaw = getM(m, "assetType", "asset_type");
  const sideRaw = (getM(m, "side", "type") || "buy").toLowerCase();
  const price = Number(getM(m, "price", "price_per_unit"));
  const amount = Number(getM(m, "amount", "quantity"));
  const fee = Number(getM(m, "fee") || 0);
  const tax = Number(getM(m, "tax") || 0);
  const assetLabel = getM(m, "assetLabel", "asset_name") || undefined;
  const curRaw = getM(m, "currency");
  const currencyFrom =
    curRaw === "THB" || curRaw === "USD" ? curRaw : defaults.currency;
  const fxRaw = Number(getM(m, "fxRateAtTrade", "fx_rate_at_trade") || defaults.fx);

  const tradedAtRaw = getM(m, "traded_at", "tradedAt");
  const createdAtRaw = getM(m, "created_at", "createdAt");
  const tradedAt = tradedAtRaw || undefined;
  const createdAt = createdAtRaw || undefined;

  if (!assetName) return { ok: false, reason: "missing_asset" };
  if (!Number.isFinite(price) || price <= 0) return { ok: false, reason: "invalid_price" };
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, reason: "invalid_amount" };

  let assetType = (assetTypeRaw || "other") as AssetType;
  if (!assetTypeRaw && assetName) {
    const hit = findAssetCatalogItem(assetName);
    if (hit) assetType = hit.type;
  }
  const side = (sideRaw === "sell" ? "sell" : "buy") as TransactionSide;

  const out: ImportTransactionPayload = {
    assetName,
    assetLabel,
    assetType,
    side,
    price,
    amount,
    fee: Number.isFinite(fee) ? fee : 0,
    tax: Number.isFinite(tax) ? tax : 0,
    currency: currencyFrom,
    fxRateAtTrade: Number.isFinite(fxRaw) && fxRaw > 0 ? fxRaw : defaults.fx
  };
  if (tradedAt) out.tradedAt = tradedAt;
  if (createdAt) out.createdAt = createdAt;
  return { ok: true, payload: out };
}

/**
 * Map one flat row (CSV columns as record, Excel row, or JSON object) to API add payload.
 * Returns null if row is empty / invalid numbers (caller may skip).
 */
export function mapFlatRecordToImportPayload(
  raw: Record<string, unknown>,
  defaults: { currency: AppCurrency; fx: number }
): ImportTransactionPayload | null {
  const r = mapFlatRecordToImportRowResult(raw, defaults);
  return r.ok ? r.payload : null;
}

/** Parse JSON file: array of objects, or { transactions | data | items: [...] } */
export function parseTransactionsJson(text: string): Record<string, unknown>[] {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("ไฟล์ JSON ว่าง");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("ไฟล์ JSON ไม่ถูกต้อง");
  }
  if (Array.isArray(parsed)) {
    return parsed.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as Record<
      string,
      unknown
    >[];
  }
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    const arr = o.transactions ?? o.data ?? o.items ?? o.rows;
    if (Array.isArray(arr)) {
      return arr.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as Record<
        string,
        unknown
      >[];
    }
    return [o];
  }
  throw new Error("JSON ต้องเป็น array ของรายการ หรือ object ที่มี transactions/data/items");
}
