import { toDateInputValue } from "@/lib/assetTimeline";
import type { TransactionFormState } from "@/types/transactionForm";

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function localDateTimeToIso(dateYmd: string, timeHm: string) {
  const time = (timeHm || "12:00").trim();
  const [hh = "12", mm = "00"] = time.split(":");
  const parts = dateYmd.split("-").map((x) => Number(x));
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!y || !mo || !d || !dateYmd.trim()) return new Date().toISOString();
  const h = Math.min(23, Math.max(0, Number(hh) || 0));
  const m = Math.min(59, Math.max(0, Number(mm) || 0));
  return new Date(y, mo - 1, d, h, m, 0, 0).toISOString();
}

export function isoToDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const n = new Date();
    return { date: toDateInputValue(n), time: `${pad2(n.getHours())}:${pad2(n.getMinutes())}` };
  }
  return {
    date: toDateInputValue(d),
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  };
}

export function defaultTransactionForm(): TransactionFormState {
  const n = new Date();
  return {
    assetName: "",
    assetLabel: "",
    assetType: "gold",
    side: "buy",
    price: "",
    amount: "",
    fee: "0",
    tax: "0",
    tradeDate: toDateInputValue(n),
    tradeTime: `${pad2(n.getHours())}:${pad2(n.getMinutes())}`
  };
}

export function visiblePageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 1) return [1];
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("gap");
    out.push(sorted[i]);
  }
  return out;
}

export function fmtMaxDp(n: number, dp = 3) {
  const v = Number.isFinite(n) ? n : 0;
  const p = Math.pow(10, dp);
  const r = Math.round(v * p) / p;
  return String(r).replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
}

export function sanitizeDecimalInput(raw: string) {
  const s = raw.replace(/[^\d.]/g, "");
  const [head, ...rest] = s.split(".");
  return rest.length === 0 ? head : `${head}.${rest.join("").replace(/\./g, "")}`;
}

export function parseStrictPositiveNumber(raw: string) {
  const s = raw.trim();
  if (!s) return { ok: false as const, reason: "required" as const };
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false as const, reason: "nan" as const };
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return { ok: false as const, reason: "nonPositive" as const };
  return { ok: true as const, value: n };
}

/** Tab-separated values (no embedded-tab quoting — matches typical broker exports). */
export function parseTsvLine(line: string) {
  return line.split("\t").map((cell) => cell.replace(/\r$/, "").trim());
}

export function parseCsvLine(line: string) {
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
}
