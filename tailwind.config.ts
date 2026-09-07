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
        /*
         * The stage, the panels and the text are CSS variables rather than
         * hex, so a second theme is a second set of values in globals.css and
         * not a second set of components. Dark is the default — it's the
         * brand — and light is the same product with the lights on.
         */
        midnight: {
          DEFAULT: "rgb(var(--midnight-rgb) / <alpha-value>)",
          deep: "rgb(var(--midnight-deep-rgb) / <alpha-value>)",
          soft: "rgb(var(--midnight-soft-rgb) / <alpha-value>)",
        },
        /* Cards, panels, tiles — one step up out of the dark. */
        dusk: {
          DEFAULT: "rgb(var(--dusk-rgb) / <alpha-value>)",
          lit: "rgb(var(--dusk-lit-rgb) / <alpha-value>)",
          line: "rgb(var(--dusk-line-rgb) / <alpha-value>)",
        },
        /* Text. Never pure white — or, in the light, never pure black. */
        moon: {
          DEFAULT: "rgb(var(--moon-rgb) / <alpha-value>)",
          dim: "rgb(var(--moon-dim-rgb) / <alpha-value>)",
          deep: "rgb(var(--moon-deep-rgb) / <alpha-value>)",
        },
        /*
         * The ink for translucent lines and fills — hairline borders, the
         * faint wash behind a panel. White on the dark stage; midnight on the
         * light one. Everything that used to be white-at-ten-percent is this.
         */
        line: "rgb(var(--line-rgb) / <alpha-value>)",
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
        tile: "inset 0 1px 0 rgb(var(--line-rgb) / 0.08), 0 10px 30px rgb(var(--shadow-rgb) / 0.45)",
        glow: "0 0 60px rgb(var(--accent-rgb) / 0.22)",
        brand: "0 0 60px rgba(255,107,87,0.28)",
      },
      keyframes: {
        /* In over 0.2s, hold, out over 0.2s, then gone — 1.4s end to end. */
        "go-out": {
          "0%": { visibility: "visible" },
          "99%": { visibility: "visible" },
          "100%": { visibility: "hidden" },
        },
        "round-card": {
          "0%": { transform: "translateY(40px)", visibility: "visible" },
          "14%": { transform: "translateY(0)" },
          "86%": { transform: "translateY(0)", visibility: "visible" },
          "99%": { transform: "translateY(-40px)", visibility: "visible" },
          "100%": { transform: "translateY(-40px)", visibility: "hidden" },
        },
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
        "round-card": "round-card 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "go-out": "go-out 0.6s linear forwards",
        "pop-in": "pop-in 220ms cubic-bezier(0.22,1,0.36,1)",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
