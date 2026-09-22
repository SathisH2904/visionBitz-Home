import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import Robot from './characters/Robot'
import Boy from './characters/Boy'
import { CAMERA, CAMERA_RIG, DESIGN, LAYOUTS } from './composition'
import { MODES, createInteraction } from './interaction/heroInteraction'
import { useHeroInput } from './interaction/useHeroInput'
import { QUALITY, tierFor } from './quality'
import { Smoothed, lerp } from './cursor/smoothing'

/**
 * HeroCharacterScene — the hero's 3D scene: the robot and (in layouts that have one) the boy, both driven by the shared
 * interaction state. Both are unlit painted models — no lights, no environment map.
 *
 * Props
 *   interaction     the hero's shared interaction object (see interaction/heroInteraction.js). Omit it and the
 *                   scene makes its own and listens to the pointer itself (standalone dev pages).
 *   layout          'hero' (desktop) | 'stack' (tablet/phone) | 'master' (dev: reproduces the reference image)
 *   quality         'high' | 'medium' | 'lite' — default: from the interaction mode, stepped down on weak hardware
 *   embedded        true = fill the parent (absolute, transparent). false = a standalone dev frame.
 *   paused          stop rendering (off-screen / hidden tab)
 *   onLoaded        called once the characters are in the scene and their shaders are compiled
 *   still           capture mode: DPR 1, keeps the drawing buffer
 *   robotAmbient    the robot's ambient life (blink, breathing, float, shoulders); cameraRig = the cinematic camera
 *   robotFollow, boyFollow, orbit (TEMPORARY OrbitControls)   dev overrides
 *   bg, refOpacity, pointerOverride, interactive   standalone dev frame only
 *
 * Rendering is ON DEMAND (frameloop="demand"): a frame is drawn only while something is moving (a rig
 * still settling, the parallax loop, a pointer move). An idle hero costs no GPU.
 */

const BACKDROPS = {
  dark: 'radial-gradient(90% 120% at 65% 40%, #103c3e 0%, #0a2a2c 45%, #061a1e 100%)',
  transparent: 'transparent',
}

/**
 * CameraRig — the cinematic camera for scenes that ask for it. The camera stays aimed at the robot and only drifts:
 * a few centimetres with the smoothed pointer (parallax) and a slow dolly with the page's slide progress. Critically
 * damped, so it eases in and out and never shakes.
 */
function CameraRig({ itRef, depth }) {
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const sm = useRef(null)
  if (!sm.current) sm.current = { x: new Smoothed(0), y: new Smoothed(0), z: new Smoothed(0) }
  useFrame((_, delta) => {
    const it = itRef.current
    if (!it) return
    const dt = Math.min(delta, 1 / 20), k = it.cfg.parallax, s = sm.current
    const tx = it.sm.x * CAMERA_RIG.x * k, ty = it.sm.y * CAMERA_RIG.y * k
    const tz = -(it.scroll.p * CAMERA_RIG.dolly + Math.min(1, Math.abs(it.scroll.v)) * CAMERA_RIG.push) * k
    const x = s.x.update(tx, 0.8, dt), y = s.y.update(ty, 0.8, dt), z = s.z.update(tz, 1.0, dt)
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, -depth)
    if (Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(z - tz) > 0.0005 || Math.abs(s.x.state.v) + Math.abs(s.y.state.v) + Math.abs(s.z.state.v) > 0.0005) invalidate()
  })
  return null
}

function Content({ itRef, L, quality, onReady, robotFollow, boyFollow, rigs, orbit, ambient, cameraRig }) {
  const q = QUALITY[quality]
  const invalidate = useThree((s) => s.invalidate)
  const setDpr = useThree((s) => s.setDpr)

  // the shared interaction wakes this scene (input → invalidate) instead of the scene polling
  useEffect(() => {
    const it = itRef.current
    it.invalidate = invalidate
    invalidate()
    return () => { if (it.invalidate === invalidate) it.invalidate = null }
  }, [itRef, invalidate])

  // no lights, no environment map: the characters are unlit textured models (see Character.jsx). Each loads on its own.
  return (
    <>
      <Suspense fallback={null}>
        <Robot interaction={itRef} layout={L} follow={robotFollow} ambient={ambient} rigRef={rigs.robot} onReady={onReady} />
      </Suspense>
      {L.boy && (
        <Suspense fallback={null}>
          <Boy interaction={itRef} layout={L} follow={boyFollow} rigRef={rigs.boy} onReady={onReady} />
        </Suspense>
      )}
      {/* settle the pixel ratio anywhere inside the tier's range according to real frame rate */}
      <PerformanceMonitor onChange={({ factor }) => setDpr(lerp(q.dpr[0], q.dpr[1], factor))} />
      {cameraRig && <CameraRig itRef={itRef} depth={L.robot.depth} />}
      {/* TEMPORARY: debugging only — detaches the camera from the composition */}
      {orbit && <OrbitControls makeDefault enableDamping />}
    </>
  )
}

/**
 * Compiles every shader program BEFORE the first frame, using the browser's parallel shader compilation
 * (KHR_parallel_shader_compile) where available — so the compile happens off the main thread and the
 * first visible frame does not hitch. Falls back to a plain first render where it is not supported.
 */
function CompileGate({ ready, onDone }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const compile = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve()
    compile.catch(() => {}).finally(() => { if (!cancelled) { invalidate(); onDone() } })
    return () => { cancelled = true }
  }, [ready, gl, scene, camera, invalidate, onDone])
  return null
}

/** Dev capture: after `seconds` of running clock, report where the robot lands. */
function ReportDriver({ seconds, ready, rigs }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const t = useRef(0)
  const done = useRef(false)
  useFrame((_, delta) => {
    if (!ready || done.current) return
    t.current += Math.min(delta, 0.05)
    if (t.current < seconds) { invalidate(); return }
    done.current = true
    camera.updateMatrixWorld()
    const px = (v) => { const p = v.clone().project(camera); return [Math.round(((p.x + 1) / 2) * size.width), Math.round(((1 - p.y) / 2) * size.height)] }
    const report = { canvas: [size.width, size.height] }
    scene.traverse((o) => {
      const child = o.isGroup && o.children.length === 1 ? o.children[0] : null
      const who = child && { VisionBitz_Robot: 'robot', VisionBitz_Boy: 'boy' }[child.name]
      if (!who) return
      const box = new THREE.Box3().setFromObject(o)
      report[who] = { minPx: px(box.min), maxPx: px(box.max) }
    })
    report.rig = { robot: rigs.robot.current?.getState(), boy: rigs.boy.current?.getState() }
    document.body.dataset.heroInspect = JSON.stringify(report)
    document.body.dataset.heroStatus = 'rendered'
  })
  return null
}

function DebugBridge({ rigs }) {
  const get = useThree((s) => s.get)
  useEffect(() => {
    window.__hero = { three: get, state: () => ({ robot: rigs.robot.current?.getState(), boy: rigs.boy.current?.getState() }) }
    return () => { delete window.__hero }
  }, [rigs, get])
  return null
}

export default function HeroCharacterScene({
  interaction: external,
  layout = 'hero',
  quality: qProp,
  embedded = false,
  paused = false,
  onLoaded,
  bg = 'dark',
  refOpacity = 0,
  interactive = true,
  pointerOverride = null,
  robotFollow,
  boyFollow,
  robotAmbient = false, // blinking / breathing / float / shoulders (portfolio hero)
  cameraRig = false, // the cinematic camera (portfolio hero)
  still = false,
  seconds = 4,
  orbit = false,
}) {
  const L = LAYOUTS[layout] || LAYOUTS.hero
  const wrapRef = useRef(null)
  const own = useMemo(() => (external ? null : createInteraction()), [external])
  const it = external || own
  const itRef = useRef(it)
  itRef.current = it
  useHeroInput(wrapRef, own) // standalone only — inside the hero, HomeHero owns the input

  // standalone dev overrides
  useEffect(() => {
    if (external) return
    if (!interactive) { it.mode = 'reduced'; it.cfg = MODES.reduced; it.pointer.active = false }
    if (pointerOverride) { it.pointer.x = pointerOverride.x; it.pointer.y = pointerOverride.y; it.pointer.active = true; it.invalidate?.() }
  }, [external, interactive, pointerOverride, it])

  const quality = qProp || tierFor(it.cfg.quality)
  const q = QUALITY[quality]
  const rigs = useRef({ robot: { current: null }, boy: { current: null } }).current

  const [ready, setReady] = useState({})
  const onReady = useCallback((name) => setReady((r) => (r[name] ? r : { ...r, [name]: true })), [])
  const allReady = !!ready.robot && (!L.boy || !!ready.boy)
  const [compiled, setCompiled] = useState(false)
  const onCompiled = useCallback(() => setCompiled(true), [])
  const notified = useRef(false)
  // 'loaded' = every character is in the scene AND the shaders are compiled — the moment the first frame is smooth
  useEffect(() => { if (allReady && compiled && !notified.current) { notified.current = true; onLoaded?.() } }, [allReady, compiled, onLoaded])

  const wrapStyle = embedded
    ? { position: 'absolute', inset: 0 }
    : { position: 'relative', width: '100%', maxWidth: DESIGN.width, aspectRatio: `${DESIGN.width} / ${DESIGN.height}`, background: BACKDROPS[bg] || BACKDROPS.dark, overflow: 'hidden' }

  return (
    <div ref={wrapRef} style={wrapStyle}>
      {!embedded && refOpacity > 0 && (
        <img src="/dev/ref/master-reference.jpg" alt="" style={{ position: 'absolute', left: 0, top: 0, width: '100%', transform: 'translateY(-8.398%)', opacity: refOpacity, pointerEvents: 'none' }} />
      )}
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [0, 0, 0] }}
        dpr={still ? 1 : q.dpr}
        frameloop={paused ? 'never' : 'demand'}
        gl={{ alpha: true, antialias: q.aa, powerPreference: quality === 'lite' ? 'low-power' : 'high-performance', preserveDrawingBuffer: still }}
      >
        <Content itRef={itRef} L={L} quality={quality} onReady={onReady} robotFollow={robotFollow} boyFollow={boyFollow} rigs={rigs} orbit={orbit} ambient={robotAmbient} cameraRig={cameraRig} />
        <CompileGate ready={allReady} onDone={onCompiled} />
        <DebugBridge rigs={rigs} />
        {still && <ReportDriver seconds={seconds} ready={allReady} rigs={rigs} />}
      </Canvas>
    </div>
  )
}
