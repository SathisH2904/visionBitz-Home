import { Component, Suspense, useCallback, useLayoutEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * RobotTestScene — isolated debug scene. Its only job is to prove that the robot
 * GLB loads and looks right. No cursor tracking, no parallax, no HTML cards, no
 * post-processing. OrbitControls is here temporarily, for inspecting the model.
 *
 * Status is written to <body data-robot-*> so it can be read without a UI.
 *
 * KNOWN GLB DEFECT (not fixable from here without modifying the file): the chest badge's
 * flat front cap is triangulated from its outline only, so the torso's curvature pokes
 * through its middle. Fix belongs in tools/robot-model/build-robot.mjs (subdivide the cap).
 */

export const ROBOT_URL = '/characters/robot-v3.glb'

const BACKGROUNDS = {
  // the site's current (light) hero surface
  light: 'linear-gradient(120deg,#ffffff 0%,#f1f8f8 55%,#e9f5f4 100%)',
  // dark surface — makes the emissive mint glow easy to judge
  dark: '#0a2f2e',
  // fully transparent canvas over a checkerboard, to prove the alpha channel works
  transparent:
    'repeating-conic-gradient(#d9d9d9 0% 25%, #f5f5f5 0% 50%) 50% / 24px 24px',
}

const report = (key, value) => {
  document.body.dataset[key] = typeof value === 'string' ? value : JSON.stringify(value)
}

/* Catches load failures (404, bad GLB, missing extension…) and reports them. */
class LoadBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) {
    console.error('[RobotTestScene] load failed:', error)
    report('robotStatus', 'error')
    report('robotError', String(error?.message || error))
  }
  render() {
    if (this.state.error) return null
    return this.props.children
  }
}

function Robot({ onFramed, az = 0, zoom = 1 }) {
  const { scene } = useGLTF(ROBOT_URL)
  const camera = useThree((s) => s.camera)

  useLayoutEffect(() => {
    // ── materials: ACES tone mapping desaturates the emissive mint to a pale mint, so
    //    exempt only the glow material. Runtime tweak — the GLB file is not modified. ──
    scene.traverse((o) => {
      if (!o.isMesh) return
      ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (m.name === 'Glow_Mint' && m.toneMapped) { m.toneMapped = false; m.needsUpdate = true }
      })
    })

    // ── measure the model as loaded (no scaling applied) ──
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // ── frame it: fit height AND width with a margin ──
    const fov = THREE.MathUtils.degToRad(camera.fov)
    const fitH = size.y / (2 * Math.tan(fov / 2))
    const fitW = size.x / (2 * Math.tan(fov / 2) * camera.aspect)
    const dist = (Math.max(fitH, fitW) * 1.3 + size.z / 2) / zoom
    const a = THREE.MathUtils.degToRad(az) // debug: orbit the camera around the model
    camera.position.set(center.x + Math.sin(a) * dist, center.y + size.y * 0.02, center.z + Math.cos(a) * dist)
    camera.near = dist / 50
    camera.far = dist * 20
    camera.lookAt(center)
    camera.updateProjectionMatrix()

    // ── inventory, for the console / status attributes ──
    let meshes = 0
    let tris = 0
    const materials = new Set()
    const nodes = new Set()
    scene.traverse((o) => {
      nodes.add(o.name)
      if (o.isMesh) {
        meshes++
        tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m))
      }
    })
    const expected = ['VisionBitz_Robot', 'Torso', 'Neck', 'Head']
    const info = {
      size: size.toArray().map((v) => +v.toFixed(3)),
      center: center.toArray().map((v) => +v.toFixed(3)),
      cameraDistance: +dist.toFixed(3),
      meshes,
      triangles: Math.round(tris),
      materials: [...materials].map((m) => `${m.name}:${m.type}`),
      missingNodes: expected.filter((n) => !nodes.has(n)),
    }
    console.info('[RobotTestScene] loaded', info)
    report('robotStatus', 'loaded')
    report('robotInfo', info)
    onFramed(center)
  }, [scene, camera, onFramed, az, zoom])

  return <primitive object={scene} />
}

export default function RobotTestScene({ bg = 'light', still = false, az = 0, zoom = 1 }) {
  const [target, setTarget] = useState([0, 0.5, 0])
  // stable identity: an inline arrow here would re-fire Robot's framing effect on every render (infinite loop)
  const handleFramed = useCallback((c) => setTarget(c.toArray()), [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: BACKGROUNDS[bg] || BACKGROUNDS.light }}>
      <Canvas
        camera={{ fov: 30, position: [0, 0.5, 3.2], near: 0.05, far: 50 }}
        dpr={still ? 1 : [1, 2]}
        frameloop={still ? 'demand' : 'always'} /* still: render on demand — for headless capture only */
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        onCreated={() => report('robotStatus', 'canvas-ready')}
      >
        {/* ── lighting: key / fill / rim + a procedural (offline) studio environment ── */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[2.5, 3, 4]} intensity={1.6} color="#ffffff" />
        <directionalLight position={[-3, 1.2, 2]} intensity={0.55} color="#bff7ee" />
        <directionalLight position={[-1.5, 2.5, -3]} intensity={1.1} color="#8ff0de" />
        <directionalLight position={[2, 1, -3.5]} intensity={0.7} color="#ffffff" />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.4} position={[0, 3.5, 4]} scale={[9, 3, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.2} position={[-5, 1, 2]} scale={[3, 6, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.4} position={[5, 1, -2]} scale={[3, 6, 1]} color="#dffcf7" />
          <Lightformer form="rect" intensity={0.8} position={[0, -3, 3]} scale={[8, 2, 1]} color="#c9f2ec" />
          <Lightformer form="rect" intensity={1.6} position={[0, 2.5, -5]} scale={[9, 3, 1]} color="#ffffff" />
        </Environment>

        <LoadBoundary>
          <Suspense fallback={null}>
            <Robot onFramed={handleFramed} az={az} zoom={zoom} />
          </Suspense>
        </LoadBoundary>

        {/* TEMPORARY: debugging only — remove before the real hero */}
        <OrbitControls target={target} enableDamping dampingFactor={0.08} minDistance={0.4} maxDistance={8} />
      </Canvas>
    </div>
  )
}
