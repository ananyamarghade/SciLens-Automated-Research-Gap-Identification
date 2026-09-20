/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scilens: {
          ivory: '#FBFBFA',
          parchment: '#F4F3EE',
          warmgray: '#EFECE6',
          border: '#E3E0D8',
          subtle: '#D6D2C4',
          navy: '#0B132B',
          slate: '#1E293B',
          muted: '#5A687D',
          lightmuted: '#8A97A8',
          teal: '#1B6B75',
          darkteal: '#124A52',
          lightteal: '#E8F3F5',
          borderteal: '#B5D8DC',
          crimson: '#9E3838',
          lightcrimson: '#FDF2F2',
          amber: '#B8860B',
          lightamber: '#FEF9E7',
          emerald: '#2D7A5D',
          lightemerald: '#F0F9F5',
          // Dark mode extensions
          darkbg: '#070D1E',
          darkcard: '#0C1428',
          darkborder: '#1A243D',
          darksubtle: '#223050',
          darkmuted: '#94A3B8',
          darklightmuted: '#64748B',
          glowteal: '#2DD4BF',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(11, 19, 43, 0.04), 0 1px 2px rgba(11, 19, 43, 0.02)',
        'elevated': '0 4px 16px -2px rgba(11, 19, 43, 0.05), 0 2px 6px -1px rgba(11, 19, 43, 0.03)',
        'artifact': '0 12px 32px -4px rgba(11, 19, 43, 0.08), 0 4px 12px -2px rgba(11, 19, 43, 0.04)',
        'layer': '0 20px 40px -8px rgba(11, 19, 43, 0.12), 0 8px 16px -4px rgba(11, 19, 43, 0.06)',
        'glow': '0 0 25px rgba(27, 107, 117, 0.25)',
        'glow-cyan': '0 0 30px rgba(45, 212, 191, 0.22)',
      }
    },
  },
  plugins: [],
}
