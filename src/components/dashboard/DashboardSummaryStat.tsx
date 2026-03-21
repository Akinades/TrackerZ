import * as React from "react";
import type { IconType } from "@/lib/icons";

type Props = {
  label: string;
  hint?: string;
  value: React.ReactNode;
  valueClassName?: string;
  emphasize?: boolean;
  icon?: IconType;
  iconClassName?: string;
  pctLine?: React.ReactNode;
  pctClassName?: string;
};

export function DashboardSummaryStat({
  label,
  hint,
  value,
  valueClassName,
  emphasize,
  icon: Icon,
  iconClassName,
  pctLine,
  pctClassName
}: Props) {
  const sizeClass = emphasize ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";
  const textColor = valueClassName ?? "text-zinc-900";

  return (
    <div
      className={[
        "min-w-0 rounded-2xl border px-3 py-3 sm:px-4 sm:py-3.5",
        emphasize ? "border-emerald-200/60 bg-emerald-50/25" : "border-zinc-100 bg-white"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
          {hint ? <div className="mt-0.5 text-[10px] leading-snug text-zinc-400">{hint}</div> : null}
        </div>
        {Icon ? (
          <Icon
            className={["h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]", iconClassName ?? "text-zinc-400"].join(
              " "
            )}
            aria-hidden
          />
        ) : null}
      </div>
      <div className={["mt-1.5 font-semibold tabular-nums", sizeClass, textColor].join(" ")}>{value}</div>
      {pctLine != null ? (
        <div className={["mt-1 text-xs font-medium tabular-nums", pctClassName ?? "text-zinc-500"].join(" ")}>
          {pctLine}
        </div>
      ) : null}
    </div>
  );
}
