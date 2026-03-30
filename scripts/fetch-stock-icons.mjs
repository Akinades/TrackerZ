import fs from "node:fs/promises";
import path from "node:path";

/**
 * Fetch brand SVGs from Simple Icons and wrap
 * them into our 64x64 rounded-square style.
 *
 * Notes:
 * - This runs at dev time (one-time fetch), not runtime.
 * - We keep icons in `public/asset-icons/stocks/*.svg`.
 */

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "asset-icons", "stocks");

// Stock symbol -> simple-icons slug
// Extend this table as needed.
const MAP = {
  AAPL: "apple",
  MSFT: "microsoft",
  NVDA: "nvidia",
  META: "meta",
  GOOGL: "google",
  TSLA: "tesla",
  AMZN: "amazon",
  NFLX: "netflix",
  ORCL: "oracle",
  IBM: "ibm",
  JPM: "jpmorganchase",
  BAC: "bankofamerica",
  DIS: "thewaltdisneycompany",
  V: "visa",
  MA: "mastercard",
  KO: "cocacola",
  PEP: "pepsi",
  CSCO: "cisco",
  PYPL: "paypal",
  ADBE: "adobe",
  ABNB: "airbnb",
};

function stripSvgOuter(svgText) {
  const m = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return (m ? m[1] : svgText).trim();
}

function toTitle(slug) {
  return slug
    .replace(/(^|[-_])(\w)/g, (_, p1, p2) => (p1 ? " " : "") + p2.toUpperCase())
    .trim();
}

function wrap64({ inner, title, hex }) {
  const fill = hex ? `#${hex.replace("#", "")}` : "#111827";
  // Simple-icons paths are optimized for 24x24 viewBox.
  // Center them in a 40x40 area inside 64x64 with padding.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(
    title,
  )}">
  <rect width="64" height="64" rx="12" fill="#ffffff"/>
  <g transform="translate(12 12) scale(1.6666667)">
    <g fill="${fill}">
      ${inner}
    </g>
  </g>
</svg>
`;
}

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function fetchSimpleIcon(slug) {
  const url = `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${encodeURIComponent(
    slug,
  )}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${slug}`);
  const svg = await res.text();
  // Try to read brand color from hex attribute if present.
  const hexMatch = svg.match(/hex=["']([^"']+)["']/i);
  return { svg, hex: hexMatch?.[1] ?? null };
}

function monogramColor(symbol) {
  // Deterministic nice-ish color from symbol.
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return { hue, bg: `hsl(${hue} 85% 92%)`, fg: `hsl(${hue} 65% 28%)` };
}

function makeMonogramSvg(symbol) {
  const s = String(symbol || "?").trim().toUpperCase();
  const text = (s.length <= 2 ? s : s.slice(0, 3)).replace(/[^A-Z0-9.]/g, "") || "?";
  const { bg, fg } = monogramColor(text);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(
    text,
  )}">
  <rect width="64" height="64" rx="12" fill="#ffffff"/>
  <rect x="12" y="12" width="40" height="40" rx="12" fill="${bg}"/>
  <text x="32" y="38" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="${
    text.length === 1 ? 22 : text.length === 2 ? 18 : 14
  }" font-weight="700" fill="${fg}">${escapeXml(text)}</text>
</svg>
`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const entries = Object.entries(MAP);
  let ok = 0;
  let skipped = 0;

  for (const [symbol, slug] of entries) {
    const outName = `${symbol.toLowerCase()}.svg`;
    const outPath = path.join(OUT_DIR, outName);
    try {
      await fs.access(outPath);
      skipped += 1;
      continue;
    } catch {
      // not exists -> continue
    }

    try {
      const { svg, hex } = await fetchSimpleIcon(slug);
      const inner = stripSvgOuter(svg)
        // Remove any existing fills; we control fill via wrapper.
        .replaceAll(/fill=["'][^"']*["']/gi, "")
        .replaceAll(/<title>[\s\S]*?<\/title>/gi, "")
        .replaceAll(/<desc>[\s\S]*?<\/desc>/gi, "");

      const wrapped = wrap64({ inner, title: toTitle(slug), hex });
      await fs.writeFile(outPath, wrapped, "utf8");
      ok += 1;
      // eslint-disable-next-line no-console
      console.log(`✓ ${symbol} -> ${outName}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`! ${symbol} (${slug}) failed: ${e?.message ?? e}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\nDone. wrote=${ok} skipped_existing=${skipped} out=${OUT_DIR}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

