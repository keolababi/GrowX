/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'rgb(var(--brand-primary) / <alpha-value>)',
          primaryDark: 'rgb(var(--brand-primary-dark) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        background: {
          app: 'rgb(var(--background-app) / <alpha-value>)',
          paper: 'rgb(var(--background-paper) / <alpha-value>)',
          raised: 'rgb(var(--background-raised) / <alpha-value>)',
          soft: 'rgb(var(--background-soft) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        disabled: 'rgb(var(--disabled) / <alpha-value>)',
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
        btn: '14px',
        card: '20px',
        avatar: '999px',
        sheet: '24px',
      },
    },
  },
  plugins: [],
};
