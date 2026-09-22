import { useEffect } from 'react'
import { MODES, STATES } from './heroInteraction'
import { clamp } from '../cursor/smoothing'

/**
 * useHeroInput — decides the interaction MODE for the current device and feeds the shared
 * interaction object. No React state is touched on pointer movement.
 *
 *   desktop  window `pointermove` (mouse / pen) → normalised to the hero element
 *   tablet   the same, at reduced sensitivity; a finger drag counts too
 *   mobile   swipe or tap on the hero switches between LEFT / CENTER / RIGHT (no continuous tracking)
 *   reduced  a very small, gentle response (see MODES.reduced) — never from touch
 *
 * The mode is re-evaluated on resize / orientation / reduced-motion changes.
 */
export const BREAKPOINTS = { mobile: 768, desktop: 1024 }

function pickMode() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced'
  const w = window.innerWidth
  if (w < BREAKPOINTS.mobile) return 'mobile'
  // a wide screen whose main pointer is a finger (landscape tablet / iPad) gets the reduced-sensitivity mode
  if (w < BREAKPOINTS.desktop || window.matchMedia('(pointer: coarse)').matches) return 'tablet'
  return 'desktop'
}

export function useHeroInput(elementRef, interaction) {
  useEffect(() => {
    const el = elementRef.current
    if (!el || !interaction) return
    const it = interaction
    const p = it.pointer

    const applyMode = () => {
      const m = pickMode()
      if (m === it.mode && it.cfg === MODES[m]) return
      it.mode = m
      it.cfg = MODES[m]
      p.active = false // mobile starts in CENTER = the neutral rest pose
      if (m === 'mobile') { p.x = 0; p.y = 0.05; it.state = 'CENTER' }
      if (m === 'reduced') { p.active = false } // wakes on the first mouse move
      it.wake?.(); it.invalidate?.()
    }
    applyMode()
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.addEventListener('resize', applyMode)
    mq.addEventListener('change', applyMode)

    /* ── pointer tracking (desktop, tablet) ── */
    const onMove = (e) => {
      const m = it.cfg.tracking
      if (m !== 'pointer') return
      if (e.pointerType === 'touch' && (it.mode === 'desktop' || it.mode === 'reduced')) return
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      p.cx = e.clientX; p.cy = e.clientY
      p.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
      p.y = clamp(1 - ((e.clientY - r.top) / r.height) * 2, -1, 1)
      p.active = true
      it.wake?.(); it.invalidate?.()
    }
    const release = () => { if (it.cfg.tracking === 'pointer') { p.active = false; it.wake?.(); it.invalidate?.() } }
    const onOut = (e) => { if (!e.relatedTarget) release() } // left the window
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseout', onOut)
    window.addEventListener('blur', release)

    /* ── swipe / tap states (mobile) ── */
    let sx = 0, sy = 0, sT = 0, tracking = false
    const onDown = (e) => { if (it.cfg.tracking !== 'states') return; tracking = true; sx = e.clientX; sy = e.clientY; sT = performance.now() }
    const onUp = (e) => {
      if (!tracking || it.cfg.tracking !== 'states') return
      tracking = false
      const dx = e.clientX - sx, dy = e.clientY - sy
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) it.step(dx < 0 ? -1 : 1) // swipe: content follows the finger
      else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && performance.now() - sT < 350) { // tap: by screen third
        const r = el.getBoundingClientRect(), f = (e.clientX - r.left) / r.width
        it.setState(STATES[f < 1 / 3 ? 0 : f < 2 / 3 ? 1 : 2])
      }
    }
    el.addEventListener('pointerdown', onDown, { passive: true })
    el.addEventListener('pointerup', onUp, { passive: true })
    el.addEventListener('pointercancel', () => { tracking = false }, { passive: true })

    return () => {
      window.removeEventListener('resize', applyMode)
      mq.removeEventListener('change', applyMode)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', release)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
    }
  }, [elementRef, interaction])
}
