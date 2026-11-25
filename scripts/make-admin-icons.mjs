// The staff portal's app icons (for phones: the home screen, the app
// switcher), from its favicon, src/app/admin/icon.svg:
//
//     node scripts/make-admin-icons.mjs
//
// Writes public/admin-icons/: icon-192.png and icon-512.png (the ball on the
// portal's felt), maskable-512.png (with the safe margin
// Android's round and squircle masks need) and apple-touch-icon.png (180).
import { readFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../src/app/admin/icon.svg", import.meta.url));
const out = (f) => new URL(`../public/admin-icons/${f}`, import.meta.url).pathname;
// The portal's felt green: the black ball would vanish on its dark background.
const BG = "#1d6b48";

async function icon(size, ball, file) {
  const art = await sharp(svg, { density: 1200 }).resize(ball, ball).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: art, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(out(file));
}

await icon(192, 168, "icon-192.png");
await icon(512, 448, "icon-512.png");
// Maskable: the important part within the middle 80%.
await icon(512, 330, "maskable-512.png");
await icon(180, 150, "apple-touch-icon.png");
console.log("ok");
