/**
 * serviceGeometry — the shape of the desktop / tablet service cluster.
 *
 * The cluster is authored on a fixed DESIGN CANVAS of 1056 × 632 px (the reference design, cropped to its content),
 * and the whole canvas is scaled to fit its box (see ServiceCluster). Every number below is in design px.
 *
 * The four glass cards are drawn in perspective in the reference (tilted, one edge nearer than the other), so each is a
 * flat HTML card whose four corners are pinned to the reference's quad with a single CSS `matrix3d` — the exact
 * homography, not an approximation with rotateY / rotateZ. Text inside is authored flat and is skewed by the same matrix.
 *
 * Coordinates were measured from the reference; SRC_* are its original pixel coordinates (the canvas is that image
 * minus this offset).
 */
export const STAGE = { w: 1060, h: 632 }
const OX = 158, OY = 42

/* ── homography: unit rect (0,0)-(w,h) → quad [TL, TR, BR, BL] ── */
function solve(A, b) {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r
    ;[M[i], M[p]] = [M[p], M[i]]
    for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c] }
  }
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i] }
  return x
}
function homography(w, h, q) {
  const src = [[0, 0], [w, 0], [w, h], [0, h]], A = [], b = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [X, Y] = q[i]
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]); b.push(X)
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]); b.push(Y)
  }
  const s = solve(A, b)
  return [[s[0], s[1], s[2]], [s[3], s[4], s[5]], [s[6], s[7], 1]]
}
function invert(m) {
  const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2]
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
  return [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ]
}
const map = (m, x, y) => { const d = m[2][0] * x + m[2][1] * y + m[2][2]; return [(m[0][0] * x + m[0][1] * y + m[0][2]) / d, (m[1][0] * x + m[1][1] * y + m[1][2]) / d] }
const css = (m) => `matrix3d(${m[0][0]},${m[1][0]},0,${m[2][0]},${m[0][1]},${m[1][1]},0,${m[2][1]},0,0,1,0,${m[0][2]},${m[1][2]},0,1)`

/* ── the four cards: flat size and quad (left, featured, right1, right2) ── */
const src = (pts) => pts.map(([x, y]) => [x - OX, y - OY])
const DEFS = {
  // the featured active card
  featured: { w: 362, h: 412, quad: src([[455, 199.8], [810.8, 189], [863.6, 609.5], [493.6, 603.6]]) },
  // 1 waiting card on the left
  left: { w: 215, h: 195, quad: src([[335, 322.5], [550, 315.6], [568, 515.5], [353, 517.5]]) },
  // exactly 2 waiting cards on the right (beautiful, spacious perspective layout)
  right1: { w: 175, h: 230, quad: src([[840, 302], [1024, 326], [996, 550], [846, 528]]) },
  right2: { w: 165, h: 218, quad: src([[985, 322], [1160, 336], [1132, 545], [994, 545]]) },
}

/** flat cards from their quads: the matrix that pins a flat w × h card to its quad, its inverse, and the quad's bounding box */
function makeCards(defs) {
  const out = {}
  for (const [k, d] of Object.entries(defs)) {
    const m = homography(d.w, d.h, d.quad)
    const xs = d.quad.map((p) => p[0]), ys = d.quad.map((p) => p[1])
    out[k] = { w: d.w, h: d.h, quad: d.quad, transform: css(m), inv: invert(m), bounds: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } }
  }
  return out
}
export const CARDS = makeCards(DEFS)

/** a box measured on the canvas (+ this offset) → the card's flat coordinates */
function flatBoxer(cards, dx = 0, dy = 0) {
  const flat = (key, x, y) => map(cards[key].inv, x - dx, y - dy)
  return (key, x0, y0, x1, y1) => {
    const a = flat(key, x0, y0), b = flat(key, x1, y1), c = flat(key, x1, y0), d = flat(key, x0, y1)
    const xs = [a[0], b[0], c[0], d[0]], ys = [a[1], b[1], c[1], d[1]]
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  }
}
const flatBox = flatBoxer(CARDS, OX, OY)

/** where each side card's icon and title sit */
export const SIDE = {
  left: { icon: flatBox('left', 398, 354, 441, 388), title: flatBox('left', 376, 414, 466, 448), align: 'center' },
  right1: { icon: flatBox('right1', 884, 342, 942, 391), title: flatBox('right1', 864, 423, 1002, 468), align: 'center' },
  right2: { icon: flatBox('right2', 1050, 370, 1088, 411), title: flatBox('right2', 1030, 426, 1122, 466), align: 'center' },
}

/* ── the orbit ring: radius by angle around (690, 450), y squashed by 0.4 ── */
const R = {
  '-180': 505, '-174': 508, '-168': 510, '-162': 511, '-156': 510, '-150': 507, '-144': 502, '-138': 496, '-132': 488, '-126': 479, '-120': 474,
  '-114': 472, '-108': 470, '-102': 468, '-96': 466, '-90': 464, '-84': 462, '-78': 461, '-72': 460, '-66': 459, '-60': 472, '-54': 492, '-48': 513, '-42': 532,
  '-36': 530, '-30': 520, '-24': 514, '-18': 510, '-12': 506, '-6': 503, 0: 500, 6: 498, 12: 495, 18: 490, 24: 486, 30: 479, 36: 472,
  42: 478, 48: 484, 54: 490, 60: 494, 66: 497, 72: 498, 78: 498, 84: 497, 90: 495, 96: 492, 102: 488, 108: 482,
  114: 480, 120: 478, 126: 476, 132: 474, 138: 472, 144: 470, 150: 467, 156: 476, 162: 485, 168: 493, 174: 499,
}
function ringPath() {
  const pts = []
  for (let a = -180; a < 180; a += 6) {
    const r = R[a]; const t = (a * Math.PI) / 180
    pts.push([690 + r * Math.cos(t) - OX, 450 + 0.4 * r * Math.sin(t) - OY])
  }
  const n = pts.length, f = (v) => v.toFixed(1)
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`
  }
  return d + 'Z'
}
export const RING_PATH = ringPath()

/* ── the hand-drawn hint: text block + a curved arrow with a small head at each end ── */
export const NOTE = {
  text: { x: 412 - OX, y: 78 - OY, rotate: -10 },
  arrow: 'M251,70 C230,86 232,106 279,133',
  headTop: 'M243,58 L251,54 L255,66',
  headEnd: 'M262,134 L280,134 L272,120',
}

/* ── the two round arrows ── */
export const ARROWS = {
  prev: { x: 412 - OX, y: 516 - OY, d: 44 },
  next: { x: 1180 - OX, y: 504 - OY, d: 44 },
}

/* ── the 4-point sparkle star on the orbit ring ── */
export const SPARKLE = { x: 1162 - OX, y: 546 - OY, size: 26 }

/** the small cursor mark under the ring */
export const CURSOR = { x: 458 - OX, y: 610 - OY }

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   THE CAROUSEL — 1 featured card, 1 waiting card left, exactly 2 waiting cards right
   ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export const FLAT = { w: DEFS.featured.w, h: DEFS.featured.h }

/** scale a quad about its centre and move it */
function xf(q, dx, dy, s) {
  const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4
  return q.map(([x, y]) => [cx + (x - cx) * s + dx, cy + (y - cy) * s + dy])
}
/** mirror a quad about the vertical line x = W / 2 */
const mirror = (q, W) => [[W - q[1][0], q[1][1]], [W - q[0][0], q[0][1]], [W - q[3][0], q[3][1]], [W - q[2][0], q[2][1]]]
const row = (q, a) => [...q.flat(), a]
const cxOf = (q) => q.reduce((s, p) => s + p[0], 0) / 4

function geometry({ stage, cards, quads, alphas, faces, unit }) {
  const [, , q0, q1] = quads
  return {
    stage, cards, unit,
    knots: quads.map((q, i) => row(q, alphas[i])),
    faces,
    cx0: cxOf(q0), presentSpan: unit * 0.55,
    bounds: cards.featured.bounds, q1x: cxOf(q1),
  }
}

/* desktop + tablet — exactly 2 waiting cards on the right */
export const CAROUSEL = geometry({
  stage: STAGE,
  cards: CARDS,
  quads: [
    xf(DEFS.left.quad, -94, -6, 0.8),
    DEFS.left.quad,
    DEFS.featured.quad,
    DEFS.right1.quad,
    DEFS.right2.quad,
    xf(DEFS.right2.quad, 106, 2, 0.86),
  ],
  alphas: [0, 1, 1, 1, 1, 0],
  unit: 240,
  faces: [
    { key: 'left', at: -1, ...SIDE.left },
    { key: 'featured', at: 0 },
    { key: 'right1', at: 1, ...SIDE.right1 },
    { key: 'right2', at: 2, ...SIDE.right2 },
  ].map((f) => (f.key === 'featured' ? f : { ...f, w: CARDS[f.key].w, h: CARDS[f.key].h })),
})

/* phones — the same idea, compact: the featured card fills the width, its neighbours peek out either side, and the
   ring / hint disappear. Planar, with the neighbours foreshortened a little so they read as sitting back in depth. */
export const STAGE_COMPACT = { w: 390, h: 440 }
const R1 = [[336, 42], [452, 60], [452, 326], [336, 344]]
const R2 = [[430, 72], [522, 82], [522, 300], [430, 310]]
const FEAT_C = [[35, 10], [355, 10], [355, 374], [35, 374]]
// the neighbours' flat layout boxes are their quads' own size (116 × 282), so an icon drawn in one is not squashed
const compactDefs = { featured: { ...FLAT, quad: FEAT_C }, left: { w: 116, h: 282, quad: mirror(R1, STAGE_COMPACT.w) }, right1: { w: 116, h: 282, quad: R1 } }
const CARDS_C = makeCards(compactDefs)
const flatBoxC = flatBoxer(CARDS_C)
export const CAROUSEL_COMPACT = geometry({
  stage: STAGE_COMPACT,
  cards: CARDS_C,
  quads: [mirror(R2, STAGE_COMPACT.w), mirror(R1, STAGE_COMPACT.w), FEAT_C, R1, R2, xf(R2, 110, 0, 0.9)],
  alphas: [0, 1, 1, 1, 0, 0],
  unit: 205,
  faces: [
    // a peeking neighbour shows just its icon, centred in the strip that is left of the featured card
    { key: 'left', at: -1, w: 116, h: 282, icon: flatBoxC('left', 4, 179, 31, 205) },
    { key: 'featured', at: 0 },
    { key: 'right1', at: 1, w: 116, h: 282, icon: flatBoxC('right1', 359, 179, 386, 205) },
  ],
})

/** the compact layout's round arrows sit under the card, with the dots between them */
export const ARROWS_COMPACT = { prev: { x: 47, y: 412, d: 40 }, next: { x: 343, y: 412, d: 40 }, dots: { x: STAGE_COMPACT.w / 2, y: 412 } }
