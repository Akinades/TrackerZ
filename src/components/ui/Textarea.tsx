import * as React from "react";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "min-h-[88px] w-full resize-y rounded-2xl border border-zinc-200/70 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-700",
        className
      )}
      {...props}
    />
  );
}
