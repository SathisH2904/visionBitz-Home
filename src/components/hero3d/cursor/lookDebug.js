/**
 * Development-only debug overlay for the cursor-following rigs.
 *
 *   • turn it on with  DEBUG_CHARACTER_LOOK = true  below, or open the page with  ?debugLook=1
 *   • it shows the normalised pointer, each character's detected nodes, and per layer the CURRENT vs
 *     TARGET rotation (degrees) next to the hard limit, refreshed 10×/s
 *   • production builds never include it: callers guard on `import.meta.env.DEV`, and the overlay
 *     itself refuses to start outside dev.
 */
export const DEBUG_CHARACTER_LOOK = false

const sources = new Map()
let el = null
let timer = 0

const enabled = () => import.meta.env.DEV && (DEBUG_CHARACTER_LOOK || new URLSearchParams(window.location.search).has('debugLook'))
const f = (v) => (v >= 0 ? '+' : '') + v.toFixed(1).padStart(5)

function render() {
  if (!el) return
  const lines = []
  let ptr = null
  for (const get of sources.values()) {
    const s = get()
    if (!s) continue
    ptr = ptr || s.pointer
    lines.push(`${s.name.toUpperCase()}  (mode ${s.mode}, sens ${s.sens})`)
    for (const L of s.layers) {
      lines.push(`  ${L.name.padEnd(6)} yaw ${f(L.yaw)} -> ${f(L.targetYaw)} (max ${L.limitYaw})   pitch ${f(L.pitch)} -> ${f(L.targetPitch)} (max ${L.limitPitch})   [${L.nodes.join(', ')}]`)
    }
    if (s.disabled.length) lines.push(`  disabled: ${s.disabled.join('; ')}`)
  }
  const head = ptr ? `pointer x ${f(ptr.x)} y ${f(ptr.y)}  ${ptr.active ? 'active' : 'idle'}` : 'pointer -'
  el.textContent = `${head}\n${lines.join('\n')}\n(current -> target, degrees)`
}

/** a rig registers a snapshot function; returns the unregister function */
export function registerLookDebug(id, getSnapshot) {
  if (!enabled()) return () => {}
  sources.set(id, getSnapshot)
  if (!el) {
    el = document.createElement('pre')
    el.setAttribute('data-look-debug', '')
    el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;padding:8px 10px;max-width:96vw;overflow:hidden;pointer-events:none;font:11px/1.35 ui-monospace,Consolas,monospace;color:#b8fff0;background:rgba(3,20,22,.88);border:1px solid rgba(53,232,199,.35);border-radius:8px;white-space:pre'
    document.body.appendChild(el)
    timer = window.setInterval(render, 100)
  }
  return () => {
    sources.delete(id)
    if (!sources.size && el) { window.clearInterval(timer); el.remove(); el = null }
  }
}
