import { useEffect } from 'react'
import { Smoothed } from '../hero3d/cursor/smoothing'
import { PARALLAX } from '../hero3d/composition'

/**
 * useHeroMotion — the hero's single animation loop, for everything that is NOT the 3D rigs:
 *   · smooths the pointer into `interaction.sm` (the 3D characters read it for their parallax)
 *   · applies the DOM parallax layers (background, particles) with plain transforms
 *   · ticks the service-card engine (proximity focus + the slide reaction the characters turn with)
 *
 * It is an on-demand rAF loop: it runs only while there is motion (pointer moving, layers settling,
 * cards easing, a slide settling) and only while the hero is on screen and the tab visible. Input wakes it
 * (`interaction.wake`). It never causes a React render, and it asks the 3D scene for a frame
 * (`interaction.invalidate`) only when something 3D has actually changed.
 *
 *   layers: { bg, particles }  refs to the parallax DOM layers
 *   holoApi: ref to the service cards' engine  ({ tick(dt) → moving })
 */
export function useHeroMotion({ interaction: it, heroRef, layers, holoApi }) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || !it) return
    const sx = new Smoothed(0), sy = new Smoothed(0)
    let raf = 0, last = 0, onScreen = true

    const apply = (el, ampPx, k) => {
      if (!el) return
      const x = -it.sm.x * ampPx * k, y = -it.sm.y * ampPx * 0.6 * k
      el.style.transform = k === 0 ? '' : `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`
    }

    const frame = (ts) => {
      raf = 0
      const dt = Math.min(last ? (ts - last) / 1000 : 1 / 60, 0.05)
      last = ts
      const k = it.cfg.parallax
      const p = it.pointer
      const tx = p.active && k > 0 ? p.x : 0
      const ty = p.active && k > 0 ? p.y : 0
      it.sm.x = sx.update(tx, 0.5, dt)
      it.sm.y = sy.update(ty, 0.5, dt)

      apply(layers.bg.current, PARALLAX.background, k)
      apply(layers.particles.current, PARALLAX.particles, k)

      const parallaxMoving = Math.abs(sx.state.v) > 0.0008 || Math.abs(sy.state.v) > 0.0008 || Math.abs(it.sm.x - tx) > 0.002 || Math.abs(it.sm.y - ty) > 0.002
      const cardsMoving = holoApi.current ? holoApi.current.tick(dt) : false
      if (parallaxMoving) it.invalidate?.() // the 3D layers' parallax changed → draw a frame
      if ((parallaxMoving || cardsMoving) && onScreen && !document.hidden) raf = requestAnimationFrame(frame)
      else last = 0
    }

    const wake = () => { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame) }
    it.wake = wake

    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) wake(); else if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0 } }, { rootMargin: '80px' })
    io.observe(hero)
    const onVis = () => (document.hidden ? (raf && cancelAnimationFrame(raf), (raf = 0), (last = 0)) : wake())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      if (it.wake === wake) it.wake = null
      ;[layers.bg, layers.particles].forEach((r) => { if (r.current) r.current.style.transform = '' })
    }
  }, [it, heroRef, layers, holoApi])
}
