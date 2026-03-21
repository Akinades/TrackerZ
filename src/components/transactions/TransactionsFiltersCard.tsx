import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { TransactionsPageModel } from "@/hooks/useTransactionsPage";

type Props = { m: TransactionsPageModel };

export function TransactionsFiltersCard({ m }: Props) {
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
    openConfirm,
    removeAll,
    txs
  } = m;

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
          <Button onClick={startAdd} disabled={!hydrated} className="h-11 rounded-2xl px-4 py-0">
            เพิ่มรายการ
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              openConfirm({
                title: "ลบรายการทั้งหมด?",
                body: (
                  <div className="grid gap-2">
                    <div className="text-sm text-zinc-700">
                      จะลบรายการซื้อขายทุกรายการในบัญชีนี้ ({txs.length} รายการ) — ไม่สามารถกู้คืนได้
                    </div>
                    <div className="text-xs text-zinc-500">
                      แนะนำส่งออก CSV สำรองก่อน หากต้องการเก็บประวัติ
                    </div>
                  </div>
                ),
                cta: "ลบทั้งหมด",
                onConfirm: () => void removeAll()
              })
            }
            disabled={!hydrated || txs.length === 0}
            className="h-11 rounded-2xl border-rose-200/80 px-4 py-0 text-rose-800 hover:bg-rose-50"
          >
            ลบข้อมูลทั้งหมด
          </Button>
        </div>
      </div>
    </Card>
  );
}
