"use client";

import * as React from "react";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function IconBadge({
  icon: Icon,
  tone = "neutral",
  className
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "emerald" | "rose";
  className?: string;
}) {
  const tones: Record<typeof tone, string> = {
    neutral: "border-zinc-200/70 bg-zinc-50 text-zinc-700",
    emerald: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200/70 bg-rose-50 text-rose-700"
  };

  return (
    <span
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded-2xl border shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)]",
        tones[tone],
        className
      )}
      aria-hidden="true"
    >
      <Icon className="h-1/2 w-1/2 min-h-3.5 min-w-3.5 max-h-7 max-w-7" />
    </span>
  );
}

