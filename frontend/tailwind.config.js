/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde5ff',
          200: '#c3d0ff',
          300: '#9db0ff',
          400: '#7086ff',
          500: '#4f5eff',
          600: '#3b3ef7',
          700: '#2f2fd8',
          800: '#2929ae',
          900: '#272888',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.2s infinite ease-in-out',
        // Per-role message entry animations
        'msg-user': 'msgUser 0.22s cubic-bezier(0.34,1.3,0.64,1) both',
        'msg-ai': 'msgAi   0.22s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        // User bubble: slides in from right + subtle scale pop
        msgUser: {
          '0%': { opacity: '0', transform: 'translateX(18px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(0)    scale(1)' },
        },
        // AI bubble: fades up + gentle scale
        msgAi: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0)   scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
