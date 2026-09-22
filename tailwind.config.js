/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E0F7F7',
          100: '#C0EFEF',
          200: '#90E0E0',
          300: '#50CECE',
          400: '#20BFBF',
          500: '#008B8B',
          600: '#089490',
          700: '#066E6B',
          800: '#044A47',
          900: '#022524',
        },
        accent: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(240,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.10) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.08) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        }
      },
      boxShadow: {
        'glow': '0 0 40px rgba(14,165,233,0.25)',
        'glow-lg': '0 0 80px rgba(14,165,233,0.30)',
        'glow-cyan': '0 0 40px rgba(14,165,233,0.4)',
        'card': '0 4px 24px -4px rgba(16,24,40,0.08), 0 2px 8px -2px rgba(16,24,40,0.04)',
        'card-hover': '0 16px 48px -8px rgba(99,102,241,0.18), 0 4px 16px -4px rgba(16,24,40,0.08)',
      },
    },
  },
  plugins: [],
}
