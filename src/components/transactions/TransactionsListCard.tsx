import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { formatMoney, formatMoneyMax } from "@/lib/format";
import { round2, txValue } from "@/lib/calculations";
import type { TransactionsPageModel } from "@/hooks/useTransactionsPage";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { m: TransactionsPageModel };

export function TransactionsListCard({ m }: Props) {
  const { t: tr, locale } = useI18n();
  const dtLocale = locale === "th" ? "th-TH" : "en-US";
  const {
    hydrated,
    txs,
    filteredTxs,
    pageItems,
    currency,
    exportCsv,
    pickImportFile,
    importing,
    rowMenuOpenId,
    setRowMenuOpenId,
    rowMenuWrapRef,
    startEdit,
    remove,
    openConfirm,
    toDisplayMoney,
    pageSize,
    setPageSize,
    page,
    setPage,
    totalItems,
    totalPages,
    safePage,
    startIdx,
    endIdx,
    pageButtons,
  } = m;

  return (
    <Card className="p-0">
      <div className="border-b border-zinc-800 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">{tr("transactions.list.title")}</div>
            <div className="text-xs text-zinc-400">
              {tr("transactions.list.showingPrefix")} {filteredTxs.length}{" "}
              {tr("transactions.list.showingOf")} {txs.length}{" "}
              {tr("transactions.list.items")}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={!hydrated || txs.length === 0}
              className="h-9 rounded-2xl px-4 py-0"
            >
              {tr("transactions.list.exportCsv")}
            </Button>
            <Button
              variant="secondary"
              onClick={pickImportFile}
              disabled={!hydrated || importing}
              className="h-9 rounded-2xl px-4 py-0"
            >
              {tr("transactions.list.importFiles")}
            </Button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {!hydrated ? (
          <div className="p-5 text-sm text-zinc-400">{tr("transactions.list.loading")}</div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-5 text-sm text-zinc-400">
            {tr("transactions.list.empty")}
          </div>
        ) : (
          <div ref={rowMenuWrapRef}>
            <div className="hidden gap-3 bg-zinc-50/60 px-5 py-3 text-xs font-medium text-zinc-600 sm:grid sm:grid-cols-[minmax(200px,2.4fr)_minmax(120px,1fr)_minmax(86px,0.85fr)_minmax(130px,1.1fr)_minmax(100px,1fr)_minmax(92px,1fr)_minmax(92px,1fr)_minmax(124px,1.1fr)_minmax(72px,0.6fr)]">
              <div>{tr("transactions.list.cols.asset")}</div>
              <div>{tr("transactions.list.cols.date")}</div>
              <div>{tr("transactions.list.cols.side")}</div>
              <div className="text-right">{tr("transactions.list.cols.value")}</div>
              <div className="text-right">{tr("transactions.list.cols.amount")}</div>
              <div className="text-right">Fee</div>
              <div className="text-right">Tax</div>
              <div className="text-right">{tr("transactions.list.cols.price")}</div>
              <div className="text-right">{tr("transactions.list.cols.manage")}</div>
            </div>
            {pageItems.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 p-5 sm:grid sm:grid-cols-[minmax(200px,2.4fr)_minmax(120px,1fr)_minmax(86px,0.85fr)_minmax(130px,1.1fr)_minmax(100px,1fr)_minmax(92px,1fr)_minmax(92px,1fr)_minmax(124px,1.1fr)_minmax(72px,0.6fr)] sm:items-center"
              >
                <div>
                  <div className="font-medium text-zinc-900">
                    {row.assetLabel ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <AssetIcon
                          symbol={row.assetName}
                          type={row.assetType}
                          className="h-7 w-7 rounded-xl"
                        />
                        <span className="truncate">{row.assetLabel}</span>
                        <span className="rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                          {row.assetName}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <AssetIcon
                          symbol={row.assetName}
                          type={row.assetType}
                          className="h-7 w-7 rounded-xl"
                        />
                        <span>{row.assetName}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {row.assetType.toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 sm:block">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {tr("transactions.list.cols.date")}
                    </span>
                    <span className="text-sm tabular-nums text-zinc-800">
                      {new Date(row.createdAt).toLocaleString(dtLocale, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <span
                    className={
                      row.side === "buy"
                        ? "rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700"
                        : "rounded-full bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-700"
                    }
                  >
                    {row.side.toUpperCase()}
                  </span>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-center justify-between text-sm sm:block">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {tr("transactions.list.cols.value")}
                    </span>
                    <span className="tabular-nums font-medium text-zinc-900">
                      {formatMoney(
                        round2(
                          toDisplayMoney(
                            txValue(row),
                            row.currency,
                            row.fxRateAtTrade,
                          ),
                        ),
                        currency,
                      )}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-center justify-between text-sm sm:block">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {tr("transactions.list.cols.amount")}
                    </span>
                    <span className="tabular-nums text-zinc-700">
                      {row.amount}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-center justify-between text-sm sm:block">
                    <span className="text-xs text-zinc-500 sm:hidden">Fee</span>
                    <span className="tabular-nums text-zinc-700">
                      {formatMoneyMax(
                        round2(
                          toDisplayMoney(
                            row.fee ?? 0,
                            row.currency,
                            row.fxRateAtTrade,
                          ),
                        ),
                        currency,
                        3,
                      )}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-center justify-between text-sm sm:block">
                    <span className="text-xs text-zinc-500 sm:hidden">Tax</span>
                    <span className="tabular-nums text-zinc-700">
                      {formatMoneyMax(
                        round2(
                          toDisplayMoney(
                            row.tax ?? 0,
                            row.currency,
                            row.fxRateAtTrade,
                          ),
                        ),
                        currency,
                        3,
                      )}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-center justify-between text-sm sm:block">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {tr("transactions.list.cols.price")}
                    </span>
                    <span className="tabular-nums text-zinc-700">
                      {formatMoney(
                        round2(
                          toDisplayMoney(row.price, row.currency, row.fxRateAtTrade),
                        ),
                        currency,
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Row actions"
                      className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      onClick={() =>
                        setRowMenuOpenId((prev) =>
                          prev === row.id ? null : row.id,
                        )
                      }
                    >
                      ⋯
                    </button>
                    {rowMenuOpenId === row.id ? (
                      <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-40 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_30px_70px_-55px_rgba(0,0,0,0.55)]">
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setRowMenuOpenId(null);
                            startEdit(row.id);
                          }}
                        >
                          {tr("transactions.list.actions.edit")}
                        </button>
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm text-rose-700 hover:bg-rose-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setRowMenuOpenId(null);
                            openConfirm({
                              title: tr("transactions.list.deleteConfirm.title"),
                              body: (
                                <div className="grid gap-2">
                                  <div className="text-sm text-zinc-700">
                                    {tr("transactions.list.deleteConfirm.bodyPrefix")}{" "}
                                    <span className="font-medium">
                                      {row.assetName}
                                    </span>{" "}
                                    ({row.side.toUpperCase()}) {tr("transactions.list.deleteConfirm.valueLabel")}{" "}
                                    {formatMoney(
                                      round2(
                                        toDisplayMoney(
                                          txValue(row),
                                          row.currency,
                                          row.fxRateAtTrade,
                                        ),
                                      ),
                                      currency,
                                    )}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {tr("transactions.list.deleteConfirm.cannotUndo")}
                                  </div>
                                </div>
                              ),
                              cta: tr("transactions.list.deleteConfirm.cta"),
                              onConfirm: () => remove(row.id),
                            });
                          }}
                        >
                          {tr("transactions.list.actions.delete")}
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
              <>
                {tr("transactions.pagination.showAllPrefix")} {totalItems}{" "}
                {tr("transactions.pagination.items")}
              </>
            ) : (
              <>
                {startIdx + 1}-{endIdx} / {totalItems} ({tr("transactions.pagination.page")}{" "}
                {safePage}/{totalPages})
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="w-[150px]">
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  const v = e.target.value;
                  setPageSize(
                    v === "all" ? "all" : (Number(v) as 10 | 25 | 50 | 100),
                  );
                }}
                className="h-9 rounded-2xl px-3 text-xs shadow-none"
                aria-label="Page size"
              >
                <option value="10">{tr("transactions.pagination.show")} 10</option>
                <option value="25">{tr("transactions.pagination.show")} 25</option>
                <option value="50">{tr("transactions.pagination.show")} 50</option>
                <option value="100">{tr("transactions.pagination.show")} 100</option>
                <option value="all">{tr("transactions.pagination.all")}</option>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1 || pageSize === "all"}
              className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tr("transactions.pagination.prev")}
            </button>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {pageButtons.map((item, idx) =>
                item === "gap" ? (
                  <span
                    key={`gap-${idx}`}
                    className="px-1 text-xs text-zinc-400"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={
                      item === safePage
                        ? "min-w-9 rounded-xl bg-zinc-900 px-2 py-2 text-xs font-semibold text-white"
                        : "min-w-9 rounded-xl border border-zinc-200/70 bg-white px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages || pageSize === "all"}
              className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tr("transactions.pagination.next")}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
