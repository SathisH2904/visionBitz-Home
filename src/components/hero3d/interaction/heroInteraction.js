import { createContext, useContext } from 'react'

/**
 * The hero's shared interaction state — ONE mutable object, read every frame by the 3D rigs, the
 * parallax loop and the service cards. It lives in a ref-like object on purpose: pointer moves write
 * to it directly and nothing re-renders (React is only involved for things that truly change the UI,
 * like the mobile carousel index).
 *
 * Modes (chosen by useHeroInput):
 *   desktop  fine pointer, wide screen        → full pointer tracking
 *   tablet   mid-width screen                 → pointer tracking at reduced sensitivity
 *   mobile   narrow screen                    → NO continuous tracking: three discrete states
 *                                               LEFT / CENTER / RIGHT set by swipe or tap. CENTER is the
 *                                               neutral rest pose (nobody is touching = nothing moves).
 *   reduced  prefers-reduced-motion           → a subtle, static-feeling response only: ~20 % of the rotation,
 *                                               one gentle response for every layer (no follow-through
 *                                               stagger), no parallax, no card movement, no auto-motion
 */
/*
 * sens = how much cursor travel is needed (input side); amp = how large the rotations may get (output side).
 * present = how strongly the characters follow the service cards with their gaze while the cards slide (0.25 = a hint,
 * for reduced motion).
 * idle = amount of ambient life (blinking, breathing, drift) and fps = how often the scene is refreshed for it —
 * only used by scenes that opt in (the portfolio hero); the VisionBitz hero stays fully on-demand.
 */
export const MODES = {
  desktop: { sens: 1, amp: 1, present: 1, parallax: 1, tracking: 'pointer', quality: 'high', idle: 1, fps: 30 },
  tablet: { sens: 0.6, amp: 0.8, present: 0.8, parallax: 0.55, tracking: 'pointer', quality: 'medium', idle: 0.8, fps: 30 },
  mobile: { sens: 0.55, amp: 0.6, present: 0.7, parallax: 0.3, tracking: 'states', quality: 'lite', idle: 0.5, fps: 20 },
  reduced: { sens: 0.2, amp: 1, present: 0.25, parallax: 0, tracking: 'pointer', quality: 'medium', reduced: true, cards: false, idle: 0, fps: 0 },
}

/** where each mobile state points the characters' attention (hero space, -1..1) */
export const STATE_POINT = { LEFT: { x: -0.9, y: 0.05 }, CENTER: { x: 0, y: 0.05 }, RIGHT: { x: 0.9, y: 0.05 } }
export const STATES = ['LEFT', 'CENTER', 'RIGHT']

export function createInteraction() {
  const it = {
    mode: 'desktop',
    cfg: MODES.desktop,
    /** raw pointer: hero-normalised (-1..1, y up) + client px */
    pointer: { x: 0, y: 0, cx: 0, cy: 0, active: false },
    /** smoothed pointer, written by the motion loop — parallax reads this */
    sm: { x: 0, y: 0 },
    /** the service card being approached: hero-space point + strength 0..1 */
    focus: { x: 0, y: 0, w: 0, id: null },
    /**
     * where MOVING CONTENT wants the characters to look, as a gaze demand (-1..1, +x = right, +y = up) and how much
     * it counts (0..1). Written by a page's motion loop (portfolio hero); blended with the pointer per layer by the rig.
     */
    attention: { gx: 0, gy: 0, w: 0 },
    /**
     * where the service cards the characters are "presenting" are RIGHT NOW, relative to the featured slot: the gaze offset
     * toward the card(s) nearest the middle, -1 = far to the LEFT … +1 = far to the RIGHT, 0 = the featured card at rest.
     * Written by the service carousel every frame (it follows the moving cards — the outgoing one, then the arriving one);
     * the rigs add a small turn toward it on top of the cursor (followConfig.js `present`), which eases back as the cursor
     * asks for more.
     */
    present: { x: 0 },
    /** page scroll / slide progress 0..1 and its velocity — the cinematic camera reads it */
    scroll: { p: 0, v: 0 },
    state: 'CENTER',
    stateListeners: new Set(),
    /** hooks the 3D scene / motion loop register so input can wake them (demand rendering) */
    invalidate: null,
    wake: null,
    setState(next, { silent = false } = {}) {
      if (!STATES.includes(next) || next === it.state) return
      it.state = next
      const p = STATE_POINT[next]
      it.pointer.x = p.x; it.pointer.y = p.y; it.pointer.active = it.mode === 'mobile' && next !== 'CENTER'
      if (!silent) it.stateListeners.forEach((fn) => fn(next))
      it.wake?.(); it.invalidate?.()
    },
    step(dir) { // -1 = toward LEFT, +1 = toward RIGHT
      const i = Math.min(2, Math.max(0, STATES.indexOf(it.state) + dir))
      it.setState(STATES[i])
    },
  }
  return it
}

export const InteractionContext = createContext(null)
export const useInteraction = () => useContext(InteractionContext)
