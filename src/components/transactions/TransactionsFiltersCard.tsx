import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { TransactionsPageModel } from "@/hooks/useTransactionsPage";
import * as React from "react";

type Props = { m: TransactionsPageModel };

export function TransactionsFiltersCard({ m }: Props) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState("__all__");
  const {
    hydrated,
    rangePreset,
    setRangePreset,
    applyPreset,
    from,
    setFrom,
    to,
    setTo,
    oldest,
    newest,
    startAdd,
    removeAll,
    txs
  } = m;
  const assetOptions = React.useMemo(
    () => Array.from(new Set(txs.map((t) => t.assetName))).sort((a, b) => a.localeCompare(b)),
    [txs]
  );

  return (
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

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:self-center">
          <Button
            onClick={startAdd}
            disabled={!hydrated}
            className="h-11 rounded-2xl px-4 py-0"
          >
            เพิ่มรายการ
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedAsset("__all__");
              setDeleteOpen(true);
            }}
            disabled={!hydrated || txs.length === 0}
            className="h-11 rounded-2xl border-rose-200/80 px-4 py-0 text-rose-800 hover:bg-rose-50"
          >
            ลบข้อมูล
          </Button>
        </div>
      </div>
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="ลบข้อมูล" className="max-w-lg">
        <div className="grid gap-4">
          <div className="text-sm text-zinc-700">เลือกว่าจะลบข้อมูลทั้งหมด หรือเฉพาะสินทรัพย์</div>
          <Select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}>
            <option value="__all__">ลบข้อมูลทั้งหมด ({txs.length} รายการ)</option>
            {assetOptions.map((symbol) => {
              const count = txs.filter((t) => t.assetName === symbol).length;
              return (
                <option key={symbol} value={symbol}>
                  ลบเฉพาะ {symbol} ({count} รายการ)
                </option>
              );
            })}
          </Select>
          <div className="text-xs text-zinc-500">การลบไม่สามารถกู้คืนได้</div>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                void removeAll(selectedAsset === "__all__" ? undefined : selectedAsset);
              }}
            >
              ยืนยันลบ
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
