"use client";

import { useEffect, useState } from "react";

/**
 * Lights on, lights off.
 *
 * Dark is the default — it's the brand, and it's what a television in a
 * dim room wants. Light is the same product for a bright kitchen or a
 * phone in daylight. The choice is stored, and applied before first paint
 * by a script in the layout, so nobody who chose light ever sees the dark
 * stage flash past on the way in.
 */
const KEY = "bignight:theme";
type Theme = "dark" | "light";

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* private mode — it still flips for this visit */
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Lights on" : "Lights off"}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full border border-line/10 bg-midnight/70 text-lg",
        "opacity-35 transition-all duration-200 hover:border-accent/50 hover:opacity-100",
        className,
      ].join(" ")}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

/** Runs before React, from the layout. Reads the stored choice and sets it. */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="light")document.documentElement.dataset.theme="light";}catch(e){}})();`;
