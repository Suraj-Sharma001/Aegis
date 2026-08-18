/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1120',
        surface: '#131B2E',
        surface2: '#1A2439',
        border: '#232E45',
        ink: '#E8ECF4',
        muted: '#8B95AC',
        accent: '#3ED6B5',
        accentDim: '#2A9C86',
        danger: '#F0546B',
        warn: '#E8B944',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
