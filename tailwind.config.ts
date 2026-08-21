import type { Config } from "tailwindcss";

/**
 * "Midnight & Coral".
 *
 * Two rules run this palette:
 *   1. Coral is the brand and nothing else — the logo, primary buttons, and
 *      celebration moments. It never belongs to a single game.
 *   2. Everything a game lights up uses `accent`, which is a CSS variable set
 *      per game family (see the .g-* classes in globals.css). That's why you
 *      won't find aqua/violet/magenta/lime sprinkled through the components.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* The room the show is staged in. Never pure black. */
        midnight: {
          DEFAULT: "#101A3C",
          deep: "#0B1330",
          soft: "#16224A",
        },
        /* Cards, panels, tiles — one step up out of the dark. */
        dusk: {
          DEFAULT: "#1C2A55",
          lit: "#25356A",
          line: "#2E3F76",
        },
        /* Text. Never pure white. */
        moon: {
          DEFAULT: "#F4F2EC",
          dim: "#C6CADA",
          deep: "#8B93AE",
        },
        /* Brand only: logo, primary buttons, winners. */
        coral: {
          DEFAULT: "#FF6B57",
          bright: "#FF8D7C",
          deep: "#DE4B37",
        },
        /* The four game families, for reference and for the lineup dots. */
        family: {
          trivia: "#37D3C8",
          deception: "#8E7CFF",
          social: "#E8508D",
          word: "#A8E05F",
        },
        /* Whatever is lighting the current screen. Set by a .g-* class. */
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          bright: "rgb(var(--accent-bright-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tile: "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.45)",
        glow: "0 0 60px rgb(var(--accent-rgb) / 0.22)",
        brand: "0 0 60px rgba(255,107,87,0.28)",
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
