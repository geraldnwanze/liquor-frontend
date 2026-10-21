// Generates the PWA icon set from one SVG glyph. Run: npm run icons
// Uses `sharp`, which ships with Next.js. Outputs are committed, so this only needs re-running when the artwork changes.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const BURGUNDY = "#5a1424";
const GOLD = "#c9a45c";

const glyph = `
  <g fill="${GOLD}">
    <rect x="476" y="210" width="72" height="60" rx="10"/>
    <path d="M470 280h84v110c0 50 78 70 78 150v270a50 50 0 0 1-50 50H442a50 50 0 0 1-50-50V540c0-80 78-100 78-150z"/>
  </g>
  <rect x="432" y="610" width="160" height="170" rx="10" fill="${BURGUNDY}"/>
  <rect x="448" y="626" width="128" height="138" rx="6" fill="none" stroke="${GOLD}" stroke-width="6"/>`;

const svg = (rx) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="${rx}" fill="${BURGUNDY}"/>${glyph}</svg>`;

const out = new URL("../public/icons/", import.meta.url).pathname;
const app = new URL("../app/", import.meta.url).pathname;
await mkdir(out, { recursive: true });

const render = (rx, size, file) => sharp(Buffer.from(svg(rx))).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

// "any" icons have rounded corners; maskable and Apple icons are full-bleed (the OS applies its own mask).
await render(224, 192, `${out}icon-192.png`);
await render(224, 512, `${out}icon-512.png`);
await render(0, 512, `${out}icon-maskable-512.png`);
await render(0, 180, `${app}apple-icon.png`);
await render(224, 512, `${app}icon.png`);
await writeFile(`${out}glyph.svg`, svg(224));
console.log("Icons written.");
