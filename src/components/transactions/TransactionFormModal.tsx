import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ASSET_TYPES } from "@/lib/constants";
import { ASSETS_CATALOG, findAssetCatalogItem } from "@/lib/assetsCatalog";
import type { AssetType, TransactionSide } from "@/types/transactions";
import type { TransactionsPageModel } from "@/hooks/useTransactionsPage";
import { parseStrictPositiveNumber, sanitizeDecimalInput } from "@/lib/transactionPageUtils";

type Props = { m: TransactionsPageModel };

export function TransactionFormModal({ m }: Props) {
  const {
    open,
    setOpen,
    isEditing,
    form,
    errors,
    setErrors,
    onChange,
    reset,
    submit,
    currency,
    assetSuggestOpen,
    setAssetSuggestOpen,
    assetSuggestWrapRef
  } = m;

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={isEditing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}>
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
                  const hit = ASSETS_CATALOG.find((x) => x.symbol === v.trim().toUpperCase());
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
              {errors.assetName ? <div className="mt-1 text-xs text-rose-700">{errors.assetName}</div> : null}
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

        <div className="grid gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid min-w-0 flex-1 gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">วันที่ซื้อ/ขาย</label>
              <Input
                type="date"
                value={form.tradeDate}
                onChange={(e) => {
                  onChange({ tradeDate: e.target.value });
                  if (errors.tradeDate) setErrors((p) => ({ ...p, tradeDate: undefined }));
                }}
                aria-invalid={Boolean(errors.tradeDate) || undefined}
                className={`h-11 rounded-2xl px-3 text-sm shadow-none ${errors.tradeDate ? "border-rose-300 focus:ring-rose-200" : ""}`}
              />
            </div>
            <div className="grid min-w-0 flex-1 gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">เวลาซื้อ/ขาย</label>
              <Input
                type="time"
                step={60}
                value={form.tradeTime}
                onChange={(e) => onChange({ tradeTime: e.target.value })}
                className="h-11 rounded-2xl px-3 text-sm shadow-none"
              />
            </div>
          </div>
          {errors.tradeDate ? <div className="text-xs text-rose-700">{errors.tradeDate}</div> : null}
          <p className="text-[11px] leading-snug text-zinc-500">
            วันที่กับเวลาต้องสอดคล้องกัน — ใช้เรียงลำดับเมื่อมีหลายรายการในวันเดียวกัน
          </p>
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
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{currency}</span>
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
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{currency}</span>
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
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{currency}</span>
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
            {isEditing
              ? "แก้ไขรวมวันที่/เวลาที่ทำรายการได้ — ใช้กับการเรียงลำดับและกรองช่วงวันที่"
              : "กำหนดวันที่และเวลาที่ซื้อ/ขายจริง เพื่อให้เรียงตามเวลาถูกต้อง"}
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
  );
}
