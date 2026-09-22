/**
 * Smoothing primitives for cursor-following motion. Pure functions, no React / three.
 *
 * The motion model is a critically-damped spring ("SmoothDamp"): the value keeps a
 * velocity, so it ACCELERATES away from rest, glides, and DECELERATES into the target —
 * no overshoot, no snapping, and it stays stable at any frame rate.
 */

export const DEG = Math.PI / 180
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/**
 * One SmoothDamp step (Game Programming Gems 4 / Unity's Mathf.SmoothDamp).
 * `state.v` is the persistent velocity. `smoothTime` ≈ seconds to reach the target
 * (smaller = snappier). Returns the new value.
 */
export function smoothDamp(current, target, state, smoothTime, dt, maxSpeed = Infinity) {
  if (dt <= 0) return current
  smoothTime = Math.max(0.0001, smoothTime)
  const omega = 2 / smoothTime
  const x = omega * dt
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

  const maxChange = maxSpeed * smoothTime
  const change = clamp(current - target, -maxChange, maxChange)
  const clampedTarget = current - change

  const temp = (state.v + omega * change) * dt
  state.v = (state.v - omega * temp) * decay
  let out = clampedTarget + (change + temp) * decay

  // never overshoot the target
  if ((target - current > 0) === (out > target)) {
    out = target
    state.v = (out - clampedTarget) / dt
  }
  return out
}

/**
 * Config speaks in damping RATES ("damp(current, target, lambda, dt)": higher = snappier). The spring
 * wants a smoothTime; 1.18 / rate gives the same ~90 % arrival time as an exponential damp of that rate
 * (a critically-damped spring reaches 90 % at 3.9 / omega, omega = 2 / smoothTime → smoothTime = 1.18 / rate).
 */
export const smoothTimeFromRate = (rate) => 1.18 / Math.max(0.01, rate)

/** A value that eases toward whatever target it is given. */
export class Smoothed {
  constructor(value = 0) {
    this.value = value
    this.state = { v: 0 }
  }
  update(target, smoothTime, dt, maxSpeed = Infinity) {
    this.value = smoothDamp(this.value, target, this.state, smoothTime, dt, maxSpeed)
    return this.value
  }
  /** jump to a value with zero velocity (use for initial placement, not for motion) */
  reset(value = 0) {
    this.value = value
    this.state.v = 0
  }
}

/**
 * Shapes a normalised input (-1..1) so tiny hand tremors do nothing and the response
 * ramps in gently instead of being linear:
 *   deadZone — fraction of the range that is ignored around the centre
 *   curve    — >1 softens the centre (more precision), 1 = linear
 */
export function shapeInput(v, { deadZone = 0.02, curve = 1.15 } = {}) {
  const a = Math.abs(v)
  if (a <= deadZone) return 0
  const n = clamp((a - deadZone) / (1 - deadZone), 0, 1)
  return Math.sign(v) * Math.pow(n, curve)
}

/**
 * One axis of pointer demand: raw distance `d` from the character (hero units, -1..1) → dead zone → per-side span
 * → curve. `o` is the character's origin on that axis; plan = { dead, minSpan, range, shape }. Returns -1..1.
 * Shared by the 3D follow rig (robot and boy) so they read the same cursor the same way.
 */
export function axisDemand(d, o, plan) {
  const a = Math.abs(d)
  if (a <= plan.dead) return 0
  const span = clamp(d > 0 ? 1 - o : 1 + o, plan.minSpan, 1) * plan.range
  return shapeInput(clamp(Math.sign(d) * (a - plan.dead) / span, -1, 1), plan.shape)
}

export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}
