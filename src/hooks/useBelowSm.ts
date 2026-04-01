"use client";

import * as React from "react";

/** True when viewport is below Tailwind `sm` (640px). */
export function useBelowSm(): boolean {
  const [v, setV] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setV(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return v;
}
