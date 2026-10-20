/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF3FF',
          100: '#D8E9FF',
          200: '#B6D4FC',
          300: '#8FB9F7',
          400: '#78A9F5',
          500: '#4F8FEF',
          600: '#3B78D4',
          700: '#2F5FA8',
          800: '#2A5185',
          900: '#27456E',
        },
        ink: {
          DEFAULT: '#202B3C',
          soft: '#4A5568',
          muted: '#758196',
          faint: '#9AA5B5',
        },
        canvas: '#F7F9FC',
        surface: '#FFFFFF',
        inset: '#FBFCFE',
        line: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          faint: '#EEF2F7',
        },
        success: '#2F9D70',
        warning: '#C88A2D',
        danger: '#D85E6A',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '3px',
        DEFAULT: '5px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '14px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        md: ['14px', '21px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['26px', '32px'],
        '3xl': ['34px', '40px'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(32, 43, 60, 0.04)',
        pop: '0 8px 28px -12px rgba(32, 43, 60, 0.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.2s ease-out both',
        'fade-in': 'fade-in 0.15s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
