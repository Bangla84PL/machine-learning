/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        accent: '#10b981', // emerald-500
        jungle: {
          DEFAULT: '#10b981',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        jost: ['Jost', 'sans-serif'],
      },
      backgroundImage: {
        'jungle-pattern': "url('/jungle-bg.jpg')",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
