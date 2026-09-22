import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Smoothed, clamp, smoothstep } from '../hero3d/cursor/smoothing'
import { SERVICES, SERVICE_START } from './services'
import { ARROWS, ARROWS_COMPACT, CAROUSEL, CAROUSEL_COMPACT, CURSOR, FLAT, NOTE, RING_PATH, SPARKLE } from './serviceGeometry'
import { faceWeights, makeTrack, quadMatrix } from './serviceCarousel'

const N = SERVICES.length
const AUTOPLAY_MS = 6000
const T_TARGET = 0.17 // s — first spring: the (integer) target → a soft start
const T_POS = 0.2 // s — second spring: … → the position the cards are drawn at. Together ≈ 0.85 s to settle.
const T_DRAG = 0.07 // s — while dragging the cards follow the pointer, just smoothed
const DRAG_START = 7 // px before a press becomes a drag
const wrap = (d) => d - N * Math.round(d / N) // shortest signed offset on the ring
const mod = (i) => ((i % N) + N) % N

/* ── one service card. The DOM is built once; the engine moves and cross-fades it by writing styles (no React per frame). ── */
const PAD = 22 // the side titles get a little room, so a title wraps where the design wraps it and no earlier
const Card = memo(function Card({ svc, index, registry, geom, current, sideSlot, onPick }) {
  const Icon = svc.icon
  const long = svc.title.length > 21 // "Custom Software Development" wraps to two lines at a smaller size
  return (
    <div ref={(el) => { registry[index] = el }} className="svc-card" data-role="off" data-service={svc.id} style={{ width: FLAT.w, height: FLAT.h }}>
      <div className="svc-glass svc-glass--side" />
      <div className="svc-glass svc-glass--feat" data-f={geom.faces.length} />

      {geom.faces.map((f, idx) => {
        if (f.key === 'featured') {
          return (
            <div key={f.key} className="svc-face svc-face--feat" data-f={idx} aria-hidden={!current}>
              <span className="svc-badge"><Icon strokeWidth={2} /></span>
              <div className="svc-main">
                <div className="svc-text">
                  <p className="svc-eyebrow">Our Services</p>
                  <h3 className={`svc-title${long ? ' svc-title--long' : ''}`}>{svc.title}</h3>
                  <p className="svc-tagline">{svc.tagline}</p>
                </div>
                <div className="svc-gap" />
                <ul className="svc-list">
                  {svc.bullets.map((b) => (<li key={b}><Check strokeWidth={3} />{b}</li>))}
                </ul>
              </div>
              <div className="svc-cta-wrap">
                <Link to="/services" className="svc-cta" tabIndex={current ? 0 : -1}>Learn more <ArrowRight strokeWidth={2} /></Link>
              </div>
            </div>
          )
        }
        // a side layout is authored in its slot's own flat box and scaled onto the shared card frame
        return (
          <div key={f.key} className="svc-face svc-face--side" data-f={idx} aria-hidden="true" style={{ width: f.w, height: f.h, transform: `scale(${FLAT.w / f.w}, ${FLAT.h / f.h})` }}>
            <span className="svc-side-icon" style={{ left: f.icon.x, top: f.icon.y, width: f.icon.w, height: f.icon.h }}><Icon strokeWidth={1.7} /></span>
            {f.title && (
              <span className={`svc-side-title svc-side-title--${f.align}`} style={{ left: f.title.x - (f.align === 'center' ? PAD / 2 : 0), top: f.title.y, width: f.title.w + PAD }}>{svc.title}</span>
            )}
          </div>
        )
      })}

      {/* the whole side card is the button (only live while the card is a side card — see data-role in the CSS) */}
      <button type="button" className="svc-hit" onClick={onPick} aria-label={`Show ${svc.title}`} tabIndex={sideSlot ? 0 : -1} />
    </div>
  )
})

export default function ServiceCluster({ interaction, heroRef, apiRef, compact = false }) {
  const G = compact ? CAROUSEL_COMPACT : CAROUSEL
  const [active, setActive] = useState(SERVICE_START)
  const activeRef = useRef(active)
  activeRef.current = active
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const hovering = useRef(false)
  const onScreen = useRef(true)
  const registry = useRef([]).current // the card elements
  const engine = useRef(null)
  if (!engine.current) {
    engine.current = {
      target: SERVICE_START, mid: new Smoothed(SERVICE_START), pos: new Smoothed(SERVICE_START), drag: null, dragPos: SERVICE_START, justDragged: false,
      focusW: new Smoothed(0), em: new Smoothed(0), lastEm: -1, rect: null, frame: 0, k: 1,
      hold: false, cache: [], tmp: new Float64Array(9), w: new Float64Array(8), lastPresent: 0, wheelAcc: 0, wheelT: 0, wheelLock: 0,
    }
  }
  // the track through the slots + where each face sits: rebuilt only if the layout (desktop ↔ phone) changes
  const trackRef = useRef(null)
  if (!trackRef.current || trackRef.current.G !== G) {
    const ats = G.faces.map((f) => f.at), feat = G.faces.findIndex((f) => f.key === 'featured')
    trackRef.current = { G, at: makeTrack(G.knots), layout: { ats, feat, dips: ats.map((_, k) => k === feat || k + 1 === feat) } }
  }

  /* ── fit the fixed canvas to the box ── */
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const fit = () => { if (el.clientWidth) { engine.current.k = el.clientWidth / G.stage.w; el.style.setProperty('--k', String(engine.current.k)) } }
    fit()
    const ro = new ResizeObserver(() => { fit(); engine.current.rect = null })
    ro.observe(el)
    return () => ro.disconnect()
  }, [G])

  /* ── place every card for a position `p` (in services). Writes styles straight to the DOM.
        Returns where the characters should look: the moving cards' centre relative to the featured slot (-1 … 1). ── */
  const place = useCallback((p, velSign) => {
    const E = engine.current, { at, layout } = trackRef.current, tmp = E.tmp, w = E.w
    let sw = 0, sx = 0
    for (let i = 0; i < N; i++) {
      const c = E.cache[i]
      if (!c) continue
      const o = wrap(i - p)
      if (o < -2 || o > 3) { if (c.role !== 'off') { c.el.dataset.role = 'off'; c.role = 'off' } continue }
      at(o, tmp)
      const a = tmp[8]
      if (a < 0.004) { if (c.role !== 'off') { c.el.dataset.role = 'off'; c.role = 'off' } continue }
      const st = c.el.style
      st.transform = quadMatrix(tmp, FLAT.w, FLAT.h)
      st.opacity = a > 0.996 ? '1' : a.toFixed(3)
      // depth order: nearer the middle = in front; of two equally near, the one travelling toward the middle wins
      st.zIndex = String(100 - Math.round(Math.abs(o) * 24) + (o * velSign > 0 ? 3 : 0))
      const role = Math.abs(o) < 0.5 ? 'feat' : 'side'
      if (c.role !== role) { c.el.dataset.role = role; c.role = role }
      faceWeights(o, layout, w)
      for (let f = 0; f < c.faces.length; f++) {
        const v = w[c.faces[f].idx]
        const s = c.faces[f].el.style
        s.opacity = v > 0.996 ? '1' : v < 0.004 ? '0' : v.toFixed(3)
      }
      const ao = Math.abs(o)
      if (ao < 1) { const k = (1 - ao) * (1 - ao) * (1 - ao); sw += k; sx += k * (tmp[0] + tmp[2] + tmp[4] + tmp[6]) / 4 }
    }
    return sw > 0 ? clamp((sx / sw - G.cx0) / G.presentSpan, -1, 1) : 0
  }, [G])

  // build the per-card cache (which elements to cross-fade) once the cards exist, and place them before the first paint
  useLayoutEffect(() => {
    const E = engine.current
    E.cache = registry.map((el) => el && ({ el, role: 'off', faces: [...el.querySelectorAll('[data-f]')].map((n) => ({ el: n, idx: +n.dataset.f })) }))
    place(E.pos.value, 0)
  }, [registry, place, G])

  /* ── navigation ── */
  const go = useCallback((delta) => {
    if (!delta) return
    const E = engine.current
    E.target += delta
    setActive(mod(E.target))
    interaction?.wake?.(); interaction?.invalidate?.()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { // no slide: swap at once
      E.mid.reset(E.target); E.pos.reset(E.target); place(E.target, 0)
    }
  }, [interaction, place])
  const step = useCallback((d) => go(d), [go])
  const pick = useCallback((i) => go(wrap(i - engine.current.target)), [go])

  /* ── auto-rotation: 6 s per service. The timer is keyed on `active`, so any change restarts it. ── */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let id = 0
    const arm = (ms) => {
      id = window.setTimeout(() => {
        if (hovering.current || engine.current.hold || document.hidden || !onScreen.current || engine.current.drag) arm(600) // paused: look again shortly
        else go(1)
      }, ms)
    }
    arm(AUTOPLAY_MS)
    return () => window.clearTimeout(id)
  }, [active, go])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ── horizontal wheel / trackpad swipe = one service per gesture (vertical scrolling is left to the page) ── */
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2 || Math.abs(e.deltaX) < 2) return
      e.preventDefault() // also stops the browser's swipe-to-go-back
      const E = engine.current, now = performance.now()
      if (now < E.wheelLock) { if (Math.abs(e.deltaX) > 3) E.wheelLock = Math.max(E.wheelLock, now + 140); return } // still inside the last swipe's inertia
      if (now - E.wheelT > 200) E.wheelAcc = 0
      E.wheelT = now
      E.wheelAcc += e.deltaX
      if (Math.abs(E.wheelAcc) >= 48) { step(E.wheelAcc > 0 ? 1 : -1); E.wheelAcc = 0; E.wheelLock = now + 600 }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [step])

  /* ── drag / swipe: the cards follow the pointer, and a release settles on the nearest service (a flick carries on) ── */
  const onPointerDown = (e) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.svc-arrow')) return
    const E = engine.current
    E.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, t: e.timeStamp, vx: 0, pos0: E.pos.value, base: Math.round(E.pos.value), pos: E.pos.value, on: false, el: e.target }
  }
  const onPointerMove = (e) => {
    const E = engine.current, d = E.drag
    if (!d || e.pointerId !== d.id) return
    const dx = e.clientX - d.x0
    if (!d.on) {
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) < Math.abs(e.clientY - d.y0)) return
      d.on = true
      try { d.el.setPointerCapture(e.pointerId) } catch { /* the element may be gone */ }
    }
    // the event's own timestamp (not "now"): a busy main thread that batches moves must not inflate the flick speed
    const now = e.timeStamp
    d.vx = d.vx * 0.7 + ((e.clientX - d.x) / Math.max(8, now - d.t)) * 1000 * 0.3
    d.x = e.clientX; d.t = now
    d.pos = clamp(d.pos0 - dx / (G.unit * E.k), d.pos0 - 1.4, d.pos0 + 1.4)
    E.dragPos = d.pos
    interaction?.wake?.(); interaction?.invalidate?.()
  }
  const endDrag = (e) => {
    const E = engine.current, d = E.drag
    if (!d || e.pointerId !== d.id) return
    E.drag = null
    if (!d.on) return
    E.justDragged = true
    window.setTimeout(() => { E.justDragged = false }, 0) // swallows the click that follows a drag (a link / side card)
    if (e.type === 'pointercancel') { E.mid.reset(d.pos); return } // the browser took the gesture (a vertical scroll): settle where we are
    const unit = G.unit * E.k
    let t = Math.round(d.pos - (d.vx / unit) * 0.16) // a flick looks ~160 ms ahead
    const moved = d.pos - d.pos0
    if (t === d.base && Math.abs(moved) > 0.22) t = d.base + Math.sign(moved) // dragged past ~¼ of a card: commit
    t = clamp(t, d.base - 2, d.base + 2)
    E.mid.reset(d.pos)
    E.target = t
    setActive(mod(t))
    interaction?.wake?.(); interaction?.invalidate?.()
  }

  /* ── the engine the hero's motion loop ticks. It moves the cards, and publishes to the characters:
     (a) where the moving cards are (`interaction.present.x`) — the characters watch them slide and settle on the featured one;
     (b) where to look while the cursor approaches the featured card (the card's resting position, strength by distance).
     Returns true while anything is still easing, so the loop keeps running. ── */
  useEffect(() => {
    if (!apiRef || !interaction) return
    const E = engine.current
    apiRef.current = {
      tick(dt) {
        const it = interaction
        E.frame++
        // ── the position: target → (spring) → mid → (spring) → pos; while dragging, the pointer is the target ──
        const dragging = !!(E.drag && E.drag.on)
        let pos
        if (dragging) {
          E.mid.reset(E.dragPos)
          pos = E.pos.update(E.dragPos, T_DRAG, dt)
        } else {
          const mid = E.mid.update(E.target, T_TARGET, dt)
          pos = E.pos.update(mid, T_POS, dt)
        }
        let posMoving = dragging
        if (!dragging) {
          const off = Math.abs(pos - E.target), v = Math.abs(E.pos.state.v) + Math.abs(E.mid.state.v)
          if (off < 0.0006 && v < 0.004) { E.mid.reset(E.target); E.pos.reset(E.target); pos = E.target } else posMoving = true
        }
        const velSign = Math.sign(E.pos.state.v)
        const px = place(pos, velSign)
        if (Math.abs(px - E.lastPresent) > 0.0002) { E.lastPresent = px; it.present.x = px; it.invalidate?.() }

        // ── the cursor approaching the featured card ──
        let s = 0
        const pointerMode = it.cfg.tracking === 'pointer' && it.cfg.sens > 0 && it.cfg.cards !== false
        const p = it.pointer
        const root = rootRef.current
        // the featured card's RESTING box in client px, from the fixed geometry (not from the moving element)
        if (root && (E.rect === null || E.frame % 10 === 0)) {
          const r = root.getBoundingClientRect(), k = r.width / G.stage.w, B = G.bounds
          E.rect = { cx: r.left + (B.x + B.w / 2) * k, cy: r.top + (B.y + B.h / 2) * k, hw: (B.w / 2) * k, hh: (B.h / 2) * k }
        }
        if (pointerMode && p.active && E.rect) {
          const dx = p.cx - E.rect.cx, dy = p.cy - E.rect.cy, dist = Math.hypot(dx, dy)
          const R = Math.max(E.rect.hw, E.rect.hh) * 1.1 + 90
          s = smoothstep(0, 1, 1 - dist / R) * it.cfg.sens
        }
        const proxS = s > 0.12 ? s : 0
        if (proxS > 0 && E.rect) {
          const hero = heroRef?.current?.getBoundingClientRect()
          if (hero && hero.width) {
            it.focus.x = clamp(((E.rect.cx - hero.left) / hero.width) * 2 - 1, -1, 1)
            it.focus.y = clamp(1 - ((E.rect.cy - hero.top) / hero.height) * 2, -1, 1)
            it.focus.id = SERVICES[activeRef.current]?.id ?? null
          }
        }
        const w = E.focusW.update(proxS, 0.25, dt)
        it.focus.w = w
        // a soft emphasis on the featured card while the cursor is near it (glow + brighter rim, in CSS via --em)
        const em = E.em.update(s, 0.22, dt)
        if (stageRef.current && Math.abs(em - E.lastEm) > 0.004) { stageRef.current.style.setProperty('--em', em.toFixed(3)); E.lastEm = em }
        return posMoving || Math.abs(E.lastPresent) > 0.0002 || w > 0.002 || Math.abs(E.focusW.state.v) > 0.002 || Math.abs(em - s) > 0.004 || Math.abs(E.em.state.v) > 0.004
      },
    }
    // dev builds only: lets the DevTools test harness freeze the carousel at a fractional position (`at`) or read its state
    if (import.meta.env.DEV) {
      window.__vbCarousel = {
        // freeze at position p (the target too, so the springs and the autoplay leave it alone until `pause(false)` / a real change)
        at(p) { E.target = p; E.mid.reset(p); E.pos.reset(p); E.hold = true; const x = place(p, 1); interaction.present.x = x; E.lastPresent = x; interaction.invalidate?.(); return x },
        pause: (v = true) => { E.hold = v }, // sticky (the cursor entering / leaving the cards does not un-pause it)
        state: () => ({ pos: E.pos.value, target: E.target, present: interaction.present.x }),
      }
    }
    return () => { if (apiRef.current) apiRef.current = null; interaction.present.x = 0 }
  }, [apiRef, interaction, heroRef, place, G])

  // which card is where (for aria / tab order): the offset from the active service
  const slotOf = (i) => wrap(i - active)
  const feat = SERVICES[active]
  const A = compact ? ARROWS_COMPACT : ARROWS

  return (
    <div
      ref={rootRef}
      className={`vb-cards${compact ? ' vb-cards--compact' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Our services"
      onPointerEnter={() => { hovering.current = true }}
      onPointerLeave={() => { hovering.current = false }}
      onFocus={() => { hovering.current = true }}
      onBlur={() => { hovering.current = false }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => { if (engine.current.justDragged) { e.preventDefault(); e.stopPropagation() } }}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1) }}
    >
      <div className="vb-cards-par">
        <div className="vb-cards-enter">
          <div ref={stageRef} className="svc-stage" style={{ width: G.stage.w, height: G.stage.h }}>
            {!compact && (
              <>
                {/* the orbit ring, behind everything */}
                <svg className="svc-ring" width={G.stage.w} height={G.stage.h} viewBox={`0 0 ${G.stage.w} ${G.stage.h}`} aria-hidden="true">
                  <defs>
                    <linearGradient id="svc-ring-grad" gradientUnits="userSpaceOnUse" x1="20" y1="470" x2="1060" y2="150">
                      <stop offset="0" stopColor="#35e8c7" stopOpacity="0.45" />
                      <stop offset="0.5" stopColor="#67f2de" stopOpacity="0.32" />
                      <stop offset="1" stopColor="#35e8c7" stopOpacity="0.22" />
                    </linearGradient>
                    <filter id="svc-ring-glow" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path d={RING_PATH} fill="none" stroke="url(#svc-ring-grad)" strokeWidth="1.6" strokeLinecap="round" filter="url(#svc-ring-glow)" />
                </svg>

                {/* the hand-written hint */}
                <div className="svc-note" aria-hidden="true" style={{ left: NOTE.text.x, top: NOTE.text.y, transform: `rotate(${NOTE.text.rotate}deg)` }}>
                  Move your cursor<br />to explore services.
                </div>
                <svg className="svc-note-arrow" width={G.stage.w} height={G.stage.h} viewBox={`0 0 ${G.stage.w} ${G.stage.h}`} aria-hidden="true">
                  <path d={NOTE.arrow} /><path d={NOTE.headTop} /><path d={NOTE.headEnd} />
                </svg>
                <svg className="svc-cursor" width="15" height="17" viewBox="0 0 26 30" style={{ left: CURSOR.x, top: CURSOR.y }} aria-hidden="true">
                  <path d="M2 2 L2 22 L8 17 L12 27 L16 25 L12 16 L20 16 Z" />
                </svg>

                {/* 4-point sparkle star on the orbit ring */}
                {SPARKLE && (
                  <svg className="svc-sparkle" style={{ left: SPARKLE.x, top: SPARKLE.y, width: SPARKLE.size, height: SPARKLE.size }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z" fill="#b0fff5" />
                  </svg>
                )}
              </>
            )}

            {/* the ring of cards: every service is one card; the engine slides them through the slots */}
            {SERVICES.map((svc, i) => {
              const o = slotOf(i)
              return (
                <Card
                  key={svc.id} svc={svc} index={i} registry={registry} geom={G}
                  current={o === 0} sideSlot={o !== 0 && o >= G.faces[0].at && o <= G.faces[G.faces.length - 1].at}
                  onPick={() => pick(i)}
                />
              )
            })}

            {/* the round arrows — they never move */}
            {[['prev', -1, ChevronLeft, 'Previous service'], ['next', 1, ChevronRight, 'Next service']].map(([k, d, Chev, label]) => (
              <button key={k} type="button" className="svc-arrow" onClick={() => step(d)} aria-label={label}
                style={{ left: A[k].x - A[k].d / 2, top: A[k].y - A[k].d / 2, width: A[k].d, height: A[k].d }}>
                <Chev strokeWidth={2} />
              </button>
            ))}

            {compact && (
              <div className="svc-dots" aria-hidden="true" style={{ left: 0, width: G.stage.w, top: ARROWS_COMPACT.dots.y - 4 }}>
                {SERVICES.map((s, i) => <span key={s.id} className={i === active ? 'on' : ''} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{feat.title}</p>
    </div>
  )
}
