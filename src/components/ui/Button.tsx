import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<Variant, string> = {
    primary:
      "bg-zinc-900 text-white shadow-[0_10px_25px_-18px_rgba(0,0,0,0.45)] hover:bg-zinc-800",
    secondary:
      "border border-zinc-200/70 bg-white text-zinc-900 hover:bg-zinc-50 shadow-[0_10px_25px_-20px_rgba(0,0,0,0.25)]",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100"
  };

  return (
    <button
      className={cx(base, variants[variant], className)}
      type="button"
      {...props}
    />
  );
}

