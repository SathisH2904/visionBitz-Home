import { useGLTF } from '@react-three/drei'
import { LAYOUTS, PARALLAX } from '../composition'
import { ROBOT_FOLLOW } from '../cursor/followConfig'
import Character from './Character'

/** the supplied robot, optimised for the web by tools/robot-model/import-tripo.mjs (versioned name: never served from a stale cache) */
export const ROBOT_URL = '/characters/robot-v3.glb'

/**
 * The robot. The GLB is a single painted model (its colours, the cyan glow, the V logo and the smile are all in ONE
 * texture), split at the neck into three nodes so the cursor rig has something to drive:
 *
 *   VisionBitz_Robot → Torso → Neck (pivot at the neck) → Head
 *
 * Cursor layers (followConfig.js), strongest first: head → neck → torso. The eyes are part of the texture, so they turn
 * with the head — there is no separate eye layer. Everything else is shared with the boy: see Character.jsx.
 */
export default function Robot({ interaction, layout = LAYOUTS.hero, follow = ROBOT_FOLLOW, ambient = false, rigRef, onReady }) {
  return (
    <Character
      name="robot" url={ROBOT_URL} cfg={layout.robot} layout={layout} follow={follow} parallax={PARALLAX.robot}
      interaction={interaction} ambient={ambient} rigRef={rigRef} onReady={onReady}
    />
  )
}

useGLTF.preload(ROBOT_URL)
