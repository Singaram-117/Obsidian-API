/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dae6',
          300: '#a8bbd0',
          400: '#7997b6',
          500: '#577b9d',
          600: '#446283',
          700: '#38506b',
          800: '#31445a',
          900: '#2d3b4c',
          950: '#1e2733',
        },
      },
    },
  },
  plugins: [],
};

