/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0B0B0F",
          card: "#131316",
          border: "#232329",
          muted: "#8A8A93",
        },
        brand: {
          DEFAULT: "#7C5CFC",
          light: "#9B82FF",
          dark: "#5B3FE0",
        },
        audiomack: {
          DEFAULT: "#FFA200",
        },
        boomplay: {
          DEFAULT: "#F3D93A",
        },
        spotify: {
          DEFAULT: "#1DB954",
        },
        apple: {
          DEFAULT: "#FA243C",
        },
        youtube: {
          DEFAULT: "#FF0000",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
