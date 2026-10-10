/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',         // iPhone SE & compact mobile
      'sm': '640px',         // Large mobile / phablets
      'md': '768px',         // iPad / tablets (portrait)
      'lg': '1024px',        // iPad landscape & 10-12" laptops
      'xl': '1280px',        // 13-15" laptops
      '2xl': '1536px',       // 16" laptops & 21-24" desktop
      '3xl': '1920px',       // 24-27" 1080p desktop
      '4xl': '2560px',       // 27-32" 1440p / 2K monitors
      'ultrawide': '3440px', // 34-35"+ ultrawide & 4K displays
    },
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      colors: {
        kc: '#E31837',
        buf: '#00338D',
        phi: '#004C54',
        sf: '#AA0000',
      }
    },
  },
  plugins: [],
}
