"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PortfolioPie } from "@/components/charts/PortfolioPie";
import { PortfolioPnlBar } from "@/components/charts/PortfolioPnlBar";
import { useTransactions } from "@/store/useTransactions";
import { usePrices } from "@/store/usePrices";
import { ASSET_TYPES } from "@/lib/constants";
import { demoPrices, demoTransactions } from "@/lib/demoData";
import {
  computePositionsAvgCost,
  currentValue,
  investedTotal,
  realizedPnlFromPositions,
  totalFees,
  unrealizedPnl
} from "@/lib/calculations";
import { clearAllData, savePrices, saveTransactions } from "@/lib/storage";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { txs, hydrated } = useTransactions();
  const { prices, hydrated: pricesHydrated, setPrice } = usePrices();
  const [pieMode, setPieMode] = React.useState<"asset" | "type">("asset");

  const positions = computePositionsAvgCost(txs);
  const invested = investedTotal(txs);
  const fees = totalFees(txs);
  const realized = realizedPnlFromPositions(positions);
  const unrealized = unrealizedPnl(positions, prices);
  const net = Math.round((realized + unrealized) * 100) / 100;
  const valueNow = currentValue(positions, prices);

  const allocationByAsset = React.useMemo(() => {
    return positions
      .map((p) => {
        const px = prices[p.assetName];
        const v = Number.isFinite(px) && px > 0 ? p.qty * px : 0;
        return { name: p.assetName, value: Math.round(v * 100) / 100 };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [positions, prices]);

  const allocationByType = React.useMemo(() => {
    const labelOf = new Map(ASSET_TYPES.map((t) => [t.value, t.label] as const));
    const sum: Record<string, number> = {};
    for (const p of positions) {
      const px = prices[p.assetName];
      if (!Number.isFinite(px) || px <= 0) continue;
      const label = labelOf.get(p.assetType) ?? p.assetType;
      sum[label] = (sum[label] ?? 0) + p.qty * px;
    }
    return Object.entries(sum)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [positions, prices]);

  const allocation = pieMode === "type" ? allocationByType : allocationByAsset;

  const pnlRows = React.useMemo(() => {
    return positions
      .map((p) => {
        const px = prices[p.assetName];
        const u =
          Number.isFinite(px) && px > 0 ? (px - p.avgCost) * p.qty : 0;
        return {
          name: p.assetName,
          realized: Math.round(p.realizedPnl * 100) / 100,
          unrealized: Math.round(u * 100) / 100
        };
      })
      .filter((r) => r.realized !== 0 || r.unrealized !== 0)
      .sort(
        (a, b) =>
          Math.abs(b.realized + b.unrealized) - Math.abs(a.realized + a.unrealized)
      )
      .slice(0, 12);
  }, [positions, prices]);

  const seedDemo = React.useCallback(() => {
    saveTransactions(demoTransactions());
    savePrices(demoPrices());
    window.location.reload();
  }, []);

  const clearData = React.useCallback(() => {
    clearAllData();
    window.location.reload();
  }, []);

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">พอร์ตภาพรวม</h1>
        <p className="text-sm text-zinc-600">
          MVP: ต้นทุนเฉลี่ย (Average Cost) แยกตามสินทรัพย์ + ใส่ “ราคาปัจจุบัน” เพื่อคำนวณมูลค่า/กำไรขาดทุน
        </p>
      </div>

      {hydrated && pricesHydrated && txs.length === 0 ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">ยังไม่มีข้อมูล</div>
              <div className="text-xs text-zinc-400">
                กดเพื่อโหลดข้อมูลตัวอย่างให้เห็นตัวเลข/กราฟทันที
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={seedDemo}
                className="rounded-md border border-zinc-700 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-950"
              >
                โหลด Demo data
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="เงินลงทุนทั้งหมด (Buy + Fee)" value={hydrated ? `${invested}` : "…"} />
        <Metric
          label="มูลค่าปัจจุบัน (ต้องใส่ราคา)"
          value={hydrated && pricesHydrated ? `${valueNow}` : "…"}
        />
        <Metric label="กำไรสุทธิ (Realized+Unrealized)" value={hydrated ? `${net}` : "…"} />
      </div>

      <Card>
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-medium">สัดส่วนพอร์ต (ตามมูลค่าปัจจุบัน)</div>
              <div className="text-xs text-zinc-500">กรอก “ราคาปัจจุบัน” ก่อน กราฟถึงจะมีข้อมูล</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPieMode("asset")}
                className={
                  pieMode === "asset"
                    ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                    : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                }
              >
                แยกตามสินทรัพย์
              </button>
              <button
                type="button"
                onClick={() => setPieMode("type")}
                className={
                  pieMode === "type"
                    ? "rounded-2xl border border-zinc-200/70 bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                    : "rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                }
              >
                รวมตามประเภท
              </button>
            </div>
          </div>
          {hydrated && pricesHydrated ? (
            <PortfolioPie data={allocation} />
          ) : (
            <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          )}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <div>
            <div className="text-sm font-medium">กำไร/ขาดทุนรายสินทรัพย์</div>
            <div className="text-xs text-zinc-500">
              แสดง Top 12 ตามขนาด P/L (Realized + Unrealized)
            </div>
          </div>
          {hydrated && pricesHydrated ? (
            <PortfolioPnlBar data={pnlRows} />
          ) : (
            <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
          )}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium">ราคาปัจจุบัน (ต่อหน่วย)</div>
              <div className="text-xs text-zinc-500">
                ใส่ราคาเพื่อคำนวณมูลค่าปัจจุบันและ unrealized P/L
              </div>
            </div>
            <div className="text-right text-xs text-zinc-500">
              Realized: {hydrated ? `${realized}` : "…"} <br />
              Unrealized: {hydrated && pricesHydrated ? `${unrealized}` : "…"}
            </div>
          </div>

          <div className="grid gap-2">
            {!hydrated || !pricesHydrated ? (
              <div className="text-sm text-zinc-400">กำลังโหลดข้อมูล…</div>
            ) : positions.length === 0 ? (
              <div className="text-sm text-zinc-400">
                ยังไม่มี position ลองเพิ่มรายการซื้อขายก่อน หรือกด “โหลด Demo data”
              </div>
            ) : (
              <div className="grid gap-2">
                {positions.map((p) => (
                  <div
                    key={p.assetName}
                    className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-3 sm:grid-cols-12 sm:items-center"
                  >
                    <div className="sm:col-span-4">
                      <div className="font-medium">{p.assetName}</div>
                      <div className="text-xs text-zinc-500">
                        Qty {p.qty} • Avg {Math.round(p.avgCost * 100) / 100}
                      </div>
                    </div>
                    <div className="sm:col-span-5">
                      <Input
                        inputMode="decimal"
                        placeholder="ราคาปัจจุบัน"
                        value={prices[p.assetName] ? String(prices[p.assetName]) : ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          if (!v) return setPrice(p.assetName, null);
                          const n = Number(v);
                          setPrice(p.assetName, Number.isFinite(n) ? n : null);
                        }}
                      />
                    </div>
                    <div className="text-sm text-zinc-600 sm:col-span-3 sm:text-right">
                      Fee รวม: {fees}
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={clearData}
                    className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    ล้างข้อมูลทั้งหมด
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">จำนวนรายการ</div>
            <div className="text-xs text-zinc-400">{hydrated ? `${txs.length}` : "…"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">Positions</div>
            <div className="text-sm font-medium">{hydrated ? `${positions.length}` : "…"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

