/**
 * Render quality tiers. Picked from the interaction mode (desktop / tablet / mobile) and stepped down
 * on weaker hardware. The robot is a single unlit textured model (no lights, no environment map), so the
 * only costs left to trade are pixel count and anti-aliasing.
 *
 *   dpr        pixel-ratio range — the renderer may settle anywhere inside it (PerformanceMonitor)
 *   aa         MSAA on the drawing buffer
 */
export const QUALITY = {
  high: { dpr: [1, 1.5], aa: true },
  medium: { dpr: [1, 1.25], aa: true },
  lite: { dpr: [1, 1], aa: false },
}

/** step a tier down on modest hardware (few cores / little memory), never up */
export function tierFor(base) {
  if (typeof navigator === 'undefined') return base
  const weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4)
  if (!weak) return base
  return base === 'high' ? 'medium' : 'lite'
}
