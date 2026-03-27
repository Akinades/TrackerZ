/** กัน effect รันซ้ำ (เช่น Strict Mode) เรียก register สองครั้ง */
let inFlight: Promise<void> | null = null;

export function runRegisterCompleteOnce(run: () => Promise<void>): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      await run();
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
