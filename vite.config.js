import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The hero's 3D stage (three + react-three-fiber + drei) is ~1 MB raw / ~270 kB gzip. It is code-split along
    // the lazy import in Hometwo.jsx and only fetched on desktop screens with WebGL. Do NOT add it to
    // manualChunks: a named chunk gets pulled into the entry's preload list and every visitor would download it.
    chunkSizeWarningLimit: 1900,
    rollupOptions: {
      output: {
        // Split heavy libraries into their own chunks so they download in
        // parallel and stay cached when only the app code changes between deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          gsap: ['gsap'],
          lottie: ['@lottiefiles/dotlottie-react'],
          icons: ['react-icons', 'lucide-react'],
        },
      },
    },
  },
})
