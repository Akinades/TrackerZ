import * as React from "react";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  );
}

