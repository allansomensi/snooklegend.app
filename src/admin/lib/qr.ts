// A QR code, made here: what an authenticator app scans to add the staff
// portal's two-step verification (an `otpauth://` address of about 120
// characters). Byte mode, error correction level M, versions 1 to 10 (up
// to 213 bytes), the mask with the lowest penalty, as ISO/IEC 18004 has
// it. No library: the portal's pages run only their own scripts.

/** Error-correction codewords per block and blocks, level M, versions 1–10. */
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
/** Level M's two format bits. */
const LEVEL_M = 0;
const MAX_VERSION = 10;

export interface Qr {
  /** Modules per side (without the quiet zone). */
  size: number;
  /** Rows of modules, true = dark. */
  modules: boolean[][];
  version: number;
  mask: number;
}

const bit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

/** Data modules of a version (all but the function patterns). */
function rawModules(ver: number): number {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}

const dataCodewords = (ver: number) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * BLOCKS[ver];

/** Multiplication in GF(2^8) modulo x^8 + x^4 + x^3 + x^2 + 1. */
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const out = new Array<number>(degree - 1).fill(0);
  out.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < out.length; j++) {
      out[j] = gfMul(out[j], root);
      if (j + 1 < out.length) out[j] ^= out[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return out;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const out = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (out.shift() as number);
    out.push(0);
    divisor.forEach((c, i) => (out[i] ^= gfMul(c, factor)));
  }
  return out;
}

/** The data codewords of `bytes` for a version: mode, count, data, padding. */
function encodeData(bytes: Uint8Array, ver: number): number[] {
  const bits: number[] = [];
  const put = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4); // byte mode
  put(bytes.length, ver <= 9 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));
  const capacity = dataCodewords(ver) * 8;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0xec; out.length < dataCodewords(ver); pad ^= 0xec ^ 0x11) out.push(pad);
  return out;
}

/** The data split in blocks, each with its error correction, interleaved. */
function withEcc(data: number[], ver: number): number[] {
  const blocks = BLOCKS[ver];
  const eccLen = ECC_PER_BLOCK[ver];
  const raw = Math.floor(rawModules(ver) / 8);
  const short = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const divisor = rsDivisor(eccLen);
  const all: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < short ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < short) dat.push(0);
    all.push(dat.concat(ecc));
  }
  const out: number[] = [];
  for (let i = 0; i < all[0].length; i++) {
    all.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= short) out.push(block[i]);
    });
  }
  return out;
}

function alignmentPositions(ver: number, size: number): number[] {
  if (ver === 1) return [];
  const count = Math.floor(ver / 7) + 2;
  const step = Math.ceil((ver * 4 + 4) / (count * 2 - 2)) * 2;
  const out = [6];
  for (let pos = size - 7; out.length < count; pos -= step) out.splice(1, 0, pos);
  return out;
}

class Grid {
  size: number;
  modules: boolean[][];
  fn: boolean[][];
  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.fn = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }
  set(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.fn[y][x] = true;
  }
}

function drawFunctionPatterns(g: Grid, ver: number) {
  const n = g.size;
  for (let i = 0; i < n; i++) {
    g.set(6, i, i % 2 === 0);
    g.set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < n && y >= 0 && y < n) g.set(x, y, d !== 2 && d !== 4);
      }
    }
  }
  const pos = alignmentPositions(ver, n);
  const last = pos.length - 1;
  pos.forEach((px, i) =>
    pos.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) g.set(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }),
  );
  drawFormat(g, 0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = n - 11 + (i % 3);
      const b = Math.floor(i / 3);
      g.set(a, b, bit(bits, i));
      g.set(b, a, bit(bits, i));
    }
  }
}

/** The format information (level M and the mask), both copies. */
function drawFormat(g: Grid, mask: number) {
  const n = g.size;
  const data = (LEVEL_M << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) g.set(8, i, bit(bits, i));
  g.set(8, 7, bit(bits, 6));
  g.set(8, 8, bit(bits, 7));
  g.set(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i++) g.set(14 - i, 8, bit(bits, i));
  for (let i = 0; i < 8; i++) g.set(n - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i++) g.set(8, n - 15 + i, bit(bits, i));
  g.set(8, n - 8, true);
}

function drawCodewords(g: Grid, codewords: number[]) {
  const n = g.size;
  let i = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? n - 1 - vert : vert;
        if (!g.fn[y][x] && i < codewords.length * 8) {
          g.modules[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
    }
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(g: Grid, mask: number) {
  for (let y = 0; y < g.size; y++) {
    for (let x = 0; x < g.size; x++) {
      if (!g.fn[y][x] && MASKS[mask](x, y)) g.modules[y][x] = !g.modules[y][x];
    }
  }
}

/** The standard penalty: runs, 2×2 blocks, finder-like patterns, balance. */
export function penalty(m: boolean[][]): number {
  const n = m.length;
  let score = 0;
  const lines: boolean[][] = [];
  for (let i = 0; i < n; i++) {
    lines.push(m[i]);
    lines.push(m.map((row) => row[i]));
  }
  const finder1 = [true, false, true, true, true, false, true, false, false, false, false];
  const finder2 = [false, false, false, false, true, false, true, true, true, false, true];
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && line[i] === line[i - 1]) {
        run++;
      } else {
        if (run >= 5) score += 3 + run - 5;
        run = 1;
      }
    }
    for (let i = 0; i + 11 <= n; i++) {
      const same = (p: boolean[]) => p.every((v, k) => line[i + k] === v);
      if (same(finder1) || same(finder2)) score += 40;
    }
  }
  for (let y = 0; y + 1 < n; y++) {
    for (let x = 0; x + 1 < n; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  }
  const dark = m.reduce((a, row) => a + row.filter(Boolean).length, 0);
  const total = n * n;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

/** The QR code of `text` (UTF-8), with the given mask or the best one. */
export function qrCode(text: string, forceMask?: number): Qr {
  const bytes = new TextEncoder().encode(text);
  let ver = 1;
  while (ver <= MAX_VERSION && 4 + (ver <= 9 ? 8 : 16) + bytes.length * 8 > dataCodewords(ver) * 8) ver++;
  if (ver > MAX_VERSION) throw new Error("Too long for a QR code here");
  const codewords = withEcc(encodeData(bytes, ver), ver);
  const size = ver * 4 + 17;
  const make = (mask: number) => {
    const g = new Grid(size);
    drawFunctionPatterns(g, ver);
    drawCodewords(g, codewords);
    applyMask(g, mask);
    drawFormat(g, mask);
    return g;
  };
  let mask = forceMask ?? 0;
  if (forceMask === undefined) {
    let best = Infinity;
    for (let k = 0; k < 8; k++) {
      const p = penalty(make(k).modules);
      if (p < best) {
        best = p;
        mask = k;
      }
    }
  }
  return { size, modules: make(mask).modules, version: ver, mask };
}

/** The dark modules as one SVG path (unit squares), for a viewBox of
 * `size + 2 * border`. */
export function qrPath(qr: Qr, border = 4): string {
  const parts: string[] = [];
  qr.modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x + border} ${y + border}h1v1h-1z`);
    }),
  );
  return parts.join("");
}
