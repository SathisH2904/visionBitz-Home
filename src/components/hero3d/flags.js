import { useEffect, useState } from 'react'

/**
 * Should the hero show the 3D characters?
 *
 * Off when ANY of these is true — the hero then simply has no characters (copy, cards and stats
 * carry it, exactly as designed to work without them):
 *   - VITE_HERO_3D=0 in the environment            (site-wide kill switch, set at build time)
 *   - ?hero3d=0 in the URL                          (per-visit override, handy for A/B or debugging)
 *   - the browser has no WebGL
 *   - the user asked for reduced data (Save-Data)
 * `?hero3d=1` forces it on regardless of the env switch (not past WebGL / Save-Data).
 *
 * It also turns on only when the browser is IDLE (after first paint), so downloading three.js and the
 * models never competes with the page's own critical rendering.
 */
function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function useHero3DEnabled() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get('hero3d')
    const envOff = import.meta.env.VITE_HERO_3D === '0'
    const saveData = navigator.connection?.saveData === true
    const wanted = url === '1' ? true : url === '0' ? false : !envOff
    if (!(wanted && !saveData && hasWebGL())) return
    // wait for idle time (or 1.2 s at most) so the first paint is never blocked
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => setEnabled(true), { timeout: 1200 })
    return () => cancel(id)
  }, [])
  return enabled
}
