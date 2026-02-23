/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff', 100: '#dfeeff', 200: '#b8dbff', 300: '#7ac0ff',
          400: '#3aa0ff', 500: '#0a7fff', 600: '#005fd4', 700: '#004aab',
          800: '#00408d', 900: '#063774', 950: '#04234d',
        },
        surface: {
          50: '#fafbfc', 100: '#f4f6f8', 200: '#e9ecf0', 300: '#d3d8e0',
          400: '#b0b8c4', 500: '#8b95a5', 600: '#6b7585', 700: '#565e6c',
          800: '#3d434e', 900: '#282c34', 950: '#1a1d23',
        },
        accent: { emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', violet: '#8b5cf6' },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        elevated: '0 10px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        glow: '0 0 30px -5px rgba(10,127,255,0.25)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
