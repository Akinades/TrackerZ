/**
 * แบ่ง public/support/Support.png (แนวนอน 3 ช่อง) เป็น 3 ไฟล์ PNG
 * รัน: npm run split-support
 */
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public", "support", "Support.png");
const outDir = path.join(root, "public", "support");

if (!fs.existsSync(input)) {
  console.error("ไม่พบไฟล์:", input);
  process.exit(1);
}

const meta = await sharp(input).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
if (w < 3 || h < 1) {
  console.error("ขนาดรูปไม่ถูกต้อง:", w, h);
  process.exit(1);
}

const baseW = Math.floor(w / 3);
const outputs = [
  { file: "support-tier-tea.png", index: 0 },
  { file: "support-tier-wine.png", index: 1 },
  { file: "support-tier-weapon.png", index: 2 },
];

for (const { file, index } of outputs) {
  const left = index * baseW;
  const width = index === 2 ? w - left : baseW;
  const outPath = path.join(outDir, file);
  await sharp(input)
    .extract({ left, top: 0, width, height: h })
    .png()
    .toFile(outPath);
  console.log("เขียน:", outPath, `(${width}×${h})`);
}

console.log("เสร็จแล้ว — 3 ไฟล์ใน public/support/");
