import * as React from "react";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "h-11 w-full rounded-2xl border border-zinc-200/70 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-zinc-300",
        className
      )}
      {...props}
    />
  );
}

