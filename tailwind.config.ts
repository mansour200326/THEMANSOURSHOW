import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Deep blue — the room the show is staged in. */
        ink: {
          950: "#050e22",
          900: "#08152f",
          800: "#0d2047",
          700: "#153064",
        },
        stage: {
          DEFAULT: "#0e1e46",
          tile: "#1a4499",
          tileDeep: "#0a1c46",
          line: "#24407e",
        },
        /* Cream — everything the eye is meant to land on. */
        cream: {
          DEFAULT: "#f0e4c6",
          bright: "#fdf6e6",
          deep: "#c7b48c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tile: "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.45)",
        glow: "0 0 60px rgba(240,228,198,0.22)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pop-in": "pop-in 220ms cubic-bezier(0.22,1,0.36,1)",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
