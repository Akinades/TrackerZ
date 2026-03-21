import { formatNumber2 } from "@/lib/format";

export function formatDashboardPct(n: number) {
  return formatNumber2(n, "th-TH");
}
