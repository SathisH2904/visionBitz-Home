import { DEG } from './cursor/smoothing'

/**
 * Composition — where everything sits.
 *
 * Positions are authored as FRACTIONS of the canvas (0,0 = top-left, 1,1 = bottom-right) plus a
 * distance from the camera, so the layout follows whatever size the hero is. The camera has a fixed
 * vertical field of view, so characters scale with the hero's HEIGHT; on a narrower aspect than
 * `refAspect` they are scaled down (`fit`) so they never crowd the copy.
 *
 * Two 3D characters share the scene: the BOY (a bust, seen three-quarters from behind, looking toward the cards) and the
 * ROBOT (upper right, peeking over the featured card). Both are placed the same way and follow the same interaction.
 *
 * Layouts:
 *   master — reproduces the MASTER REFERENCE (a 1536 × 722 hero region, measured in px below):
 *              robot head centre (1195, 190) → design frame (1195, 102), head ≈ 175 px wide
 *            → with a 25° camera the robot is 6.28 units away.
 *   hero   — the live dark hero on desktop: the master's composition scaled to the real canvas.
 *   stack  — the same on the shorter stage used on tablets and phones.
 */

export const DESIGN = { width: 1536, height: 722 } // the master's hero region
export const CAMERA = { fov: 25, near: 0.1, far: 60 } // camera at the origin, looking down −Z

const TAN_HALF = Math.tan((CAMERA.fov * DEG) / 2)

/** fractional canvas position + distance from the camera → world position (camera at the origin, −Z) */
export function layoutPoint(fx, fy, depth, aspect) {
  const h = depth * TAN_HALF
  return [(fx * 2 - 1) * h * aspect, (1 - fy * 2) * h, -depth]
}

/** fractional position → normalised pointer space (-1..1, y up) — each character's look origin */
export const pointerOf = ([fx, fy]) => ({ x: fx * 2 - 1, y: 1 - fy * 2 })

const px = (x, y) => [x / DESIGN.width, y / DESIGN.height]

/**
 * Per character:
 *   head        fractional canvas position of the head centre
 *   depth       distance from the camera
 *   scale       uniform model scale
 *   headLocalY  height of the head centre above the model origin (so the origin can be solved)
 *   yaw         rotation of the whole model about the vertical axis
 *   restPose    absolute Euler overrides (radians) applied before the cursor motion is layered on
 *
 * The robot GLB is 1.0 tall with its origin at bottom-centre, facing +Z (tools/robot-model/import-tripo.mjs); its head
 * is ≈ 0.78 wide and centred 0.729 above the origin, so `scale` ≈ head width in px ÷ (0.78 × px-per-unit).
 *
 * The boy GLB is a bust 1.0 tall (cut at the hips, which the stage's bottom edge hides), origin bottom-centre, made to
 * face +Z like the robot; his head is ≈ 0.30 wide and centred 0.844 above the origin. `yaw` turns him three-quarters
 * away from the camera (backpack toward the copy, face toward the cards), like the picture he replaces.
 */
const ROBOT = {
  headLocalY: 0.737,
  yaw: -0.25, // faces the camera, turned toward screen-left (toward the card)
  restPose: {
    Head: { x: 0.24, y: -0.08, z: -0.06 }, // pitched downward looking at content card, turned toward card, slight tilt
    Neck: { x: 0.08, y: -0.04 }, // neck aids downward pitch toward cards
    Torso: { x: 0.06 }, // subtle forward lean toward cards
  },
}

const BOY = {
  headLocalY: 0.844,
  yaw: 2.5, // ≈ 143°: seen from behind, turned toward the screen-right (the cards)
  restPose: {},
}

export const LAYOUTS = {
  master: {
    fit: false,
    robot: { ...ROBOT, head: px(1195, 102), depth: 6.28, scale: 0.8 },
  },
  // The live dark hero (desktop): the reference composition, scaled to the real canvas (hero minus nav).
  // Boy left, robot right, the featured service card between them: the robot peeks from behind the card's top-right corner.
  // The boy stands on the stage's floor: he is anchored by his FOOT (a point just below the canvas bottom, so the bust's
  // cut-off hips never show, even when the parallax drifts), the robot by his head.
  hero: {
    fit: true,
    refAspect: DESIGN.width / DESIGN.height,
    boy: { ...BOY, foot: [700 / DESIGN.width, 1.06], depth: 6.28, scale: 1.7 },
    robot: { ...ROBOT, head: px(1215, 84), depth: 6.28, scale: 0.86 },
  },
  // PORTFOLIO hero (robot only): a large robot on the right, turned toward the content column.
  // The canvas is the whole viewport; the content window is clipped to the left 56%, so the robot never covers text.
  portfolio: {
    fit: true,
    refAspect: 1.7,
    robot: { ...ROBOT, head: [0.78, 0.37], depth: 4.6, scale: 1.06 },
  },
  // portfolio on tablets / phones: content above, the robot lower right
  portfolioStack: {
    fit: true,
    refAspect: 0.5, // phones (~0.46) shrink a little, tablets (~0.76) not at all
    robot: { ...ROBOT, head: [0.68, 0.74], depth: 4.9, scale: 0.6 },
  },
  // Tablet / phone: the same on a shorter, narrower stage above the cards. Same relationships
  // (robot upper right, beside the cards), scaled to the stage.
  stack: {
    fit: true,
    refAspect: 1.5,
    boy: { ...BOY, foot: [0.3, 1.06], depth: 5.3, scale: 1.3 },
    robot: { ...ROBOT, head: [0.74, 0.3], depth: 5.3, scale: 0.85 },
  },
}

/** shrink factor for a canvas narrower than the layout's reference aspect */
export const fitFor = (layout, aspect) => (layout.fit ? Math.min(1, aspect / layout.refAspect) : 1)

/**
 * Model group transform for a character in a layout, at the current canvas aspect, plus where its head ends up on the
 * canvas (fractions — the look origin). A character is anchored by its `head` (fraction of the canvas), or by its
 * `foot` — the model's origin, which stays put when the model shrinks, so a bust cut off at the hips keeps standing
 * on the canvas floor.
 */
export function placement(cfg, aspect, fit = 1) {
  const s = (cfg.scale ?? 1) * fit
  if (cfg.foot) {
    const [x, y, z] = layoutPoint(cfg.foot[0], cfg.foot[1], cfg.depth, aspect)
    const worldHeight = 2 * cfg.depth * TAN_HALF
    return { position: [x, y, z], scale: s, head: [cfg.foot[0], cfg.foot[1] - (cfg.headLocalY * s) / worldHeight] }
  }
  const [x, y, z] = layoutPoint(cfg.head[0], cfg.head[1], cfg.depth, aspect)
  return { position: [x, y - cfg.headLocalY * s, z], scale: s, head: cfg.head }
}

/**
 * Cinematic camera (portfolio hero): it drifts a little with the smoothed pointer and dollies in gently as the
 * content slides — world units, all × the mode's `parallax`. Small on purpose: no shake, no zoom.
 */
export const CAMERA_RIG = { x: 0.1, y: 0.06, dolly: 0.26, push: 0.04 }

/**
 * Parallax — restrained on purpose. Layers move OPPOSITE the pointer, nearer layers more. The 3D characters in world
 * units (≈ 260 px/unit → the boy ~14 px, the robot ~18 px), the DOM background layers in px. All are multiplied by the
 * mode's `parallax` factor (desktop 1, tablet 0.55, phone 0.3, reduced 0).
 * The service cards have NONE: they stay anchored in the layout and only slide when the service changes.
 */
export const PARALLAX = {
  background: 4, // px — very subtle
  particles: 9, // px — subtle
  boy: { x: 0.055, y: 0.03 }, // units — small
  robot: { x: 0.07, y: 0.04 }, // units — slightly stronger
  floor: 14, // px — the portfolio page's floor layer (the hero's service cards have no parallax)
}
