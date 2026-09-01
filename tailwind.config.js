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
          bg: "#0A0A0C",
          card: "#121214",
          border: "#242427",
          muted: "#71717A",
        },
        brand: {
          DEFAULT: "#D4AF37",
          light: "#E8C766",
          dark: "#B8912A",
        },
        audiomack: {
          DEFAULT: "#FF8200",
        },
        boomplay: {
          DEFAULT: "#FFC107",
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
