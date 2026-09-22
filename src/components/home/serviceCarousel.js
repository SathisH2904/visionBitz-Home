/**
 * serviceCarousel — the maths under the service carousel. Pure functions, no React / DOM; allocation-free per frame.
 *
 *   makeTrack(rows)      a card's pose (its four corners + opacity) at ANY fractional offset, from its pose at the slots
 *   quadMatrix(q, w, h)  the CSS matrix3d that pins a flat w × h card to the quad q  (exact homography)
 *   faceWeights(o, L, out)  how much of each slot's layout a card shows at offset o (they cross-fade)
 *
 * The track is a monotone cubic Hermite spline (Fritsch–Carlson) per channel, through the six slots o = -2 … 3:
 * C¹ smooth (a card never kinks as it passes a slot), and it can never overshoot — a card between two slots is never
 * bigger than the bigger one or further out than the further one. Slots are one offset apart.
 */
const FIRST = -2 // the offset of the first row

export function makeTrack(rows) {
  const K = rows.length, C = rows[0].length
  const m = rows.map(() => new Float64Array(C))
  for (let c = 0; c < C; c++) {
    const d = new Float64Array(K - 1)
    for (let k = 0; k < K - 1; k++) d[k] = rows[k + 1][c] - rows[k][c]
    m[0][c] = d[0]
    m[K - 1][c] = d[K - 2]
    for (let k = 1; k < K - 1; k++) m[k][c] = d[k - 1] * d[k] <= 0 ? 0 : (2 * d[k - 1] * d[k]) / (d[k - 1] + d[k]) // harmonic mean → monotone
  }
  /** writes the pose at offset `o` into `out` (length C) */
  return function at(o, out) {
    const u = Math.min(Math.max(o - FIRST, 0), K - 1 - 1e-9)
    const k = Math.floor(u), t = u - k, t2 = t * t, t3 = t2 * t
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2
    const a = rows[k], b = rows[k + 1], ma = m[k], mb = m[k + 1]
    for (let c = 0; c < C; c++) out[c] = h00 * a[c] + h10 * ma[c] + h01 * b[c] + h11 * mb[c]
    return out
  }
}

/**
 * Unit square → quad (Heckbert's closed form), scaled to a flat w × h card, as a CSS matrix3d string.
 * q = [x0 y0 x1 y1 x2 y2 x3 y3]: TL TR BR BL. Same matrix as the general 8×8 solve in serviceGeometry.js, without the solve.
 */
export function quadMatrix(q, w, h) {
  const x0 = q[0], y0 = q[1], x1 = q[2], y1 = q[3], x2 = q[4], y2 = q[5], x3 = q[6], y3 = q[7]
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  const g = den === 0 ? 0 : (dx3 * dy2 - dx2 * dy3) / den
  const hh = den === 0 ? 0 : (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3
  const f = (v) => +v.toPrecision(9)
  return `matrix3d(${f(a / w)},${f(d / w)},0,${f(g / w)},${f(b / h)},${f(e / h)},0,${f(hh / h)},0,0,1,0,${f(x0)},${f(y0)},0,1)`
}

const smooth = (t) => t * t * (3 - 2 * t)
const ss = (e0, e1, x) => smooth(Math.min(1, Math.max(0, (x - e0) / (e1 - e0))))

/**
 * What a card shows while it is between two slots. `L` = { ats, dips, feat }: `ats` the (ascending) offsets of the layouts,
 * `feat` which one is the featured layout, `dips[k]` true for the gap between layouts k and k+1 when one of them is the
 * featured layout. Writes one opacity per layout into out[0 … n-1], and the featured GLASS's opacity into out[n].
 *   · featured ↔ side: the outgoing layout is gone by the middle of the gap and the incoming one forms after it — text of two
 *     different sizes is never on top of each other; only the glass (opaque, cross-fading smoothly) is there in between
 *   · side ↔ side: the two layouts are alike, so they simply cross-fade over the middle of the gap (briefly — two sets of small text are never on top of each other for long)
 * Outside the outermost layouts the outermost one stays at 1.
 */
export function faceWeights(o, L, out) {
  const { ats, dips, feat } = L, n = ats.length
  for (let i = 0; i <= n; i++) out[i] = 0
  if (o <= ats[0]) { out[0] = 1; if (feat === 0) out[n] = 1; return out }
  if (o >= ats[n - 1]) { out[n - 1] = 1; if (feat === n - 1) out[n] = 1; return out }
  let k = 0
  while (o > ats[k + 1]) k++
  const t = (o - ats[k]) / (ats[k + 1] - ats[k])
  if (dips[k]) { out[k] = 1 - ss(0.04, 0.44, t); out[k + 1] = ss(0.46, 0.92, t) } else { out[k] = 1 - ss(0.4, 0.6, t); out[k + 1] = ss(0.4, 0.6, t) }
  if (feat === k) out[n] = smooth(1 - t)
  else if (feat === k + 1) out[n] = smooth(t)
  return out
}
