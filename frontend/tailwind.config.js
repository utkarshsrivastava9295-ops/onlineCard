/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f3",
          100: "#fce8e6",
          200: "#f9d5d1",
          300: "#f3b5ae",
          400: "#ea8a7f",
          500: "#d95f52",
          600: "#c44338",
          700: "#a4352c",
          800: "#882f29",
          900: "#712c27",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
