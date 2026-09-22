import React from 'react'
import ReactDOM from 'react-dom/client'
import * as THREE from 'three'
import HeroCharacterScene from './HeroCharacterScene'

/**
 * Dev-only performance harness. Mounts the scene, waits for both models, then measures.
 *
 * A software rasteriser (headless Edge) cannot time a real GPU, but its frame time scales with the
 * same things a GPU is bound by — pixels shaded, vertices processed, shader complexity — so the
 * RELATIVE cost of each option is meaningful. Draw calls / triangles / resource counts are exact.
 * Each measurement forces completion with a 1×1 readPixels, so the time includes the raster work.
 *
 *   ?layout=hero|stack|master   ?res=WxH (canvas size)   ?dpr=1
 */
const q = new URLSearchParams(location.search)
const layout = q.get('layout') || 'hero'
const quality = q.get('quality') || undefined // high | medium | lite (default: from the mode)
const marks = { navStart: 0 }
const t0 = performance.now()

function measure(label, n = 24) {
  const { gl, scene, camera } = window.__hero.three()
  const ctx = gl.getContext(), px = new Uint8Array(4)
  const sub = [], full = []
  for (let i = 0; i < 4; i++) { gl.render(scene, camera); ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px) } // warm-up
  for (let i = 0; i < n; i++) {
    const a = performance.now(); gl.render(scene, camera); const b = performance.now()
    ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px); const c = performance.now()
    sub.push(b - a); full.push(c - a)
  }
  const avg = (v) => +(v.reduce((x, y) => x + y, 0) / v.length).toFixed(2)
  const p95 = (v) => +[...v].sort((x, y) => x - y)[Math.floor(v.length * 0.95)].toFixed(2)
  return { label, cpuSubmitMs: avg(sub), frameMs: avg(full), frameP95: p95(full), calls: gl.info.render.calls, tris: gl.info.render.triangles, geos: gl.info.memory.geometries, tex: gl.info.memory.textures, progs: gl.info.programs?.length }
}

async function run() {
  const H = window.__hero.three()
  const { gl, scene } = H
  const out = { layout, canvas: [gl.domElement.width, gl.domElement.height], dpr: gl.getPixelRatio(), timeToReadyMs: Math.round(performance.now() - t0) }
  const results = []
  const dirs = []; scene.traverse((o) => { if (o.isDirectionalLight) dirs.push(o) })
  const meshes = []; scene.traverse((o) => { if (o.isMesh) meshes.push(o) })
  out.sceneInventory = { meshes: meshes.length, dirLights: dirs.length, physicalMats: new Set(meshes.filter((m) => m.material.isMeshPhysicalMaterial).map((m) => m.material.uuid)).size, uniqueMats: new Set(meshes.map((m) => m.material.uuid)).size, hasSceneEnv: !!scene.environment, envOnMaterials: new Set(meshes.filter((m) => m.material.envMap).map((m) => m.material.uuid)).size }

  // idle test (before any manual render): how many frames does an untouched hero draw in 3 s?
  await new Promise((r) => setTimeout(r, 2500))
  const f0 = gl.info.render.frame
  await new Promise((r) => setTimeout(r, 3000))
  out.idleFramesIn3s = gl.info.render.frame - f0

  // pointer activity: frames drawn WHILE the pointer moves (1 s of events), then again once it has stopped
  const fA = gl.info.render.frame
  for (let i = 0; i < 20; i++) { window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200 + i * 40, clientY: 300 + (i % 5) * 20, pointerType: 'mouse', bubbles: true })); await new Promise((r) => setTimeout(r, 50)) }
  out.framesWhileMoving1s = gl.info.render.frame - fA
  await new Promise((r) => setTimeout(r, 6000)) // let every smoother settle
  const fB = gl.info.render.frame
  await new Promise((r) => setTimeout(r, 3000))
  out.idleFramesAfterMove3s = gl.info.render.frame - fB

  results.push(measure('A baseline'))
  // pixel-bound? render at 2× the pixels
  const size = H.size; const dpr0 = gl.getPixelRatio()
  gl.setPixelRatio(dpr0 * 2); results.push(measure('B dpr ×2 (4× pixels)')); gl.setPixelRatio(dpr0)
  gl.setPixelRatio(dpr0 * 0.5); results.push(measure('B2 dpr ×0.5 (¼ pixels)')); gl.setPixelRatio(dpr0)
  // lighting cost
  const envd = meshes.filter((m) => m.material.envMap); const saved = envd.map((m) => m.material.envMap)
  envd.forEach((m) => { m.material.envMap = null; m.material.needsUpdate = true }); results.push(measure('C env map removed (robot)')); envd.forEach((m, i) => { m.material.envMap = saved[i]; m.material.needsUpdate = true })
  dirs.forEach((d, i) => { if (i > 0) d.visible = false }); results.push(measure('D one directional light only')); dirs.forEach((d) => (d.visible = true))
  // material cost
  const swaps = []
  meshes.forEach((m) => { if (m.material.isMeshPhysicalMaterial) { const o = m.material; const s = new THREE.MeshStandardMaterial({ color: o.color, roughness: o.roughness, metalness: o.metalness, emissive: o.emissive, emissiveIntensity: o.emissiveIntensity }); swaps.push([m, o]); m.material = s } })
  results.push(measure('E physical→standard materials')); swaps.forEach(([m, o]) => { m.material.dispose(); m.material = o })
  // geometry cost: who owns the triangles / calls?
  const byRoot = {}; meshes.forEach((m) => { let r = m; while (r.parent && r.name !== 'VisionBitz_Robot') r = r.parent; const k = r.name === 'VisionBitz_Robot' ? 'robot' : 'other'; const g = m.geometry; (byRoot[k] ??= { meshes: 0, tris: 0 }); byRoot[k].meshes++; byRoot[k].tris += Math.round((g.index ? g.index.count : g.attributes.position.count) / 3) })
  out.trisByCharacter = byRoot
  ;['VisionBitz_Robot'].forEach((n) => { const r = scene.getObjectByName(n); if (!r) return; r.visible = false; results.push(measure('G without ' + n.replace('VisionBitz_', ''))); r.visible = true })
  out.results = results
  document.body.dataset.perf = JSON.stringify(out)
  console.info('[perf]', JSON.stringify(out))
}

const [w, h] = (q.get('res') || '1536x864').split('x').map(Number)
document.getElementById('root').style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px`
ReactDOM.createRoot(document.getElementById('root')).render(
  <HeroCharacterScene layout={layout} quality={quality} embedded still seconds={0} onLoaded={() => setTimeout(run, 800)} />
)
