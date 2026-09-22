import { LAYOUTS, PARALLAX } from '../composition'
import { BOY_FOLLOW } from '../cursor/followConfig'
import Character from './Character'

/** the supplied boy, optimised for the web by tools/robot-model/import-tripo.mjs boy (a bust; versioned name: never served from a stale cache) */
export const BOY_URL = '/characters/boy-v1.glb'

/**
 * The boy: a painted bust (hoodie, backpack) split at the neck like the robot —
 *
 *   VisionBitz_Boy → Torso → Neck (pivot at the neck) → Head
 *
 * He stands three-quarters turned away from the camera, toward the cards. The layout anchors his foot below the canvas
 * bottom, so the bust's cut-off hips are never on screen. Cursor / slide response: BOY_FOLLOW (followConfig.js).
 * Only rendered by layouts that have a `boy` entry, and NOT preloaded at import — the portfolio page shares the scene
 * and must not download him.
 */
export default function Boy({ interaction, layout = LAYOUTS.hero, follow = BOY_FOLLOW, rigRef, onReady }) {
  if (!layout.boy) return null
  return (
    <Character
      name="boy" url={BOY_URL} cfg={layout.boy} layout={layout} follow={follow} parallax={PARALLAX.boy}
      interaction={interaction} rigRef={rigRef} onReady={onReady}
    />
  )
}
