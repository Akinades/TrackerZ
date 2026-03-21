import * as React from "react";
import { AssetIcon } from "@/components/ui/AssetIcon";
import type { AssetType } from "@/types/transactions";

type Props = {
  rank: number;
  assetName: string;
  assetType: AssetType;
  amountLine: React.ReactNode;
  amountClassName: string;
  details: React.ReactNode;
};

export function DashboardTopFiveRow({
  rank,
  assetName,
  assetType,
  amountLine,
  amountClassName,
  details
}: Props) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-zinc-100 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold tabular-nums text-white">
        {rank}
      </span>
      <AssetIcon symbol={assetName} type={assetType} className="h-8 w-8 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-900">{assetName}</div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-snug text-zinc-500">
          {details}
        </div>
      </div>
      <div
        className={[
          "shrink-0 text-right text-sm font-semibold tabular-nums sm:max-w-[42%] sm:text-[15px]",
          amountClassName
        ].join(" ")}
      >
        {amountLine}
      </div>
    </div>
  );
}
