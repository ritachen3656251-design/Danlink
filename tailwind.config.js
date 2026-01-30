/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{tsx,ts,jsx,js}',
    './components/**/*.{tsx,ts,jsx,js}',
    './screens/**/*.{tsx,ts,jsx,js}',
    './context/**/*.{tsx,ts,jsx,js}',
    './lib/**/*.{tsx,ts,jsx,js}',
    './utils/**/*.{tsx,ts,jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1152d4',
        'primary-dark': '#0a3690',
        'primary-content': '#ffffff',
        secondary: '#E5A823',
        'background-light': '#f6f6f8',
        'background-dark': '#101622',
        'surface-light': '#ffffff',
        'surface-dark': '#1e293b',
      },
      fontFamily: {
        display: ['Noto Sans SC', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        mono: ['SF Pro Rounded', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        card: '0 2px 10px rgba(0, 0, 0, 0.03)',
        up: '0 -4px 20px -5px rgba(0, 0, 0, 0.1)',
        'card-float': '0 25px 50px -12px rgba(17, 82, 212, 0.25)',
      },
    },
  },
  plugins: [],
};
