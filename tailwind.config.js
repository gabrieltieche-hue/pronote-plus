/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'fs-12': ['var(--font-size-12)', { lineHeight: '1.2' }],
        'fs-13': ['var(--font-size-13)', { lineHeight: '1.2' }],
        'fs-14': ['var(--font-size-14)', { lineHeight: '1.3' }],
        'fs-15': ['var(--font-size-15)', { lineHeight: '1.3' }],
        'fs-16': ['var(--font-size-16)', { lineHeight: '1.4' }],
        'fs-18': ['var(--font-size-18)', { lineHeight: '1.4' }],
        'fs-20': ['var(--font-size-20)', { lineHeight: '1.4' }],
        'fs-24': ['var(--font-size-24)', { lineHeight: '1.3' }],
        'fs-32': ['var(--font-size-32)', { lineHeight: '1.2' }],
        'fs-36': ['var(--font-size-36)', { lineHeight: '1.2' }],
        'fs-42': ['var(--font-size-42)', { lineHeight: '1.1' }],
        'fs-48': ['var(--font-size-48)', { lineHeight: '1.1' }],
      },
      colors: {
        'bg-0': 'rgb(var(--background-color-0) / <alpha-value>)',
        'bg-1': 'rgb(var(--background-color-1) / <alpha-value>)',
        'bg-2': 'rgb(var(--background-color-2) / <alpha-value>)',
        'bg-3': 'rgb(var(--background-color-3) / <alpha-value>)',
        'border-0': 'rgb(var(--border-color-0) / <alpha-value>)',
        'border-1': 'rgb(var(--border-color-1) / <alpha-value>)',
        'text-main': 'rgb(var(--text-color-main) / <alpha-value>)',
        'text-alt': 'rgb(var(--text-color-alt) / <alpha-value>)',
      },
      keyframes: {
        'go-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'go-in': 'go-in 0.5s var(--timing-function-spring-effect, cubic-bezier(0.18, 0.89, 0.32, 1.27)) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
}
