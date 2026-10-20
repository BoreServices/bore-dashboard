/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F3F8FF',
          100: '#E6F0FE',
          200: '#CBE1FD',
          300: '#A5CDFB',
          400: '#77A9F7',
          500: '#5794F2',
          600: '#3C7BE0',
          700: '#2F62BC',
          800: '#2A5394',
          900: '#274777',
        },
        ink: {
          DEFAULT: '#17263B',
          soft: '#4A5A70',
          muted: '#718096',
        },
        surface: '#FFFFFF',
        canvas: '#F8FAFD',
        line: '#E4EBF4',
        success: '#38B879',
        warning: '#F0B34B',
        danger: '#E76D7A',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 38, 59, 0.04), 0 8px 24px -12px rgba(23, 38, 59, 0.12)',
        lift: '0 2px 4px rgba(23, 38, 59, 0.05), 0 18px 40px -18px rgba(23, 38, 59, 0.22)',
        panel: '0 24px 60px -30px rgba(23, 38, 59, 0.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
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
        'fade-up': 'fade-up 0.35s ease-out both',
        'fade-in': 'fade-in 0.2s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
