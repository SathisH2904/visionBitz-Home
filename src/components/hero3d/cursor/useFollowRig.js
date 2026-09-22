import { useCallback, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DEG, Smoothed, axisDemand, clamp, lerp, smoothstep, smoothTimeFromRate } from './smoothing'
import { registerLookDebug } from './lookDebug'

/**
 * useFollowRig — cursor / content following for named nodes of a loaded GLB, as independent layers with
 * priority order and hard anatomical clamps (see followConfig.js).
 *
 *   useFollowRig(root, config, interactionRef, { anchor })
 *
 * Per frame, per axis:
 *   1. gaze demand   POINTER  = shaped( (target − origin − deadZone) / span ) × mode sensitivity   (-1..1)
 *                    CONTENT  = interaction.attention (written by a page that has moving content) × sensitivity
 *                    per layer = lerp(pointer, content, layer.blend) — so the EYES can stay on the cursor while
 *                    head / neck / body lean toward the content that is moving. With no pointer the content
 *                    drives every layer; with no content the pointer does (the VisionBitz hero).
 *      span          = the room the cursor has on THAT side of the character (to the hero edge), kept
 *                      between `minSpan` and 1, times `range`, so a character near an edge still turns
 *                      strongly toward a cursor on that side.
 *   2. allocation    the angle a demand needs is handed to the layers in order, each up to its own allocation
 *                    (`couple` lets a downstream layer lead a little). With `eyesIndependent` the eyes are their
 *                    own group: they take their share directly and do not delay the head.
 *   3. idle          optional per-layer ambient drift (micro-saccades for eyes, slow sway for the rest)
 *   4. smoothing     critically-damped spring per layer (different rates → follow-through)
 *   5. clamping      per-layer hard limits, then a limit on the head+neck+body chain
 *   6. write         node.rotation = REST + offset      (the authored / posed rest is never lost)
 *
 * Nothing is set straight from the mouse. Reads the shared interaction object — no React state.
 * On-demand rendering: while a layer is still moving it asks for the next frame, and once everything has
 * settled it stops. (A scene that wants ambient life keeps its own heartbeat — see useAmbientLife.)
 *
 * Allocation-free frame: everything the loop needs (limits in radians, smooth times, sums) is resolved
 * once in `capture()`; the loop itself creates no objects or closures.
 *
 * Dev warnings name the character, the layer and the missing node — nothing fails silently — and an
 * eye node that cannot be turned on its own (a mesh whose origin is not at the eye) disables ONLY the
 * eye layer; head / neck / body tracking carry on.
 */
const EPS = 0.0004 // radians — below this a layer counts as settled
const AXIS = { x: 0, y: 1, z: 2 }
const ORIGIN0 = { x: 0, y: 0 }
const d3 = [0, 0, 0] // scratch: the per-axis offset, reused every frame
const TAU = Math.PI * 2

const warn = (name, msg, extra) => { if (import.meta.env.DEV) console.warn(`[look:${name}] ${msg}`, extra ?? '') }

// tiny deterministic random for the eyes' micro-saccades (repeatable, no allocation)
let seed = 12345
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }

/** an "eye" node is only usable if turning it turns the eye: a mesh must be centred on its own origin */
function eyePivotProblem(node) {
  if (!node.isMesh || !node.geometry) return null // a group / empty is a pivot by construction
  const g = node.geometry
  if (!g.boundingBox) g.computeBoundingBox()
  const b = g.boundingBox
  const cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2
  const hx = (b.max.x - b.min.x) / 2 || 1e-6, hy = (b.max.y - b.min.y) / 2 || 1e-6
  return Math.abs(cx) > hx * 0.6 || Math.abs(cy) > hy * 0.6
    ? `mesh "${node.name}" is not centred on its own origin — rotating it would swing it, not turn the eye`
    : null
}

export function useFollowRig(root, config, interactionRef, { anchor = { x: 0, y: 0 } } = {}) {
  const invalidate = useThree((s) => s.invalidate)
  const cfgRef = useRef(config)
  cfgRef.current = config
  const anchorRef = useRef(anchor)
  anchorRef.current = anchor
  const planRef = useRef(null)
  const disabledRef = useRef([])

  const restore = useCallback(() => {
    const plan = planRef.current
    if (plan) plan.layers.forEach((L) => L.nodes.forEach((n, i) => n.rotation.copy(L.rests[i])))
    planRef.current = null
  }, [])

  const capture = useCallback(() => {
    restore()
    disabledRef.current = []
    if (!root) return
    const cfg = cfgRef.current
    const ax = { yaw: 'y', pitch: 'x', roll: 'z', ...cfg.axes }
    const order = (ax.yaw + ax.pitch + ax.roll).toUpperCase() // Euler order: yaw first, then pitch about the node's OWN axis
    const layers = []

    // priority = the config's key order (eyes → head → neck → body)
    let idx = 0
    for (const [name, c] of Object.entries(cfg.layers)) {
      const found = []
      for (const nn of c.nodes) {
        const n = root.getObjectByName(nn)
        if (!n) {
          if (import.meta.env.DEV) {
            const avail = []
            root.traverse((o) => { if (o !== root && o.name) avail.push(o.name) })
            warn(cfg.name, `layer "${name}": node "${nn}" not found in the GLB — set the right name in followConfig.js.`, `available: ${avail.slice(0, 40).join(', ')}${avail.length > 40 ? ' …' : ''}`)
          }
          continue
        }
        if (name === 'eyes') {
          const problem = eyePivotProblem(n)
          if (problem) {
            warn(cfg.name, `eye rotation DISABLED — ${problem}. Head / neck / body tracking stays active. Fix in Blender: give each eye its own object with the origin at the eyeball centre.`)
            disabledRef.current.push(`eyes: ${problem}`)
            continue
          }
        }
        found.push(n)
      }
      if (!found.length) { disabledRef.current.push(`${name}: no usable node (${c.nodes.join(', ')})`); continue }
      found.forEach((n) => n.rotation.reorder(order))
      const maxPitch = c.pitch || 0
      const time = c.smoothTime ?? smoothTimeFromRate(c.damping ?? 6)
      const idle = c.idle || null
      layers.push({
        name, nodes: found, rests: found.map((n) => n.rotation.clone()),
        yaw: new Smoothed(0), pitch: new Smoothed(0), roll: new Smoothed(0),
        isEyes: name === 'eyes',
        maxYaw: c.yaw || 0, maxPitch, maxPitchUp: c.pitchUp ?? maxPitch,
        limYaw: (c.limitYaw ?? c.yaw ?? 0) * DEG, limPitch: (c.limitPitch ?? maxPitch) * DEG,
        limitYawDeg: c.limitYaw ?? c.yaw ?? 0, limitPitchDeg: c.limitPitch ?? maxPitch,
        rollAmt: (c.roll || 0) * DEG, couple: c.couple || 0, time, cap: c.maxSpeed ? c.maxSpeed * DEG : Infinity,
        presentYaw: (c.present || 0) * DEG, // yaw at ±1 while presenting the service cards (followConfig.js)
        blend: clamp(c.blend ?? 0, 0, 1),
        // ambient drift (radians): slow sines, plus micro-saccades for the eyes
        idleYaw: (idle?.yaw || 0) * DEG, idlePitch: (idle?.pitch || 0) * DEG, idleRate: (idle?.rate ?? 0.16) * TAU, saccade: !!idle?.saccade,
        ph1: idx * 1.7 + 0.3, ph2: idx * 2.9 + 1.1, ph3: idx * 0.8 + 2.2, ph4: idx * 3.7 + 0.6,
        nextSac: 0, sacYaw: 0, sacPitch: 0,
        // allocation bookkeeping, filled below
        cumYaw: 0, cumPitch: 0, cumUp: 0, sumYaw: 0, sumPitch: 0, sumUp: 0,
        tYaw: 0, tPitch: 0, // last targets — for the debug overlay
      })
      idx++
    }

    // allocation groups: everything in one chain (eyes first), or — with eyesIndependent — the eyes on their own
    // and head/neck/body chained without waiting for the eyes.
    const groups = cfg.eyesIndependent ? [layers.filter((L) => L.isEyes), layers.filter((L) => !L.isEyes)] : [layers]
    for (const members of groups) {
      let cy = 0, cp = 0, cu = 0
      const sy = members.reduce((s, L) => s + L.maxYaw, 0), sp = members.reduce((s, L) => s + L.maxPitch, 0), su = members.reduce((s, L) => s + L.maxPitchUp, 0)
      for (const L of members) {
        L.cumYaw = cy; L.cumPitch = cp; L.cumUp = cu
        L.sumYaw = sy; L.sumPitch = sp; L.sumUp = su
        cy += L.maxYaw; cp += L.maxPitch; cu += L.maxPitchUp
      }
    }

    planRef.current = {
      layers, meanTime: layers.length ? layers.reduce((s, L) => s + L.time, 0) / layers.length : 0.2,
      iYaw: AXIS[ax.yaw], iPitch: AXIS[ax.pitch], iRoll: AXIS[ax.roll],
      chainYaw: cfg.chain.yaw * DEG, chainPitch: cfg.chain.pitch * DEG,
      dead: cfg.input?.deadZone ?? 0.04, shape: { deadZone: 0, curve: cfg.input?.curve ?? 1.15 }, // dead zone is applied in raw pointer units
      range: cfg.range || 1, minSpan: cfg.minSpan ?? 0.3,
      useContent: layers.some((L) => L.blend > 0),
      hasIdle: layers.some((L) => L.idleYaw > 0 || L.idlePitch > 0 || L.saccade),
    }
  }, [root, restore])

  useLayoutEffect(() => {
    capture()
    return restore
  }, [capture, restore, config])

  useFrame((state, delta) => {
    const plan = planRef.current
    const it = interactionRef.current
    if (!plan || !it || !plan.layers.length) return
    const cfg = cfgRef.current
    const layers = plan.layers
    const dt = Math.min(delta, 1 / 20)
    const sens = it.cfg.sens
    const amp = it.cfg.amp ?? 1 // per-mode output scale (tablet / phone rotate less)
    const flat = it.cfg.reduced === true // reduced motion: one gentle response for every layer (no follow-through stagger)
    const idleAmt = plan.hasIdle ? (it.cfg.idle ?? 0) : 0
    const time = state.clock.elapsedTime
    // presenting the service cards: where the moving cards are relative to the featured slot (-1 left … +1 right), per-mode strength
    const present = (it.present?.x || 0) * (it.cfg.present ?? 1) * cfg.yawSign

    // ── 1. gaze demand: pointer … ──
    const p = it.pointer
    const o = cfg.origin === 'center' ? ORIGIN0 : cfg.origin === 'anchor' ? anchorRef.current : cfg.origin
    const pointerOn = sens > 0 && p.active
    let pgx = 0, pgy = 0
    if (pointerOn) {
      let tx = p.x, ty = p.y
      const f = it.focus
      const w = f.w * (cfg.focusWeight ?? 0)
      if (w > 0.001) { tx = lerp(tx, f.x, w); ty = lerp(ty, f.y, w) } // an approached card pulls the gaze toward it
      pgx = axisDemand(tx - o.x, o.x, plan) * sens
      pgy = axisDemand(ty - o.y, o.y, plan) * sens
    }
    // … and moving content
    const att = it.attention
    const contentOn = plan.useContent && sens > 0 && att.w > 0.001
    let cgx = 0, cgy = 0
    if (contentOn) { cgx = clamp(att.gx * att.w, -1, 1) * sens; cgy = clamp(att.gy * att.w, -1, 1) * sens }

    // …the cursor has priority: the cards' pull eases down to 40 % as the cursor asks for more (so the two never fight, yet the
    // robot still watches the cards while the cursor is elsewhere)
    const presentFree = present === 0 ? 0 : 1 - 0.6 * smoothstep(0.1, 0.75, Math.max(Math.abs(pgx), Math.abs(pgy)))

    let chainYaw = 0, chainPitch = 0, moving = false
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i]
      // per-layer demand: the eyes stay mostly on the cursor, the body leans toward the content
      let gx = pgx, gy = pgy
      if (contentOn) {
        if (pointerOn) { gx = pgx + (cgx - pgx) * L.blend; gy = pgy + (cgy - pgy) * L.blend } else { gx = cgx; gy = cgy }
      }

      // ── 2. allocation ──
      const up = gy > 0 // demand upward → looking up
      const absGx = Math.abs(gx), absGy = Math.abs(gy)
      const maxPitch = up ? L.maxPitchUp : L.maxPitch
      const aYaw = clamp(absGx * L.sumYaw - L.cumYaw, 0, L.maxYaw)
      const aPitch = clamp(absGy * (up ? L.sumUp : L.sumPitch) - (up ? L.cumUp : L.cumPitch), 0, maxPitch)
      let targetYaw = Math.sign(gx) * cfg.yawSign * Math.max(aYaw, L.couple * absGx * L.maxYaw) * DEG * amp
      let targetPitch = Math.sign(gy) * cfg.pitchSign * Math.max(aPitch, L.couple * absGy * maxPitch) * DEG * amp
      const targetRoll = -gx * L.rollAmt * cfg.yawSign
      // …plus the turn toward the cards being presented, added on top (the limits below still apply)
      if (presentFree > 0) targetYaw += present * presentFree * L.presentYaw

      // ── 3. ambient drift (only for layers that define it, only while the mode allows it) ──
      if (idleAmt > 0) {
        if (L.saccade) {
          if (time >= L.nextSac) { // micro-saccade: a tiny glance, then hold for a moment
            L.sacYaw = (rand() * 2 - 1) * L.idleYaw; L.sacPitch = (rand() * 2 - 1) * L.idlePitch
            L.nextSac = time + 0.8 + rand() * 1.8
          }
          targetYaw += L.sacYaw * idleAmt; targetPitch += L.sacPitch * idleAmt
        } else {
          const w = L.idleRate * time
          targetYaw += (Math.sin(w + L.ph1) + 0.55 * Math.sin(w * 2.3 + L.ph2)) * 0.645 * L.idleYaw * idleAmt
          targetPitch += (Math.sin(w * 0.83 + L.ph3) + 0.55 * Math.sin(w * 1.9 + L.ph4)) * 0.645 * L.idlePitch * idleAmt
        }
      }
      L.tYaw = targetYaw; L.tPitch = targetPitch

      // ── 4. smoothing (a different rate per layer → the chain reaction; flat when motion is reduced) ──
      const t = flat ? plan.meanTime : L.time
      let yaw = L.yaw.update(targetYaw, t, dt, L.cap)
      let pitch = L.pitch.update(targetPitch, t * 1.05, dt, L.cap)
      let roll = L.roll.update(targetRoll, t * 1.3, dt, L.cap)

      // ── 5. clamping: per layer, then the head+neck+body chain (eyes are not part of the chain) ──
      yaw = clamp(yaw, -L.limYaw, L.limYaw); pitch = clamp(pitch, -L.limPitch, L.limPitch); roll = clamp(roll, -L.limPitch, L.limPitch)
      if (!L.isEyes) {
        const ry = Math.max(0, plan.chainYaw - chainYaw), rp = Math.max(0, plan.chainPitch - chainPitch)
        yaw = clamp(yaw, -ry, ry); pitch = clamp(pitch, -rp, rp)
        chainYaw += Math.abs(yaw); chainPitch += Math.abs(pitch)
      }

      // ── 6. write: rest + offset, on the configured local axes ──
      d3[plan.iYaw] = yaw; d3[plan.iPitch] = pitch; d3[plan.iRoll] = roll
      for (let k = 0; k < L.nodes.length; k++) {
        const r = L.rests[k]
        L.nodes[k].rotation.set(r.x + d3[0], r.y + d3[1], r.z + d3[2])
      }
      if (Math.abs(targetYaw - yaw) > EPS || Math.abs(targetPitch - pitch) > EPS || Math.abs(L.yaw.state.v) > EPS || Math.abs(L.pitch.state.v) > EPS) moving = true
    }
    if (moving) invalidate() // still settling → ask for the next frame; otherwise the loop goes idle
  })

  /** current smoothed deflection per layer, in degrees — for debugging / tests (allocates: never call per frame) */
  const getState = useCallback(() => {
    const out = {}
    const plan = planRef.current
    if (plan) {
      for (const L of plan.layers) {
        out[L.name] = {
          yaw: +(L.yaw.value / DEG).toFixed(2), pitch: +(L.pitch.value / DEG).toFixed(2), roll: +(L.roll.value / DEG).toFixed(2),
          targetYaw: +(L.tYaw / DEG).toFixed(2), targetPitch: +(L.tPitch / DEG).toFixed(2), nodes: L.nodes.map((n) => n.name),
        }
      }
    }
    return out
  }, [])

  // dev only: the overlay reads a snapshot 10×/s — nothing runs unless it was switched on
  useLayoutEffect(() => {
    if (!import.meta.env.DEV) return
    return registerLookDebug(cfgRef.current.name, () => {
      const plan = planRef.current, it = interactionRef.current
      if (!plan || !it) return null
      return {
        name: cfgRef.current.name, mode: it.mode, sens: it.cfg.sens, pointer: it.pointer, disabled: disabledRef.current,
        layers: plan.layers.map((L) => ({
          name: L.name, nodes: L.nodes.map((n) => n.name),
          yaw: L.yaw.value / DEG, pitch: L.pitch.value / DEG, targetYaw: L.tYaw / DEG, targetPitch: L.tPitch / DEG,
          limitYaw: L.limitYawDeg, limitPitch: L.limitPitchDeg,
        })),
      }
    })
  }, [interactionRef])

  return { recapture: capture, getState }
}
