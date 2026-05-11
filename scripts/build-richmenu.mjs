// Generate Rich Menu PNG (2500x1686) — Font Awesome solid icons.
//   node scripts/build-richmenu.mjs

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import {
  faCarSide,
  faBolt,
  faRetweet,
  faCalculator,
  faShop,
  faHeadset,
  faWrench,
  faShieldHalved,
  faTriangleExclamation,
  faBell,
  faPhoneVolume,
  faCarRear,
} from "@fortawesome/free-solid-svg-icons";

const W = 2500;
const H = 1686;
const CELL_W = (W - 16) / 3;
const CELL_H = (H - 16) / 2;
const CELL_GAP = 8;

// Sena Green Auto brand palette (จาก senagreenauto.co.th)
const GREEN = "#00A659";      // primary brand green
const GREEN_DARK = "#018f4b"; // darker shade from site
const ACCENT = "#ea580c";     // orange for "ติดต่อ" CTA

function faIconSvg(fa, size) {
  const [w, h, , , pathData] = fa.icon;
  return `<svg x="0" y="0" width="${size}" height="${size}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    <path fill="white" d="${pathData}"/>
  </svg>`;
}

function cellSvg({ idx, color, icon, label }) {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  const x = col * (CELL_W + CELL_GAP) + CELL_GAP;
  const y = row * (CELL_H + CELL_GAP) + CELL_GAP;
  const cx = x + CELL_W / 2;
  const iconSize = 380;
  const iconX = cx - iconSize / 2;
  const iconY = y + CELL_H / 2 - iconSize / 2 - 80;
  return `
    <rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" fill="${color}"/>
    <svg x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="0 0 ${icon.icon[0]} ${icon.icon[1]}" preserveAspectRatio="xMidYMid meet">
      <path fill="white" d="${icon.icon[4]}"/>
    </svg>
    <text x="${cx}" y="${y + CELL_H - 90}" fill="white" font-family="Sukhumvit Set, 'SukhumvitSet', system-ui, sans-serif" font-size="90" font-weight="600" text-anchor="middle">${label}</text>
  `;
}

function buildSvg(cells) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  ${cells.map(cellSvg).join("\n")}
</svg>`;
}

const PRESALE = [
  { idx: 0, color: GREEN, icon: faCarSide,             label: "ดูรถ EV" },
  { idx: 1, color: GREEN, icon: faBolt,                label: "ทดลองขับ" },
  { idx: 2, color: GREEN, icon: faRetweet,             label: "Trade-in" },
  { idx: 3, color: GREEN, icon: faCalculator,          label: "สินเชื่อ" },
  { idx: 4, color: GREEN, icon: faShop,                label: "โชว์รูม" },
  { idx: 5, color: ACCENT, icon: faHeadset,            label: "คุยกับเซลส์" },
];

const OWNER = [
  { idx: 0, color: GREEN, icon: faCarRear,             label: "รถของฉัน" },
  { idx: 1, color: GREEN, icon: faWrench,              label: "จองเซอร์วิส" },
  { idx: 2, color: GREEN, icon: faShieldHalved,        label: "ประกัน/ร้าน" },
  { idx: 3, color: GREEN_DARK, icon: faTriangleExclamation, label: "SOS" },
  { idx: 4, color: GREEN, icon: faBell,                label: "แจ้งเตือน" },
  { idx: 5, color: ACCENT, icon: faPhoneVolume,        label: "ติดต่อศูนย์" },
];

// silence unused-import for faIconSvg helper if not directly used elsewhere
void faIconSvg;

async function render(cells, outPath) {
  const svg = buildSvg(cells);
  await writeFile(outPath.replace(".png", ".svg"), svg);
  await sharp(Buffer.from(svg), { density: 300 })
    .png()
    .resize(W, H)
    .toFile(outPath);
  console.log("wrote", outPath);
}

await render(PRESALE, "scripts/richmenu-presale-v4.png");
await render(OWNER, "scripts/richmenu-owner-v4.png");
