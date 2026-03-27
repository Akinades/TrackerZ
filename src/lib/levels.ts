export const LEVELS = [
  {
    key: "seed",
    label: "ผู้ฝึกตน",
    icon: "🙂",
    iconFile: "/levels/seed.png",
    minReturnPct: -999,
    maxReturnPct: 1.99,
    minTransactions: 0,
    description: "เริ่มต้นใช้งาน",
  },
  {
    key: "scout",
    label: "จอมยุทธ์",
    icon: "🧭",
    iconFile: "/levels/scout.png",
    minReturnPct: 2,
    maxReturnPct: 7.99,
    minTransactions: 10,
    description: "เริ่มมีวินัย",
  },
  {
    key: "builder",
    label: "เซียน",
    icon: "🛠️",
    iconFile: "/levels/builder.png",
    minReturnPct: 8,
    maxReturnPct: 14.99,
    minTransactions: 25,
    description: "วิเคราะห์เป็นระบบ",
  },
  {
    key: "strategist",
    label: "มหาเซียน",
    icon: "🛡️",
    iconFile: "/levels/strategist.png",
    minReturnPct: 15,
    maxReturnPct: 24.99,
    minTransactions: 50,
    description: "วางแผนแม่นยำ",
  },
  {
    key: "master",
    label: "ปรมาจารย์",
    icon: "🧙",
    iconFile: "/levels/master.png",
    minReturnPct: 25,
    maxReturnPct: null,
    minTransactions: 80,
    description: "เชี่ยวชาญระดับสูง",
  },
] as const;

export type LevelRule = (typeof LEVELS)[number];

export function getLevelByPerformance(
  totalReturnPct: number | null | undefined,
  txCount: number,
): LevelRule {
  const tx = Number.isFinite(txCount) ? Math.max(0, Math.floor(txCount)) : 0;
  const pct =
    typeof totalReturnPct === "number" && Number.isFinite(totalReturnPct)
      ? totalReturnPct
      : null;
  if (pct == null) return LEVELS[0];

  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i]!;
    const withinMax = level.maxReturnPct == null || pct <= level.maxReturnPct;
    if (pct >= level.minReturnPct && withinMax) {
      idx = i;
      break;
    }
  }

  while (idx > 0 && tx < LEVELS[idx]!.minTransactions) {
    idx -= 1;
  }
  return LEVELS[idx]!;
}

export function formatLevelRange(level: LevelRule): string {
  if (level.maxReturnPct == null) return `กำไร ${level.minReturnPct}% ขึ้นไป`;
  return `กำไร ${level.minReturnPct}% - ${level.maxReturnPct}%`;
}

export function formatLevelTxRequirement(level: LevelRule): string {
  return `ขั้นต่ำ ${level.minTransactions} รายการ`;
}
