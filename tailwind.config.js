/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        surface: '#FFFFFF',
        'surface-bright': '#F8FAFC',
        'surface-dim': '#F1F5F9',
        background: '#F8FAFC',
        'border-strong': '#020617',
        'border-subtle': '#E2E8F0',
        'on-surface': '#020617',
        'on-surface-variant': '#434655',
        'status-live': '#B91C1C',
        'status-warning': '#B45309',
        'status-success': '#047857',
        'primary-container': '#1D4ED8',
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#badffd',
          300: '#7cc5fc',
          400: '#36a8f8',
          500: '#1d4ed8',
          600: '#1e40af',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#172554',
          950: '#020617',
        },
      },
      boxShadow: {
        tactical: '4px 4px 0px 0px #020617',
        'tactical-sm': '2px 2px 0px 0px #020617',
        'tactical-gold': '4px 4px 0px 0px #EAB308',
        'tactical-blue': '4px 4px 0px 0px #1d4ed8',
        'tactical-red': '4px 4px 0px 0px #B91C1C',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out forwards',
        'slide-from-right': 'slideFromRight 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'slide-from-left': 'slideFromLeft 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'pulse-live': 'pulseLive 1.5s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideFromRight: {
          '0%': { transform: 'translateX(32px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideFromLeft: {
          '0%': { transform: 'translateX(-32px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseLive: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
