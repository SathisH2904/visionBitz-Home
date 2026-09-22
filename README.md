# VisionBitz - Home Page & 3D Interactive Showcase (sk-dev)

This is a standalone extract of the VisionBitz Home Page containing the interactive 3D Robot & Boy character stage, dynamic service hologram cluster, and marketing service showcase.

## Tech Stack
- **Framework:** React 18 + Vite
- **3D Graphics:** Three.js + @react-three/fiber + @react-three/drei
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

## Key Files Included:
- `src/pages/Hometwo.jsx`: Main Home page wrapper
- `src/components/home/`:
  - `HomeHero.jsx`: Dark theme Hero section with copy and 3D canvas stage
  - `ServiceCluster.jsx`: Interactive 3D/hologram floating service cards
  - `MarketingServices.jsx`: Digital marketing service grid
  - `home.css`: Neon styling, glow filters, radial mesh gradients
- `src/components/hero3d/`:
  - Three.js WebGL canvas stage, smooth cursor follow rigs, Robot & Boy GLTF loaders
- `public/characters/`:
  - `robot-v3.glb`, `boy-v1.glb` 3D models
- `public/img/hero/`:
  - `hero-office.webp` background texture
