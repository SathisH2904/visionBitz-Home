import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Smoothed, clamp, smoothstep } from '../hero3d/cursor/smoothing'
import { SERVICES, SERVICE_START } from './services'

/**
 * ServiceHolo — the hero's service cards. HTML/CSS only (never 3D meshes), and NOT attached to the
 * characters: they influence each other only through the shared interaction state.
 *
 *   ring    (desktop / tablet-landscape)  a 3D ring: one featured card + receding neighbours
 *   single  (phones / narrow tablets)     one featured card, swipe or arrows to change
 *
 * Proximity interaction (ring mode, pointer modes). A small engine — driven by the hero's motion loop,
 * writing styles straight to the DOM, no React state per frame — measures the cursor's distance to
 * every visible card and, for each card, eases:
 *   · a gentle shift TOWARD the cursor,  · a slight tilt toward it,  · a --em "emphasis" value the CSS
 *     turns into glow / brighter border / lift.
 * It also publishes the nearest approached card as `interaction.focus` (hero-space point + strength);
 * the robot and boy read that to glance the same way — that is the only link between cards and characters.
 */

const N = SERVICES.length
const AUTOPLAY_MS = 7000

const X = [0, 212, 376], Z = [0, -150, -270], RY = [0, 28, 36], SC = [1, 0.6, 0.47], OP = [1, 0.92, 0.55]
function ringStyle(o) {
  const a = Math.abs(o), s = Math.sign(o)
  if (!inRing(o)) return {
    opacity: 0, pointerEvents: 'none', transform: `translate(-50%,-50%) translate3d(${s * 420}px,0,-330px) scale(.5)` }
  const ry = a === 0 ? -7 : -s * RY[a]
  return {
    opacity: OP[a],
    zIndex: 10 - a,
    transform: `translate(-50%,-50%) translate3d(${s * X[a]}px,0,${Z[a]}px) rotateY(${ry}deg) rotateZ(-3deg) scale(${SC[a]})`,
  }
}
const offsetOf = (i, active) => ((i - active + N + N / 2) % N) - N / 2
const inRing = (o) => o >= -1 && o <= 2 // one neighbour on the left, two on the right (as in the master)

const EMPH_ON = 0.35

/** the proximity engine — created once per mount, ticked by the hero's motion loop */
function createEngine() {
  const cards = Array.from({ length: N }, () => ({
    tx: new Smoothed(0), ty: new Smoothed(0), rx: new Smoothed(0), ry: new Smoothed(0), sc: new Smoothed(1), em: new Smoothed(0),
    rect: null, on: false, dirty: true,
  }))
  const focusW = new Smoothed(0)
  const navBoost = new Smoothed(0) // a deliberate slide/arrow/swipe "glance", separate from mouse proximity
  let frame = 0
  return { cards, focusW, navBoost, navX: 0, navY: 0, get frame() { return frame }, bump() { return ++frame } }
}

export default function ServiceHolo({ interaction, heroRef, apiRef, parallaxRef, single = false }) {
  const [active, setActive] = useState(SERVICE_START) // opens on Digital Marketing, like the cluster
  const activeRef = useRef(SERVICE_START)
  activeRef.current = active
  const rootRef = useRef(null)
  const outer = useRef([])
  const inner = useRef([])
  const engine = useRef(null)
  if (!engine.current) engine.current = createEngine()
  const hovering = useRef(false)

  // navigating the cards (arrow, side-card click, swipe) makes the characters glance toward that side of
  // the screen — the SAME channel real mouse proximity uses (`interaction.focus`), so it reuses all of the
  // rig's existing smoothing / per-character strength / clamping. The target is a strong LEFT/RIGHT edge
  // point (mirroring the mobile swipe's STATE_POINT), not the cards' literal screen position: the robot's
  // own head anchor sits almost on top of the card panel, so "look at the panel" barely turns him at all;
  // "look toward that EDGE of the hero" reliably reads as a clear turn for both characters. `pointer.active`
  // is forced on so the glance works even before the first real mouse move (e.g. a touch device, or the
  // very first interaction on the page).
  const glance = useCallback((dir) => {
    const it = interaction
    // true mobile (no continuous pointer): reuse the existing, already-tested LEFT/CENTER/RIGHT swipe
    // mechanism — the same one a swipe already drives — rather than fabricate a pointer for it.
    if (it.cfg.tracking === 'states') { it.step(dir); return }
    // desktop/tablet: layer the glance on top of an ALREADY-live real pointer only. Forcing pointer.active
    // on synthetically (before any real mouse move) would pair a fake y with the robot's own head anchor —
    // which sits high in the frame — and read as an unintended sharp downward glance, not a sideways one.
    if (!it.pointer.active) return
    const E = engine.current
    // the true hero-space edge (±1), matching what a cursor actually at that edge would send — a
    // character anchored toward one side (the robot sits well to the right) needs the full edge value
    // on its weak side to read as a confident turn; a milder value there was barely visible.
    E.navX = dir < 0 ? -1 : 1
    E.navY = it.pointer.y // match the current vertical gaze exactly, so the glance is purely horizontal
    E.navBoost.reset(1)
    it.wake?.(); it.invalidate?.()
  }, [interaction])

  const go = useCallback((i) => {
    const next = ((i % N) + N) % N
    glance(offsetOf(next, activeRef.current) < 0 ? -1 : 1)
    setActive(next)
  }, [glance])
  const step = useCallback((d) => go(activeRef.current + d), [go])

  /* ── the engine tick (called every frame by useHeroMotion while there is motion) ── */
  useEffect(() => {
    if (!apiRef) return
    const E = engine.current
    apiRef.current = {
      /** @returns {boolean} true while any card is still moving */
      tick(dt) {
        const it = interaction
        const frame = E.bump()
        const pointerMode = !single && it.cfg.tracking === 'pointer' && it.cfg.sens > 0 && it.cfg.cards !== false
        const p = it.pointer
        const hero = heroRef.current?.getBoundingClientRect()
        let moving = false
        let best = -1, bestS = 0
        for (let i = 0; i < N; i++) {
          const c = E.cards[i], oEl = outer.current[i], iEl = inner.current[i]
          if (!oEl || !iEl) continue
          const o = offsetOf(i, activeRef.current)
          const visible = inRing(o) && !single
          // card centres are cached and refreshed every few frames (layout reads are the costly part)
          if (visible && (c.dirty || frame % 10 === 0)) {
            const r = oEl.getBoundingClientRect()
            c.rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, hw: r.width / 2, hh: r.height / 2 }
            c.dirty = false
          }
          let s = 0, tx = 0, ty = 0, rx = 0, ry = 0
          if (visible && pointerMode && p.active && c.rect) {
            const dx = p.cx - c.rect.cx, dy = p.cy - c.rect.cy, d = Math.hypot(dx, dy)
            const R = Math.max(c.rect.hw, c.rect.hh) * 1.1 + 90 // the "approach" radius
            s = smoothstep(0, 1, 1 - d / R) * it.cfg.sens
            const featured = o === 0
            const shift = featured ? 9 : 13, tilt = featured ? 5 : 8
            if (d > 1) { tx = (dx / d) * shift * s; ty = (dy / d) * shift * s }
            ry = clamp(dx / c.rect.hw, -1, 1) * tilt * s
            rx = -clamp(dy / c.rect.hh, -1, 1) * tilt * s
            if (s > bestS) { bestS = s; best = i }
          }
          const T = 0.18
          const vtx = c.tx.update(tx, T, dt), vty = c.ty.update(ty, T, dt)
          const vrx = c.rx.update(rx, T, dt), vry = c.ry.update(ry, T, dt)
          const vsc = c.sc.update(1 + 0.04 * s, T, dt), vem = c.em.update(s, T * 1.2, dt)
          const cardMoving = Math.abs(c.tx.state.v) + Math.abs(c.ty.state.v) + Math.abs(c.rx.state.v) + Math.abs(c.ry.state.v) + Math.abs(c.em.state.v) > 0.01 || Math.abs(vem - s) > 0.004
          if (cardMoving || c.on !== vem > EMPH_ON) {
            iEl.style.transform = `perspective(900px) translate3d(${vtx.toFixed(2)}px,${vty.toFixed(2)}px,0) rotateX(${vrx.toFixed(2)}deg) rotateY(${vry.toFixed(2)}deg) scale(${vsc.toFixed(4)})`
            iEl.style.setProperty('--em', vem.toFixed(3))
          }
          const on = vem > EMPH_ON
          if (on !== c.on) { c.on = on; iEl.toggleAttribute('data-emph', on) }
          if (cardMoving) moving = true
        }
        // publish where the characters should glance (hero space, y up): real mouse proximity to a card,
        // OR — whichever is stronger right now — a recent slide/arrow/swipe "glance" toward the panel.
        const proxS = bestS > 0.12 ? bestS : 0
        const navS = E.navBoost.update(0, 0.5, dt) // jumps to 1 on navigation, eases back over ~1s
        if (navS > proxS) {
          it.focus.x = E.navX; it.focus.y = E.navY; it.focus.id = SERVICES[activeRef.current]?.id ?? null
        } else if (best >= 0 && hero && hero.width) {
          const r = E.cards[best].rect
          it.focus.x = clamp(((r.cx - hero.left) / hero.width) * 2 - 1, -1, 1)
          it.focus.y = clamp(1 - ((r.cy - hero.top) / hero.height) * 2, -1, 1)
          it.focus.id = SERVICES[best].id
        }
        const w = E.focusW.update(Math.max(proxS, navS), 0.25, dt)
        it.focus.w = w
        if (w > 0.002 || Math.abs(E.focusW.state.v) > 0.002 || navS > 0.002 || Math.abs(E.navBoost.state.v) > 0.002) moving = true
        return moving
      },
      markDirty() { E.cards.forEach((c) => { c.dirty = true }) },
    }
    return () => { if (apiRef.current) apiRef.current = null }
  }, [apiRef, interaction, heroRef, single])

  // rects change when the ring rotates or the page resizes/scrolls
  useEffect(() => { engine.current.cards.forEach((c) => { c.dirty = true }) }, [active, single])
  useEffect(() => {
    const dirty = () => engine.current.cards.forEach((c) => { c.dirty = true })
    window.addEventListener('resize', dirty)
    window.addEventListener('scroll', dirty, { passive: true })
    return () => { window.removeEventListener('resize', dirty); window.removeEventListener('scroll', dirty) }
  }, [])

  /* ── autoplay: slow, pauses while the cursor is over the cards or a card has focus ── */
  useEffect(() => {
    if (single || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => { if (!hovering.current && !document.hidden) setActive((a) => (a + 1) % N) }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [single])

  /* ── swipe (single mode): change card, and nudge the characters' LEFT/CENTER/RIGHT state ── */
  const sw = useRef(null)
  const onDown = (e) => { sw.current = { x: e.clientX, y: e.clientY } }
  const onUp = (e) => {
    const s = sw.current; sw.current = null
    if (!s || !single) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { step(dx < 0 ? 1 : -1); interaction.step(dx < 0 ? -1 : 1) }
  }

  const svc = SERVICES[active]
  const Icon = svc.icon

  return (
    <div
      ref={(el) => { rootRef.current = el; if (parallaxRef) parallaxRef.current = el }}
      className={`holo ${single ? 'holo--single' : 'holo--ring'}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Our services"
      onPointerEnter={() => { hovering.current = true }}
      onPointerLeave={() => { hovering.current = false }}
      onFocus={() => { hovering.current = true }}
      onBlur={() => { hovering.current = false }}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1) }}
    >
      <div className="holo-ring">
        <div className="holo-orbit" aria-hidden />
        {SERVICES.map((s, i) => {
          const o = offsetOf(i, active)
          const SIcon = s.icon
          const isActive = o === 0
          if (single && !isActive) return null
          return (
            <div key={s.id} ref={(el) => (outer.current[i] = el)} className="holo-card" data-o={o} style={single ? undefined : ringStyle(o)}>
              {isActive ? (
                <article ref={(el) => (inner.current[i] = el)} className="holo-inner holo-featured" aria-live="polite">
                  <div className="holo-swap" key={s.id}>
                    <span className="holo-badge"><Icon className="w-7 h-7" strokeWidth={1.6} /></span>
                    <p className="holo-eyebrow">Our Services</p>
                    <h3 className="holo-title">{svc.title}</h3>
                    <p className="holo-tagline">{svc.tagline}</p>
                    <ul className="holo-list">
                      {svc.bullets.map((b) => (
                        <li key={b}><Check className="w-3.5 h-3.5" strokeWidth={3} />{b}</li>
                      ))}
                    </ul>
                    <Link to="/services" className="holo-cta">Learn more <ArrowRight className="w-3.5 h-3.5" /></Link>
                  </div>
                </article>
              ) : (
                <button ref={(el) => (inner.current[i] = el)} type="button" className="holo-inner holo-side" onClick={() => go(i)} aria-label={`Show ${s.title}`} tabIndex={inRing(o) ? 0 : -1}>
                  <span className="holo-side-icon"><SIcon className="w-6 h-6" strokeWidth={1.5} /></span>
                  <span className="holo-side-title">{s.title}</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="holo-controls">
        <button type="button" className="holo-arrow" onClick={() => step(-1)} aria-label="Previous service"><ChevronLeft className="w-4 h-4" /></button>
        <div className="holo-dots" aria-hidden>
          {SERVICES.map((s, i) => <span key={s.id} className={i === active ? 'on' : ''} />)}
        </div>
        <button type="button" className="holo-arrow" onClick={() => step(1)} aria-label="Next service"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}
