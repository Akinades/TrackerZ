import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { TransactionsPageModel } from "@/hooks/useTransactionsPage";
import * as React from "react";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { m: TransactionsPageModel };

export function TransactionsFiltersCard({ m }: Props) {
  const { t } = useI18n();
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
          <div className="text-sm font-medium">{t("transactions.filters.title")}</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="w-full sm:w-[220px]">
              <div className="text-xs text-zinc-400">{t("transactions.filters.presetLabel")}</div>
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
                <option value="">{t("transactions.filters.choosePreset")}</option>
                <option value="today">{t("datePreset.today")}</option>
                <option value="yesterday">{t("datePreset.yesterday")}</option>
                <option value="last7">{t("transactions.filters.last7")}</option>
                <option value="last30">{t("transactions.filters.last30")}</option>
                <option value="last90">{t("transactions.filters.last90")}</option>
                <option value="ytd">{t("datePreset.ytd")}</option>
                <option value="last365">{t("transactions.filters.last365")}</option>
                <option value="all">{t("datePreset.all")}</option>
              </Select>
            </div>
            <div className="w-full sm:w-[190px]">
              <div className="text-xs text-zinc-400">{t("transactions.filters.from")}</div>
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
              <div className="text-xs text-zinc-400">{t("transactions.filters.to")}</div>
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
              ? `${t("transactions.filters.dataRangePrefix")} ${oldest.toLocaleString()} ${t("transactions.filters.dataRangeTo")} ${newest.toLocaleString()}`
              : t("transactions.filters.noData")}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:self-center">
          <Button
            onClick={startAdd}
            disabled={!hydrated}
            className="h-11 rounded-2xl px-4 py-0"
          >
            {t("transactions.filters.add")}
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
            {t("transactions.filters.delete")}
          </Button>
        </div>
      </div>
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("transactions.deleteModal.title")}
        className="max-w-lg"
      >
        <div className="grid gap-4">
          <div className="text-sm text-zinc-700">
            {t("transactions.deleteModal.desc")}
          </div>
          <Select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}>
            <option value="__all__">
              {t("transactions.deleteModal.deleteAllPrefix")} ({txs.length}{" "}
              {t("transactions.deleteModal.items")})
            </option>
            {assetOptions.map((symbol) => {
              const count = txs.filter((t) => t.assetName === symbol).length;
              return (
                <option key={symbol} value={symbol}>
                  {t("transactions.deleteModal.deleteOnlyPrefix")} {symbol} (
                  {count} {t("transactions.deleteModal.items")})
                </option>
              );
            })}
          </Select>
          <div className="text-xs text-zinc-500">
            {t("transactions.deleteModal.cannotUndo")}
          </div>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                void removeAll(selectedAsset === "__all__" ? undefined : selectedAsset);
              }}
            >
              {t("transactions.deleteModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
