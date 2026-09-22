import React from 'react'
import ReactDOM from 'react-dom/client'
import HeroCharacterScene from './HeroCharacterScene'

// Dev-only entry (see /dev/hero-test.html). Query params:
//   layout=master|hero|stack   bg=dark|light|transparent   ref=0..1 ghost the master reference   interactive=0 (static)
//   ptr=x,y  fixed pointer in -1..1 (y up)   still=1 capture mode   t=seconds to run before the report
//   orbit=1 debug OrbitControls   (dev override)
const q = new URLSearchParams(window.location.search)
const ptr = q.get('ptr')?.split(',').map(Number)

ReactDOM.createRoot(document.getElementById('root')).render(
  <HeroCharacterScene
    layout={q.get('layout') || 'master'}
    bg={q.get('bg') || 'dark'}
    refOpacity={Number(q.get('ref') || 0)}
    interactive={q.get('interactive') !== '0'}
    pointerOverride={ptr && ptr.length === 2 ? { x: ptr[0], y: ptr[1] } : null}
    still={q.get('still') === '1'}
    seconds={Number(q.get('t') || 4)}
    orbit={q.get('orbit') === '1'}
  />
)
