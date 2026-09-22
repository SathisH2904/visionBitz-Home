import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { clamp, smoothstep } from './smoothing'

/**
 * useAmbientLife — the small things that make the robot feel alive rather than posed. All of it is additive
 * on top of the pose (every node's rest is captured first) and none of it touches the cursor rig's nodes
 * (head / neck / torso rotation, `Eyes` rotation), so the two never fight:
 *
 *   blinking      Eye_L / Eye_R squash vertically for ~0.2 s every 2.6–6 s (sometimes a quick double blink)
 *   breathing     the chest swells a little on a 4.4 s cycle, the whole upper body rises with it
 *   float         a slower, larger bob (the robot has no legs — it hovers)
 *   shoulders     the shoulder joints lift with each breath (arms ride along); now and then a small shrug
 *
 * Amounts follow the mode (`interaction.cfg.idle`: desktop 1 · tablet .8 · phone .5 · reduced-motion 0 = everything
 * stays at rest). Frames: the rest of the scene renders on demand, so this hook keeps a light HEARTBEAT that asks for a
 * frame at `interaction.cfg.fps` (30 desktop / 20 phone) — only while enabled, and never when motion is reduced.
 *
 * Nothing allocates in the frame loop and React state is never touched.
 */
const BREATH_S = 4.4, FLOAT_S = 6.3
const TAU = Math.PI * 2
let seed = 987654321
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }

export function useAmbientLife(root, interactionRef, { enabled = true } = {}) {
  const invalidate = useThree((s) => s.invalidate)
  const ref = useRef(null)

  useLayoutEffect(() => {
    if (!root || !enabled) return
    const pick = (n) => root.getObjectByName(n)
    const A = {
      eyeL: pick('Eye_L'), eyeR: pick('Eye_R'), chest: pick('Chest'), torso: pick('Torso'), shL: pick('Shoulder_L'), shR: pick('Shoulder_R'),
      blinkAt: 1.4 + rand() * 2, blinkStart: -1, double: false, shrugAt: 7 + rand() * 5, shrugStart: -10, blinks: 0,
    }
    for (const k of ['eyeL', 'eyeR', 'chest', 'torso', 'shL', 'shR']) {
      if (!A[k] && import.meta.env.DEV) console.warn(`[ambient] node for "${k}" not found — that part of the idle life is skipped`)
    }
    A.rest = {
      eyeSy: A.eyeL ? A.eyeL.scale.y : 1,
      chest: A.chest ? A.chest.scale.clone() : null,
      torsoY: A.torso ? A.torso.position.y : 0,
      shLy: A.shL ? A.shL.position.y : 0, shRy: A.shR ? A.shR.position.y : 0,
    }
    root.userData.__ambient = A // read by tests / debugging
    ref.current = A
    return () => {
      const r = A.rest
      if (A.eyeL) A.eyeL.scale.y = r.eyeSy
      if (A.eyeR) A.eyeR.scale.y = r.eyeSy
      if (A.chest && r.chest) A.chest.scale.copy(r.chest)
      if (A.torso) A.torso.position.y = r.torsoY
      if (A.shL) A.shL.position.y = r.shLy
      if (A.shR) A.shR.position.y = r.shRy
      ref.current = null
    }
  }, [root, enabled])

  // the heartbeat: ask for a frame at the mode's rate (no-op while the scene is paused / off screen)
  useEffect(() => {
    if (!enabled) return
    let id = 0
    const beat = () => {
      const it = interactionRef.current
      const fps = it?.cfg?.fps || 0
      if (fps > 0 && !document.hidden) invalidate()
      id = window.setTimeout(beat, fps > 0 ? 1000 / fps : 400)
    }
    beat()
    return () => window.clearTimeout(id)
  }, [enabled, invalidate, interactionRef])

  useFrame((state) => {
    const A = ref.current, it = interactionRef.current
    if (!A || !it) return
    const k = it.cfg.idle ?? 0
    const t = state.clock.elapsedTime
    const r = A.rest

    // ── blinking ──
    let close = 0
    if (k > 0) {
      if (A.blinkStart < 0 && t >= A.blinkAt) { A.blinkStart = t; A.blinks++ }
      if (A.blinkStart >= 0) {
        const u = (t - A.blinkStart) / 0.2
        if (u >= 1) {
          A.blinkStart = -1
          if (!A.double && rand() < 0.16) { A.double = true; A.blinkAt = t + 0.16 } // a quick second blink
          else { A.double = false; A.blinkAt = t + 2.6 + rand() * 3.4 }
        } else {
          const c = u < 0.4 ? u / 0.4 : 1 - (u - 0.4) / 0.6 // closes fast, opens a little slower
          close = smoothstep(0, 1, c)
        }
      }
    }
    const sy = r.eyeSy * (1 - 0.9 * close)
    if (A.eyeL) A.eyeL.scale.y = sy
    if (A.eyeR) A.eyeR.scale.y = sy

    // ── breathing + float ──
    const b = k > 0 ? Math.sin((t / BREATH_S) * TAU) : 0
    const f = k > 0 ? Math.sin((t / FLOAT_S) * TAU + 1.3) : 0
    if (A.chest && r.chest) A.chest.scale.set(r.chest.x * (1 + 0.011 * b * k), r.chest.y * (1 + 0.006 * b * k), r.chest.z * (1 + 0.011 * b * k))
    if (A.torso) A.torso.position.y = r.torsoY + (0.0035 * b + 0.006 * f) * k

    // ── shoulders: lift with the breath, and an occasional small shrug ──
    let shrug = 0
    if (k > 0) {
      if (t >= A.shrugAt) { A.shrugStart = t; A.shrugAt = t + 9 + rand() * 8 }
      const u = clamp((t - A.shrugStart) / 1.1, 0, 1)
      shrug = u < 1 ? Math.sin(u * Math.PI) ** 2 : 0
    }
    const lift = (0.003 * b + 0.011 * shrug) * k // torso-local units — the whole arm rides up with its shoulder
    if (A.shL) A.shL.position.y = r.shLy + lift
    if (A.shR) A.shR.position.y = r.shRy + lift
  })
}
