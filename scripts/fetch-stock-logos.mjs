import fs from "node:fs/promises";
import path from "node:path";

/**
 * Downloads stock logos and stores them under:
 *   public/asset-icons/stocks/{symbol}.svg
 *
 * Source strategy:
 * - Use the CC0 SVG pack at `gilbarbara/logos` (GitHub raw).
 * - This runs manually during development; the app serves files locally.
 *
 * After downloading, it regenerates:
 *   src/lib/stockIcons.ts
 * so the app knows which symbols have icons (and their extension).
 */

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "asset-icons", "stocks");
const MAP_FILE = path.join(ROOT, "src", "lib", "stockIcons.ts");

// US stocks: symbol -> gilbarbara/logos slug (without extension)
// Prefer "*-icon.svg" when available.
const SLUG_BY_SYMBOL = {
  AAPL: "apple",
  MSFT: "microsoft",
  NVDA: "nvidia",
  TSLA: "tesla",
  AMZN: "amazon",
  GOOGL: "google",
  META: "meta",
  AMD: "amd",
  INTC: "intel",
  NFLX: "netflix",
  ORCL: "oracle",
  IBM: "ibm",
  JPM: "jpmorgan",
  BAC: "bankofamerica",
  DIS: "disney",
  V: "visa",
  MA: "mastercard",
  KO: "cocacola",
  PEP: "pepsi",
  CSCO: "cisco",
  PYPL: "paypal",
  ADBE: "adobe",
  ABNB: "airbnb",
};

async function downloadSvg(symbol, slug) {
  const outPath = path.join(OUT_DIR, `${symbol.toLowerCase()}.svg`);
  try {
    await fs.access(outPath);
    return { ok: true, skipped: true };
  } catch {
    // continue
  }

  const base = "https://raw.githubusercontent.com/gilbarbara/logos/main/logos";
  const urls = [
    `${base}/${encodeURIComponent(slug)}-icon.svg`,
    `${base}/${encodeURIComponent(slug)}.svg`,
  ];

  let last = null;
  for (const url of urls) {
    const res = await fetch(url, { redirect: "follow" }).catch((e) => {
      last = e;
      return null;
    });
    if (!res || !res.ok) {
      last = res ? res.status : last;
      continue;
    }
    const text = await res.text();
    if (!text || text.length < 200) {
      last = "too_small";
      continue;
    }
    await fs.writeFile(outPath, text, "utf8");
    return { ok: true, skipped: false, url };
  }

  return { ok: false, status: last ?? "failed" };
}

async function regenMapFile() {
  const entries = await fs.readdir(OUT_DIR).catch(() => []);
  const out = {};
  for (const name of entries) {
    const m = name.match(/^([a-z0-9.\-]+)\.(svg|png)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const ext = m[2].toLowerCase();
    if (ext === "svg" || ext === "png") out[key] = ext;
  }

  const keys = Object.keys(out).sort((a, b) => a.localeCompare(b));
  const lines = [
    "export const STOCK_ICON_FILES: Record<string, \"svg\" | \"png\"> = {",
    ...keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(out[k])},`),
    "} as const;",
    "",
  ];
  await fs.writeFile(MAP_FILE, lines.join("\n"), "utf8");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const [sym, slug] of Object.entries(SLUG_BY_SYMBOL)) {
    try {
      const r = await downloadSvg(sym, slug);
      if (r.ok) {
        ok += 1;
        skipped += r.skipped ? 1 : 0;
        // eslint-disable-next-line no-console
        console.log(`${r.skipped ? "↺" : "✓"} ${sym} (${slug})`);
      } else {
        fail += 1;
        // eslint-disable-next-line no-console
        console.warn(`! ${sym} (${slug}) failed`, r.status);
      }
    } catch (e) {
      fail += 1;
      // eslint-disable-next-line no-console
      console.warn(`! ${sym} (${slug}) failed`, e?.message ?? e);
    }
  }

  await regenMapFile();
  // eslint-disable-next-line no-console
  console.log(`\nDone. ok=${ok} (skipped_existing=${skipped}) failed=${fail}`);
  // eslint-disable-next-line no-console
  console.log(`- icons: ${OUT_DIR}`);
  // eslint-disable-next-line no-console
  console.log(`- map:   ${MAP_FILE}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

