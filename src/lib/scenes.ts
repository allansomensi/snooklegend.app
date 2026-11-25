// The rules guide's animated tables: where each ball goes and when. The
// table is 200 × 100 (the playing surface, a 2:1 table seen from above), the
// head string at x = 50 (the head spot on it), the foot spot at (150, 50).
// Times go from 0 to 1 over the scene; each ball eases between its keys.

export const BALL_R = 3.4;
export const HEAD_SPOT = { x: 50, y: 50 };
export const FOOT_SPOT = { x: 150, y: 50 };
export const POCKETS = [
  { x: 0, y: 0 },
  { x: 100, y: -1.5 },
  { x: 200, y: 0 },
  { x: 0, y: 100 },
  { x: 100, y: 101.5 },
  { x: 200, y: 100 },
] as const;

/** [time, x, y, opacity (1 when left out)] */
export type Key = [number, number, number, number?];
export type Track = { n: number; keys: Key[] };
export type LabelKey = "headString" | "headSpot" | "footSpot" | "solids" | "stripes" | "foul" | "win" | "called" | "inHand" | "cushion" | "penalty";

export type Scene = {
  /** Seconds for one run. */
  duration: number;
  balls: Track[];
  /** The cue: it aims from `at` along `angle` (degrees), pulls back and strikes at `strike`. */
  cue?: { at: [number, number]; angle: number; from: number; strike: number };
  /** Words that show up over the table, from `from` to `to`. */
  labels?: { key: LabelKey; x: number; y: number; from: number; to: number; tone?: "gold" | "red" | "green" | "plain" }[];
  /** Pockets lit (by index in POCKETS) from `from` to `to`. */
  pockets?: { i: number; from: number; to: number; tone: "gold" | "green" }[];
  /** Sparks where a ball meets a cushion. */
  sparks?: { x: number; y: number; at: number }[];
  /** A dashed ring: the cue ball in hand, moving along its keys. */
  hand?: Key[];
  /** Show the head string and the spots. */
  marks?: boolean;
};

/** The racked balls: the 1 at the apex on the foot spot, the 8 in the middle, a solid and a stripe in the back corners. */
const RACK = [[1], [10, 2], [3, 8, 11], [12, 4, 13, 6], [5, 14, 7, 15, 9]];
export function rackPositions(): Record<number, [number, number]> {
  const out: Record<number, [number, number]> = {};
  const dx = BALL_R * 2 * 0.87;
  RACK.forEach((row, k) =>
    row.forEach((n, j) => {
      out[n] = [FOOT_SPOT.x + k * dx, FOOT_SPOT.y + (j - (row.length - 1) / 2) * BALL_R * 2.02];
    }),
  );
  return out;
}

const still = (n: number, x: number, y: number): Track => ({ n, keys: [[0, x, y]] });

/** A break: the cue ball from `from` into the rack at `hit`, then each ball to where `to` says (or into a pocket). */
function breakScene(to: Record<number, Key[]>, cueAfter: Key[], from: [number, number] = [38, 54]): Track[] {
  const rack = rackPositions();
  const hit = 0.32;
  const balls: Track[] = Object.entries(rack).map(([k, [x, y]]) => {
    const n = Number(k);
    return { n, keys: [[0, x, y], [hit, x, y], ...(to[n] ?? [])] };
  });
  balls.push({ n: 0, keys: [[0, from[0], from[1]], [0.2, from[0], from[1]], [hit, FOOT_SPOT.x - BALL_R * 2, FOOT_SPOT.y], ...cueAfter] });
  return balls;
}

/** Where the rack goes when it's broken (no ball pocketed). */
const SCATTER: Record<number, [number, number]> = {
  1: [118, 30],
  10: [176, 12],
  2: [160, 82],
  3: [132, 66],
  8: [158, 48],
  11: [190, 30],
  12: [110, 88],
  4: [186, 62],
  13: [142, 20],
  6: [172, 92],
  5: [96, 16],
  14: [194, 80],
  7: [124, 46],
  15: [168, 34],
  9: [146, 92],
};
const scatter = (except: number[] = [], at = 0.62): Record<number, Key[]> =>
  Object.fromEntries(
    Object.entries(SCATTER)
      .filter(([n]) => !except.includes(Number(n)))
      .map(([n, [x, y]]) => [n, [[at, x, y]] as Key[]]),
  );

/** Into pocket `i` by `at`, then gone. */
const pocketed = (i: number, at: number): Key[] => [
  [at, POCKETS[i].x, POCKETS[i].y, 1],
  [at + 0.03, POCKETS[i].x, POCKETS[i].y, 0],
  [1, POCKETS[i].x, POCKETS[i].y, 0],
];

export const SCENES = {
  /** Solids and stripes, and the 8 last. */
  groups: {
    duration: 7,
    balls: [
      ...[1, 2, 3, 4, 5, 6, 7].map((n, i): Track => ({ n, keys: [[0, 40 + i * 20, 30, 0], [0.06 + i * 0.05, 40 + i * 20, 30, 0], [0.1 + i * 0.05, 40 + i * 20, 30, 1]] })),
      ...[9, 10, 11, 12, 13, 14, 15].map((n, i): Track => ({ n, keys: [[0, 40 + i * 20, 72, 0], [0.32 + i * 0.05, 40 + i * 20, 72, 0], [0.36 + i * 0.05, 40 + i * 20, 72, 1]] })),
      { n: 8, keys: [[0, 100, 51, 0], [0.7, 100, 51, 0], [0.76, 100, 51, 1]] },
    ],
    labels: [
      { key: "solids", x: 100, y: 18, from: 0.1, to: 1, tone: "gold" },
      { key: "stripes", x: 100, y: 88, from: 0.36, to: 1, tone: "gold" },
    ],
  },

  /** The break: the cue ball in hand behind the head string. */
  break: {
    duration: 6,
    marks: true,
    hand: [[0, 22, 80], [0.14, 38, 54], [0.18, 38, 54]],
    cue: { at: [38, 54], angle: -2.6, from: 0.18, strike: 0.2 },
    balls: breakScene({ ...scatter([3]), 3: [[0.5, 200, 100], ...pocketed(5, 0.5).slice(1)] }, [[0.62, 120, 58]]),
    labels: [{ key: "headString", x: 50, y: 106.5, from: 0, to: 1, tone: "plain" }],
  },

  /** Brazilian: the 8 alone on the break wins. */
  eightBreak: {
    duration: 6.5,
    marks: true,
    cue: { at: [38, 54], angle: -2.6, from: 0.1, strike: 0.2 },
    balls: breakScene({ ...scatter([8]), 8: [[0.56, 200, 100], ...pocketed(5, 0.56).slice(1)] }, [[0.62, 116, 60]]),
    pockets: [{ i: 5, from: 0.56, to: 1, tone: "gold" }],
    labels: [{ key: "win", x: 100, y: 50, from: 0.62, to: 1, tone: "gold" }],
  },

  /** Brazilian: a foul gives your opponent's lowest balls. You have the solids; you miss the 2. */
  penalty: {
    duration: 7,
    cue: { at: [40, 62], angle: -30.3, from: 0.04, strike: 0.14 },
    balls: [
      { n: 0, keys: [[0, 40, 62], [0.14, 40, 62], [0.4, 140, 0 + BALL_R + 0.5], [0.52, 166, 22]] },
      still(2, 120, 30),
      still(5, 70, 84),
      { n: 10, keys: [[0, 156, 70], [0.55, 156, 70, 1], [0.7, 156, 58, 0], [1, 156, 58, 0]] },
      still(12, 90, 50),
      still(14, 178, 50),
      still(8, 120, 72),
    ],
    sparks: [{ x: 140, y: 0, at: 0.4 }],
    labels: [
      { key: "foul", x: 100, y: 52, from: 0.42, to: 0.75, tone: "red" },
      { key: "penalty", x: 156, y: 82, from: 0.58, to: 1, tone: "gold" },
    ],
  },

  /** Brazilian: the cue ball in a pocket: a ball to them, the cue ball to the head spot. */
  scratch: {
    duration: 7,
    marks: true,
    cue: { at: [126, 74], angle: 45, from: 0.04, strike: 0.14 },
    balls: [
      { n: 0, keys: [[0, 126, 74], [0.14, 126, 74], [0.28, 140, 88], [0.38, 200, 100, 1], [0.4, 200, 100, 0], [0.66, 50, 50, 0], [0.72, 50, 50, 1]] },
      { n: 4, keys: [[0, 145, 93], [0.28, 145, 93], [0.42, 160, 99]] },
      { n: 9, keys: [[0, 72, 30], [0.5, 72, 30, 1], [0.62, 72, 18, 0], [1, 72, 18, 0]] },
      still(11, 110, 22),
      still(6, 170, 40),
    ],
    pockets: [{ i: 5, from: 0.38, to: 0.6, tone: "gold" }],
    labels: [
      { key: "foul", x: 150, y: 70, from: 0.4, to: 0.66, tone: "red" },
      { key: "penalty", x: 72, y: 12, from: 0.52, to: 0.9, tone: "gold" },
      { key: "headSpot", x: 50, y: 40, from: 0.72, to: 1, tone: "plain" },
    ],
  },

  /** Brazilian: call the 8's pocket; only that one wins. */
  callPocket: {
    duration: 7,
    cue: { at: [60.7, 46.4], angle: -18.4, from: 0.3, strike: 0.4 },
    balls: [
      { n: 0, keys: [[0, 60.7, 46.4], [0.4, 60.7, 46.4], [0.52, 104.3, 31.9], [0.64, 112, 29.5]] },
      { n: 8, keys: [[0, 110, 30], [0.52, 110, 30], [0.7, 200, 0, 1], [0.73, 200, 0, 0], [1, 200, 0, 0]] },
      still(13, 150, 78),
      still(15, 60, 20),
    ],
    pockets: [{ i: 2, from: 0.08, to: 1, tone: "gold" }],
    labels: [
      { key: "called", x: 186, y: 14, from: 0.08, to: 1, tone: "gold" },
      { key: "win", x: 100, y: 78, from: 0.74, to: 1, tone: "gold" },
    ],
  },

  /** Official: a legal break makes a ball or drives four balls to a cushion. */
  breakWpa: {
    duration: 6.5,
    marks: true,
    cue: { at: [38, 54], angle: -2.6, from: 0.1, strike: 0.2 },
    balls: breakScene(
      {
        ...scatter([10, 6, 11, 14]),
        10: [[0.46, 176, BALL_R], [0.62, 168, 14]],
        6: [[0.5, 172, 100 - BALL_R], [0.64, 164, 88]],
        11: [[0.44, 200 - BALL_R, 30], [0.62, 186, 34]],
        14: [[0.52, 200 - BALL_R, 72], [0.64, 188, 78]],
      },
      [[0.62, 120, 56]],
    ),
    sparks: [
      { x: 176, y: 0, at: 0.46 },
      { x: 172, y: 100, at: 0.5 },
      { x: 200, y: 30, at: 0.44 },
      { x: 200, y: 72, at: 0.52 },
    ],
    labels: [{ key: "cushion", x: 120, y: 92, from: 0.56, to: 1, tone: "green" }],
  },

  /** Official: after any foul, ball in hand anywhere. */
  ballInHand: {
    duration: 7.5,
    cue: { at: [60, 40], angle: 33.7, from: 0.02, strike: 0.12 },
    balls: [
      { n: 0, keys: [[0, 60, 40], [0.12, 60, 40], [0.22, 96, 64], [0.3, 100, 101.5, 1], [0.32, 100, 101.5, 0], [1, 100, 101.5, 0]] },
      still(3, 92, 56),
      still(12, 150, 30),
      still(7, 170, 66),
      still(8, 130, 60),
    ],
    pockets: [{ i: 4, from: 0.3, to: 0.48, tone: "gold" }],
    hand: [[0, 30, 20, 0], [0.42, 30, 20, 0], [0.46, 30, 20, 1], [0.66, 120, 86, 1], [0.8, 140, 44, 1], [1, 140, 44, 1]],
    labels: [
      { key: "foul", x: 100, y: 84, from: 0.32, to: 0.46, tone: "red" },
      { key: "inHand", x: 140, y: 34, from: 0.5, to: 1, tone: "green" },
    ],
  },

  /** Official: the 8 in the called pocket, without a foul, wins. */
  eightCalled: {
    duration: 6.5,
    cue: { at: [81.9, 21.2], angle: 77.3, from: 0.28, strike: 0.38 },
    balls: [
      { n: 0, keys: [[0, 81.9, 21.2], [0.38, 81.9, 21.2], [0.5, 90.7, 60.15], [0.62, 91.5, 63.5]] },
      { n: 8, keys: [[0, 92, 66], [0.5, 92, 66], [0.66, 100, 101.5, 1], [0.69, 100, 101.5, 0], [1, 100, 101.5, 0]] },
      still(9, 150, 24),
      still(12, 40, 30),
    ],
    pockets: [{ i: 4, from: 0.08, to: 1, tone: "gold" }],
    labels: [
      { key: "called", x: 136, y: 90, from: 0.08, to: 1, tone: "gold" },
      { key: "win", x: 100, y: 40, from: 0.7, to: 1, tone: "gold" },
    ],
  },
} satisfies Record<string, Scene>;

export type SceneKey = keyof typeof SCENES;

/** Which scene goes with which rule: [part, rule] in the rules files (the same in every language). */
export const SCENE_AT: Record<"brazilian" | "official", { at: [number, number]; scene: SceneKey }[]> = {
  brazilian: [
    { at: [0, 1], scene: "groups" },
    { at: [1, 0], scene: "break" },
    { at: [1, 1], scene: "eightBreak" },
    { at: [2, 0], scene: "penalty" },
    { at: [2, 3], scene: "scratch" },
    { at: [3, 0], scene: "callPocket" },
  ],
  official: [
    { at: [1, 0], scene: "breakWpa" },
    { at: [3, 0], scene: "ballInHand" },
    { at: [4, 0], scene: "eightCalled" },
  ],
};

/** A ball's place at time `t` (linear between keys; for tests and the still frame). */
export function placeAt(keys: Key[], t: number): Key {
  let prev = keys[0];
  for (const k of keys) {
    if (k[0] > t) {
      const span = k[0] - prev[0] || 1;
      const f = (t - prev[0]) / span;
      return [t, prev[1] + (k[1] - prev[1]) * f, prev[2] + (k[2] - prev[2]) * f, (prev[3] ?? 1) + ((k[3] ?? 1) - (prev[3] ?? 1)) * f];
    }
    prev = k;
  }
  return [t, prev[1], prev[2], prev[3] ?? 1];
}
