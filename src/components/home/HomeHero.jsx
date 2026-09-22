import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MotionConfig, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import HeroParticles from '../HeroParticles'
import { InteractionContext, createInteraction } from '../hero3d/interaction/heroInteraction'
import { useHeroInput } from '../hero3d/interaction/useHeroInput'
import { useHero3DEnabled } from '../hero3d/flags'
import ServiceCluster from './ServiceCluster'
import { useHeroMotion } from './useHeroMotion'
import { useMediaQuery } from './useMediaQuery'
import './home.css'

/* three.js + models are code-split and only requested when the browser is idle after first paint */
const HeroStage = lazy(() => import('../hero3d/HeroStage'))

const container = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } } }
const rise = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }
const lineUp = { hidden: { y: '105%' }, show: { y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } } }

export default function HomeHero() {
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const bgRef = useRef(null)
  const particlesRef = useRef(null)
  const holoApi = useRef(null)
  const layers = useMemo(() => ({ bg: bgRef, particles: particlesRef }), [])

  // ONE shared interaction object: the robot's and the boy's rigs, the parallax loop and the service cards all read it.
  const interaction = useMemo(() => createInteraction(), [])
  useHeroInput(stageRef, interaction)
  useHeroMotion({ interaction, heroRef, layers, holoApi })

  // dev builds only: lets the DevTools test harness read the shared interaction state
  useEffect(() => { if (import.meta.env.DEV) window.__vbInteraction = interaction }, [interaction])

  const desktop = useMediaQuery('(min-width: 1024px)')
  const compact = !useMediaQuery('(min-width: 768px)') // desktop + tablet: the reference composition; phones: the compact carousel
  const hero3d = useHero3DEnabled()

  return (
    <MotionConfig reducedMotion="user">
      <InteractionContext.Provider value={interaction}>
        <section ref={heroRef} data-vb-hero className="vb-hero" aria-label="Vision Bitz — solutions built around your business">
          {/* layer 1 — background (very subtle parallax) · layer 2 — ambient particles (subtle) */}
          <div ref={bgRef} className="vb-bg" aria-hidden="true" />
          <div ref={particlesRef} className="vb-particles" aria-hidden="true"><HeroParticles /></div>

          {/* ── copy ── */}
          <motion.div className="vb-copy" variants={container} initial="hidden" animate="show">
            <motion.p variants={rise} className="vb-eyebrow">
              <span>Digital Solutions</span><i /><span>IT Services</span><i /><span>Business Growth</span>
            </motion.p>
            <h1 className="vb-h1">
              <span className="line"><motion.span variants={lineUp} style={{ display: 'block' }}>Solutions Built</motion.span></span>
              <span className="line"><motion.span variants={lineUp} style={{ display: 'block' }}>Around <em>Your Business.</em></motion.span></span>
            </h1>
            <motion.p variants={rise} className="vb-lead">
              Vision Bitz Techno Solutions helps businesses grow online and build better systems for the way they work.
            </motion.p>
            <motion.p variants={rise} className="vb-sub">
              From Digital Marketing to Custom Software Development, AI Solutions, CRM, ERP and more — we help you stay ahead with smart, scalable and result-driven technology.
            </motion.p>
            <motion.div variants={rise} className="vb-cta">
              <Link to="/contact" className="vb-btn">Get a free proposal <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/services" className="vb-btn vb-btn--ghost">Explore our services</Link>
            </motion.div>
          </motion.div>

          {/* ── layer 3 & 4 — the characters: the boy and the robot, two 3D models in one transparent scene (small parallax) ── */}
          <div ref={stageRef} className="vb-stage">
            {hero3d && (
              <Suspense fallback={null}>
                <HeroStage interaction={interaction} layout={desktop ? 'hero' : 'stack'} hostRef={stageRef} />
              </Suspense>
            )}
          </div>

          {/* ── layer 5 — service cards: a 3D carousel of real HTML drawn to the approved design (desktop + tablet: the reference
               composition scaled to fit; phones: a compact version with the neighbours peeking out either side). The cards are
               anchored — no parallax, no floating; they only slide when the service changes. The same `holoApi` tick moves them
               and feeds the characters: where the cards are (so the robot watches them slide) and the cursor's focus. ── */}
          <ServiceCluster key={compact ? "compact" : "wide"} interaction={interaction} heroRef={stageRef} apiRef={holoApi} compact={compact} />

          {/* the gold gem (DiamondFlight) parks on these anchors — see DiamondFlight.jsx's logoSpot() */}
          <span data-vb-art aria-hidden="true" className="hidden lg:block absolute pointer-events-none" style={{ width: 150, height: 100, left: 'calc(48.5% - 97px)', top: 'calc(20% - 32px)' }} />
          <span data-vb-art-mobile aria-hidden="true" className="lg:hidden absolute pointer-events-none" style={{ width: 150, height: 100, left: 'calc(84% - 97px)', top: 'calc(6% - 32px)' }} />
        </section>
      </InteractionContext.Provider>
    </MotionConfig>
  )
}
