"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/components/shared/I18nProvider";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const { t } = useI18n();

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cx("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4 shrink-0" aria-hidden /> : <Eye className="h-4 w-4 shrink-0" aria-hidden />}
      </button>
    </div>
  );
}
