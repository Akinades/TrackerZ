"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ASSET_TYPES } from "@/lib/constants";
import type { AssetType, TransactionSide } from "@/types/transactions";
import { useTransactions } from "@/store/useTransactions";
import { round2, txValue } from "@/lib/calculations";

type FormState = {
  assetName: string;
  assetType: AssetType;
  side: TransactionSide;
  price: string;
  amount: string;
  fee: string;
};

const initial: FormState = {
  assetName: "",
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

export default function TransactionsPage() {
  const { txs, hydrated, add, remove } = useTransactions();
  const [form, setForm] = React.useState<FormState>(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const isEditing = editingId !== null;

  const onChange = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setForm(initial);
    setEditingId(null);
    setOpen(false);
  };

  const submit = () => {
    const assetName = form.assetName.trim();
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

    add({
      assetName,
      assetType: form.assetType,
      side: form.side,
      price: round2(price),
      amount: round2(amount),
      fee: round2(fee)
    });
    reset();
  };

  const startEdit = (id: string) => {
    const tx = txs.find((t) => t.id === id);
    if (!tx) return;
    setEditingId(tx.id);
    setForm({
      assetName: tx.assetName,
      assetType: tx.assetType,
      side: tx.side,
      price: String(tx.price),
      amount: String(tx.amount),
      fee: String(tx.fee ?? 0)
    });
    setOpen(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(initial);
    setOpen(true);
  };

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

  React.useEffect(() => {
    if (!hydrated) return;
    if (!oldest || !newest) return;
    setFrom((prev) => (prev ? prev : toDateInputValue(oldest)));
    setTo((prev) => (prev ? prev : toDateInputValue(newest)));
  }, [hydrated, oldest, newest]);

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

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">บันทึกรายการซื้อ/ขาย</h1>
        <p className="text-sm text-zinc-600">
          ข้อมูลจะถูกเก็บในเครื่องของคุณ (localStorage) เหมาะสำหรับ MVP
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-1">
            <div className="text-sm font-medium">ช่วงวันที่</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <div className="text-xs text-zinc-400">จาก (อ้างอิงวันที่เก่าสุด)</div>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  disabled={!hydrated}
                />
              </div>
              <div className="grid gap-1">
                <div className="text-xs text-zinc-400">ถึง (อ้างอิงวันที่ล่าสุด)</div>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              onClick={() => {
                if (!oldest || !newest) return;
                setFrom(toDateInputValue(oldest));
                setTo(toDateInputValue(newest));
              }}
              disabled={!hydrated || !oldest || !newest}
            >
              ดูทั้งหมด
            </Button>
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
              <label className="text-sm text-zinc-300">ชื่อสินทรัพย์</label>
              <Input
                value={form.assetName}
                placeholder="เช่น XAUUSD, AAPL, BTC"
                onChange={(e) => onChange({ assetName: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-300">ประเภท</label>
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
              <label className="text-sm text-zinc-300">ฝั่ง</label>
              <Select
                value={form.side}
                onChange={(e) => onChange({ side: e.target.value as TransactionSide })}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </Select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-300">ราคา/หน่วย</label>
              <Input
                inputMode="decimal"
                value={form.price}
                placeholder="0"
                onChange={(e) => onChange({ price: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-300">จำนวน</label>
              <Input
                inputMode="decimal"
                value={form.amount}
                placeholder="0"
                onChange={(e) => onChange({ amount: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-300">Fee</label>
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

      <Card className="p-0">
        <div className="border-b border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">รายการทั้งหมด</div>
              <div className="text-xs text-zinc-400">
                แสดง {filteredTxs.length} / ทั้งหมด {txs.length} รายการ
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-800">
          {!hydrated ? (
            <div className="p-5 text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          ) : filteredTxs.length === 0 ? (
            <div className="p-5 text-sm text-zinc-400">ยังไม่มีรายการ ลองเพิ่มรายการแรกได้เลย</div>
          ) : (
            filteredTxs
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((t) => (
              <div key={t.id} className="grid gap-3 p-5 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-4">
                  <div className="font-medium">{t.assetName}</div>
                  <div className="text-xs text-zinc-500">
                    {t.assetType.toUpperCase()} • เวลา {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span
                    className={
                      t.side === "buy"
                        ? "rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-700"
                        : "rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-700"
                    }
                  >
                    {t.side.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-zinc-700 sm:col-span-2">
                  ราคา {t.price}
                </div>
                <div className="text-sm text-zinc-700 sm:col-span-2">
                  จำนวน {t.amount}
                </div>
                <div className="text-sm text-zinc-700 sm:col-span-2">
                  มูลค่า {round2(txValue(t))}
                </div>

                <div className="flex gap-2 sm:col-span-12 sm:justify-end">
                  <Button variant="ghost" onClick={() => startEdit(t.id)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => remove(t.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

