import React from 'react'
import ReactDOM from 'react-dom/client'
import RobotTestScene from './RobotTestScene'

// Dev-only entry (see /dev/robot-test.html). ?bg=light | dark | transparent   &still=1 for on-demand rendering
const params = new URLSearchParams(window.location.search)
const bg = params.get('bg') || 'light'
const still = params.get('still') === '1' // debug: render on demand at DPR 1
const az = Number(params.get('az') || 0) // debug: camera azimuth in degrees
const zoom = Number(params.get('zoom') || 1) // debug: >1 moves the camera closer

ReactDOM.createRoot(document.getElementById('root')).render(<RobotTestScene bg={bg} still={still} az={az} zoom={zoom} />)
