"use client";

import * as React from "react";
import { useI18n } from "@/components/shared/I18nProvider";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-zinc-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div
          className={cx(
            "w-full max-w-2xl rounded-3xl border border-zinc-200/70 bg-white p-5 text-zinc-900 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.6)] dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-100",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="text-base font-semibold">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/50"
            >
              {t("common.close")}
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

