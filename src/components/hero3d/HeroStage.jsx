import { Component, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HeroCharacterScene from './HeroCharacterScene'

/**
 * HeroStage — the 3D layer of the hero (the robot). Lazy-loaded by HomeHero, after the browser is idle, so
 * three.js and the model never compete with first paint.
 *
 * It fills its parent (the hero's `.vb-stage` box), transparent, and never takes pointer events. The
 * pointer / swipe input is owned by HomeHero (one shared interaction object). Behaviour:
 *   · fades and rises in once the model is loaded, so a half-built character is never shown
 *   · stops rendering while the hero is off screen or the tab is hidden
 *   · if anything throws (WebGL context lost, bad GLB…) it renders nothing and the rest of the hero
 *     carries on unchanged
 */
class StageBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.warn('[HeroStage] disabled after an error:', error) }
  render() { return this.state.failed ? null : this.props.children }
}

function useRendering(hostRef) {
  const [onScreen, setOnScreen] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    const onVis = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [hostRef])
  return onScreen && tabVisible
}

export default function HeroStage({ interaction, layout = 'hero', hostRef, robotFollow, robotAmbient, cameraRig }) {
  const rendering = useRendering(hostRef)
  const [loaded, setLoaded] = useState(false)
  return (
    <StageBoundary>
      <motion.div
        className="absolute inset-0 pointer-events-none select-none"
        aria-hidden="true"
        data-vb-hero3d
        initial={{ opacity: 0, y: 18 }}
        animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <HeroCharacterScene interaction={interaction} layout={layout} embedded paused={!rendering} onLoaded={() => setLoaded(true)} robotFollow={robotFollow} robotAmbient={robotAmbient} cameraRig={cameraRig} />
      </motion.div>
    </StageBoundary>
  )
}
