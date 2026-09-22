import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import '../../index.css'
import Navbar from '../Navbar'
import Hometwo from '../../pages/Hometwo'

// Dev-only: the real hero + navbar WITHOUT the Loader splash, so it can be captured / iterated on.
ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
      <Hometwo />
    </MemoryRouter>
  </HelmetProvider>
)

// Dev-only: ?move=0.1,0.4 dispatches a REAL pointermove at that fraction of the viewport (repeatedly, so it
// lands after the models load) — lets the real hero's cursor tracking be exercised in a headless capture.
const move = new URLSearchParams(window.location.search).get('move')?.split(',').map(Number)
if (move?.length === 2) {
  const fire = () => window.dispatchEvent(new PointerEvent('pointermove', { clientX: move[0] * window.innerWidth, clientY: move[1] * window.innerHeight, pointerType: 'mouse', bubbles: true }))
  setInterval(fire, 250)
}
