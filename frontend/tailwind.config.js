/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -8px rgba(15,23,42,0.12)',
        'card-hover': '0 4px 10px rgba(15,23,42,0.08), 0 20px 40px -12px rgba(79,70,229,0.25)',
        glow: '0 0 0 1px rgba(99,102,241,0.15), 0 10px 40px -10px rgba(99,102,241,0.5)',
        'glow-dark': '0 0 0 1px rgba(99,102,241,0.4), 0 10px 40px -10px rgba(99,102,241,0.7)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        'typing-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.3s ease-out forwards',
        'toast-out': 'toast-out 0.3s ease-in forwards',
        'typing-dot': 'typing-dot 1.2s infinite ease-in-out',
        'pulse-live': 'pulse-live 2s infinite ease-in-out',
        'modal-in': 'modal-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
