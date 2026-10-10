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
        // Surface/text colors come from CSS variables (styles/globals.css)
        // so the whole UI flips between the dark and light themes by
        // toggling a class on <html>. Stored as RGB channels so Tailwind's
        // opacity modifiers (bg-base-bg/95, text-base-muted/60) keep working.
        base: {
          bg: "rgb(var(--c-bg) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
          border: "rgb(var(--c-border) / <alpha-value>)",
          muted: "rgb(var(--c-muted) / <alpha-value>)",
        },
        // Primary text color: white in dark mode, near-black in light mode.
        // Use text-white only for text sitting on brand/black backgrounds.
        fg: "rgb(var(--c-fg) / <alpha-value>)",
        brand: {
          // Electric neon orange — the Droppa.fm accent (upgraded from the
          // earlier champagne gold per direct request). Kept distinct from
          // Audiomack's orange (#FF8200) by pushing redder/more saturated.
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          light: "rgb(var(--c-brand-light) / <alpha-value>)",
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
        glass: "var(--shadow-glass)",
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
