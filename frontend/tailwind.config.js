/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#080F1F',
          secondary: '#101B2D',
          card: '#142238',
          border: 'rgba(255, 255, 255, 0.08)',
          primary: '#3B82F6',
          cyan: '#22D3EE',
          surface: '#0c1323',
          'surface-dim': '#070e1e',
        },
        cyber: {
          950: '#080F1F',
          900: '#101B2D',
          800: '#142238',
          700: '#1e2f4d',
          600: '#273c61',
        },
        truth: {
          blue: '#3B82F6',
          cyan: '#22D3EE',
          glow: '#38bdf8',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'scan': 'scan 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        }
      }
    },
  },
  plugins: [],
}
