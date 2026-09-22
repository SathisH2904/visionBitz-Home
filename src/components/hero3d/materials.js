/** Frees the GPU buffers of a cloned GLB scene (the clone shares geometry with the loader cache). */
export function disposeRoot(root) {
  const mats = new Set()
  root.traverse((o) => {
    if (!o.isMesh) return
    o.geometry?.dispose()
    ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m && mats.add(m))
  })
  mats.forEach((m) => m.dispose())
}
