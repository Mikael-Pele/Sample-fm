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
          // Electric neon orange — the Sample.fm accent (upgraded from the
          // earlier champagne gold per direct request). Kept distinct from
          // Audiomack's orange (#FF8200) by pushing redder/more saturated.
          DEFAULT: "#FF4D00",
          light: "#FF8A5B",
          dark: "#D93E00",
        },
        audiomack: {
          DEFAULT: "#FF8200",
        },
        boomplay: {
          // Boomplay's real brand mark is cyan/turquoise, not yellow —
          // corrected to match their actual logo.
          DEFAULT: "#00E5D4",
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
        deezer: {
          DEFAULT: "#FEAA2D",
        },
        tidal: {
          DEFAULT: "#FFFFFF",
        },
        soundcloud: {
          DEFAULT: "#FF3300",
        },
        pandora: {
          DEFAULT: "#224099",
        },
        iheartradio: {
          DEFAULT: "#C6002B",
        },
        whatsapp: {
          DEFAULT: "#25D366",
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
