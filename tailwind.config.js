/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        axiom: {
          950: '#07080B',
          900: '#0B0D12',
          850: '#10131A',
          800: '#161922',
          700: '#222736',
          600: '#333B50',
          accent: '#8B5CF6',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          cyan: '#38BDF8',
          electric: '#4FACFE',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        },
        stakent: {
          bg: '#08090D',
          dark: '#0B0D13',
          card: '#11141D',
          surface: '#161A26',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
          purple: '#7C3AED',
          'purple-glow': '#A78BFA',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#F43F5E'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 35px -5px rgba(124, 58, 237, 0.45)',
        'glow-cyan': '0 0 30px -5px rgba(56, 189, 248, 0.4)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.35)',
        'stakent-card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
        'stakent-elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)'
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }
    },
  },
  plugins: [],
}
