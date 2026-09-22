/**
 * Applies a rest pose: { NodeName: { x?, y?, z? } } — absolute Euler angles in radians, and ONLY the
 * axes listed are replaced. Runs before the follow rig captures its rest pose, so cursor motion
 * is layered on top of this pose.
 */
export function applyPose(root, pose = {}) {
  for (const [name, angles] of Object.entries(pose)) {
    const node = root.getObjectByName(name)
    if (!node) {
      console.warn(`[applyPose] node not found: ${name}`)
      continue
    }
    for (const axis of ['x', 'y', 'z']) {
      if (angles[axis] !== undefined) node.rotation[axis] = angles[axis]
    }
  }
}
