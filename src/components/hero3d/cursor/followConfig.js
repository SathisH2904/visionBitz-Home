/**
 * Cursor-following configuration. EVERY sensitivity, limit and response value lives here.
 * Angles are DEGREES. Nothing else in the codebase hard-codes a limit.
 *
 * LAYERED tracking
 *   The pointer produces a "gaze demand" per axis (-1..1). The angle it needs is handed out in a fixed
 *   priority — the layers in the order they are listed (head, then neck, then upper body for the robot) —
 *   each layer taking up to its own `yaw` / `pitch` allocation before the next one is recruited. A small
 *   cursor move therefore turns the head; a larger one adds neck, then torso — like a real person's gaze.
 *   `couple` lets a downstream layer lead a little from the start (0 = strictly sequential).
 *
 * Per layer
 *   yaw / pitch      how much of the gaze demand this layer takes (its normal maximum). Deliberately a
 *                    little BELOW the hard limit, so the pose stays natural and the limit is a safety net.
 *   limitYaw/Pitch   HARD clamp on the final value (after smoothing and follow-through). These are the
 *                    anatomical maxima — nothing can exceed them, whatever the input or spring state.
 *   pitchUp          maximum when looking UP (people look up less than down); defaults to `pitch`
 *   roll             tiny head tilt with the turn (0 = none)
 *   damping          response rate, in the usual "damp(current, target, lambda, dt)" units: higher =
 *                    snappier (≈ 1/lambda seconds). Head highest, body lowest, so the layers arrive one
 *                    after another (follow-through). Realised as a critically-damped spring — it has
 *                    velocity, so it accelerates and decelerates instead of snapping.
 *   maxSpeed         optional cap in degrees/second (0 = uncapped)
 *
 * Per character
 *   chain            hard clamp on the SUM of head + neck + body, so they can never stack into an
 *                    unnatural twist (a layer named `eyes`, if a model has one, is not part of the chain)
 *   range            scales how far the cursor must be from the character for full deflection (>1 = calmer).
 *                    "Far" is measured to the edge of the hero on the cursor's side (see useFollowRig), so a
 *                    character near an edge still responds strongly to a cursor on that side.
 *   minSpan          smallest edge distance used for that measurement (default 0.3) — stops a character
 *                    standing right at an edge from reacting hair-trigger to a tiny cursor move
 *   input.deadZone   RAW pointer distance (hero units, -1..1) from the character that is ignored; inside it
 *                    the character eases to rest. Spec: 0.03–0.06
 *   axes             which LOCAL axis of the node is yaw / pitch / roll. Verified against the GLB:
 *                    the robot is Y-up and faces +Z, so yaw = y, pitch = x, roll = z.
 *   yawSign          +1: cursor to screen-right turns toward screen-right (the robot faces the camera)
 *   pitchSign        −1: cursor up = look up
 *   focusWeight      how strongly an approached service card pulls this character's gaze toward it
 *
 * Presenting the cards (`present`, per layer)
 *   The service cards slide past in front of the characters; they watch the card nearest the middle — the outgoing one
 *   first, then the arriving one — and settle on the featured card (interaction.present.x: -1 = the card is far to the
 *   LEFT of the featured slot, +1 = far to the RIGHT, 0 = at rest). `present` is how many degrees that layer turns at ±1.
 *   It is ADDED to the cursor's demand and eases down to 40 % as the cursor asks for more (the cursor has priority: at a
 *   big deflection the cards pull only a little, so the two never fight), and it is clamped by the same limits and chain.
 *
 * The rest rotation of every node is captured when the rig starts (after the pose in composition.js) and
 * the motion is always  rest + offset  — the authored orientation is never overwritten.
 */

export const DEFAULT_INPUT = { deadZone: 0.04, curve: 1.15 }
export const DEFAULT_AXES = { yaw: 'y', pitch: 'x', roll: 'z' }

export const ROBOT_FOLLOW = {
  name: 'robot',
  origin: 'anchor', // each character looks relative to where it stands on screen
  range: 1.0,
  input: DEFAULT_INPUT,
  axes: DEFAULT_AXES,
  yawSign: 1,
  pitchSign: -1,
  focusWeight: 0.9,
  chain: { yaw: 28, pitch: 16 },
  layers: {
    // leads: the whole head turns (eyes, smile and headphones with it)
    head: { nodes: ['Head'], yaw: 16, pitch: 9, pitchUp: 5, limitYaw: 22, limitPitch: 12, roll: 2.5, couple: 0.3, damping: 8, present: 12, presentPitch: 5 },
    // subtle
    neck: { nodes: ['Neck'], yaw: 6, pitch: 3.5, pitchUp: 2, limitYaw: 8, limitPitch: 5, couple: 0.15, damping: 6, present: 5, presentPitch: 2.5 },
    // leans toward the cards
    torso: { nodes: ['Torso'], yaw: 3.5, pitch: 2, limitYaw: 6, limitPitch: 3, couple: 0.08, damping: 4, present: 4, presentPitch: 1.5 },
  },
}

/**
 * The BOY (a bust: head → neck → torso, like the robot). He stands three-quarters turned AWAY from the camera (see
 * composition.js: yaw ≈ 143°), so his local +Z points away from the screen and every horizontal turn flips:
 *   yawSign −1   a cursor to the screen-right turns his head toward the screen-right (a positive turn about his own
 *                vertical axis would carry his face toward the screen-left)
 * Calmer than the robot: smaller angles, a wider `range` (a bigger cursor move for full deflection) and slower layers.
 * The old boy's spine limits (head 10/5, neck 5/2, body 4/2) are about what the cursor may use; presenting the cards
 * goes a little beyond them so he turns visibly with the content. The neck seam is a hard cut, so pitch / roll stay tiny.
 */
export const BOY_FOLLOW = {
  name: 'boy',
  origin: 'anchor',
  range: 1.25,
  minSpan: 0.3,
  input: DEFAULT_INPUT,
  axes: DEFAULT_AXES,
  yawSign: -1,
  pitchSign: -1,
  focusWeight: 0.92,
  chain: { yaw: 24, pitch: 10 },
  layers: {
    head: { nodes: ['Head'], yaw: 12, pitch: 5.5, pitchUp: 4.5, limitYaw: 18, limitPitch: 8, roll: 1.5, couple: 0.3, damping: 7.5, present: 10, presentPitch: 3.5 },
    neck: { nodes: ['Neck'], yaw: 5, pitch: 2.5, pitchUp: 2, limitYaw: 8, limitPitch: 4, couple: 0.15, damping: 5.5, present: 4, presentPitch: 1.5 },
    torso: { nodes: ['Torso'], yaw: 4, pitch: 1.5, limitYaw: 6, limitPitch: 2.5, couple: 0.08, damping: 3.6, present: 3, presentPitch: 1 },
  },
}


/**
 * The PORTFOLIO hero's robot. Same model and axes; a different temperament:
 *   · blend           — how much each layer follows the MOVING CONTENT instead of the cursor: head .4, neck .65,
 *     torso .75, so when the content slides one way and the cursor is on the other, the head mostly keeps to the
 *     cursor while the neck and body slowly turn toward the content
 *   · the upper body (neck + torso) turns visibly more than in the VisionBitz hero, but always far less than the
 *     head: 18° head, 7° neck, 5° torso at full deflection (hard limits 22 / 9 / 7)
 *   · idle            — ambient drift: a slow head sway and a barely-there neck / torso sway
 */
export const PORTFOLIO_ROBOT_FOLLOW = {
  name: 'robot',
  origin: 'anchor',
  range: 1.0,
  input: DEFAULT_INPUT,
  axes: DEFAULT_AXES,
  yawSign: 1,
  pitchSign: -1,
  focusWeight: 0,
  chain: { yaw: 30, pitch: 14 },
  layers: {
    head: { nodes: ['Head'], yaw: 18, pitch: 8, pitchUp: 6.5, limitYaw: 22, limitPitch: 10, roll: 3, couple: 0.2, damping: 7.5, blend: 0.4, idle: { yaw: 1.1, pitch: 0.7, rate: 0.17 } },
    neck: { nodes: ['Neck'], yaw: 7, pitch: 3, pitchUp: 2.5, limitYaw: 9, limitPitch: 4, couple: 0.1, damping: 5.5, blend: 0.65, idle: { yaw: 0.45, pitch: 0.3, rate: 0.13 } },
    torso: { nodes: ['Torso'], yaw: 5, pitch: 1.6, limitYaw: 7, limitPitch: 2.4, couple: 0.05, damping: 3.6, blend: 0.75, idle: { yaw: 0.5, pitch: 0.3, rate: 0.09 } },
  },
}
