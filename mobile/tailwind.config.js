/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#9AF000',
          primaryDark: '#62B900',
          accent: '#8EE817',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#D6DBDC',
          muted: '#A7AEB0',
        },
        background: {
          app: '#020B0D',
          paper: '#0D1517',
        },
        border: '#263033',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        disabled: '#263033',
      },
      spacing: {
        xs: '6px',
        s: '12px',
        m: '16px',
        l: '20px',
        xl: '24px',
        xxl: '32px',
      },
      borderRadius: {
        btn: '10px',
        card: '12px',
        avatar: '999px',
        sheet: '16px',
      },
    },
  },
  plugins: [],
};
