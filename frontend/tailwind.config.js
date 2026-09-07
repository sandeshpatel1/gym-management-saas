/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // System-style neutrals + a dynamic "brand" color driven by CSS vars
        // (set at runtime from the logged-in company's branding.primaryColor)
        brand: 'var(--brand-color)',
        'brand-dark': 'var(--brand-color-dark)',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F5F5F7',
          elevated: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#86868B',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
