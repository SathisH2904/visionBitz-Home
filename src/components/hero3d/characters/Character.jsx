import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { fitFor, placement, pointerOf } from '../composition'
import { useFollowRig } from '../cursor/useFollowRig'
import { useAmbientLife } from '../cursor/useAmbientLife'
import { disposeRoot } from '../materials'
import { applyPose } from './applyPose'

/**
 * Character — one supplied, painted GLB (the robot, the boy) placed in the hero scene and wired to the shared
 * interaction. Both characters are built the same way (tools/robot-model/import-tripo.mjs), so they share this:
 *
 *   <Model> → Torso → Neck (pivot at the neck) → Head       the cursor rig turns head, neck and torso (followConfig.js)
 *
 * Material: the texture IS the finished look (colours, face, logo), so it is shown UNLIT (MeshBasicMaterial, no tone
 * mapping) — the exact colours of the supplied model, whatever the hero's lighting. That is also why the scene has no
 * lights and no environment map.
 *
 *   url        the GLB               cfg       this character's entry in the layout (composition.js)
 *   layout     the whole layout (for its `fit` shrink on narrow canvases)
 *   follow     cursor-rig config     parallax  { x, y } world units the character drifts opposite the smoothed pointer
 *   ambient    float / breathing — opt-in (portfolio hero)
 *   rigRef     receives the rig      onReady   called once the model is in the scene
 */
export default function Character({ name, url, cfg, layout, follow, parallax, interaction, ambient = false, rigRef, onReady }) {
  const gltf = useGLTF(url)
  const root = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const aspect = useThree((s) => s.size.width / s.size.height)
  const place = placement(cfg, aspect, fitFor(layout, aspect))
  const group = useRef()

  // scene-side setup + pose. Declared BEFORE useFollowRig so the rig captures the finished pose as its rest.
  useLayoutEffect(() => {
    const unlit = new Map()
    root.traverse((o) => {
      if (!o.isMesh) return
      const src = o.material
      if (!unlit.has(src)) unlit.set(src, new THREE.MeshBasicMaterial({ name: src.name, map: src.map, toneMapped: false }))
      o.material = unlit.get(src)
      o.frustumCulled = false // the head swings about the neck; the parts are small, so never cull them
    })
    applyPose(root, cfg.restPose)
  }, [root, cfg])

  const rig = useFollowRig(root, follow, interaction, { anchor: pointerOf(place.head) })
  useAmbientLife(root, interaction, { enabled: ambient })

  useLayoutEffect(() => {
    if (rigRef) rigRef.current = rig
    onReady?.(name)
  }, [rig, rigRef, onReady, name])

  // parallax: drifts opposite the smoothed pointer (the nearer / bigger the character, the more)
  useFrame(() => {
    const it = interaction.current, g = group.current
    if (!it || !g) return
    const k = it.cfg.parallax
    g.position.set(place.position[0] - it.sm.x * parallax.x * k, place.position[1] - it.sm.y * parallax.y * k, place.position[2])
  })

  useEffect(() => () => { disposeRoot(root); useGLTF.clear(url) }, [root, url])

  return (
    <group ref={group} position={place.position} rotation={[0, cfg.yaw, 0]} scale={place.scale}>
      <primitive object={root} />
    </group>
  )
}
