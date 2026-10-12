/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#ced9fd',
          300: '#a3b7fc',
          400: '#718efa',
          500: '#4f69f4',
          600: '#384ce4',
          700: '#2b38cd',
          800: '#262fa6',
          900: '#232b83',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
