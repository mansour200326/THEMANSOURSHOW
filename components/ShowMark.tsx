"use client";

import { motion, useReducedMotion } from "framer-motion";

const WORDS = ["Big", "Night"];

/**
 * The wordmark.
 *
 * `sm` is the quiet one that sits in a corner all night. `lg` is the cold open,
 * and it earns its animation: the letters drop in and settle, a light runs
 * across them once, and the rules draw outward underneath. It plays exactly
 * once, on the landing page, and never loops — anything that repeats on a
 * screen left on all evening turns into wallpaper.
 */
export function ShowMark({ size = "lg" }: { size?: "lg" | "sm" }) {
  const still = useReducedMotion();

  if (size === "sm") {
    return (
      <span className="brand-text whitespace-nowrap font-display text-base uppercase tracking-[0.2em] sm:text-lg sm:tracking-[0.24em]">
        Big Night
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center font-display uppercase">
      <div className="relative">
        <motion.h1
          className="t-hero flex flex-wrap justify-center gap-x-[0.3em] tracking-[0.08em]"
          initial="hidden"
          animate="shown"
          variants={{
            hidden: {},
            shown: { transition: { staggerChildren: still ? 0 : 0.055 } },
          }}
        >
          {WORDS.map((word) => (
            <span key={word} className="flex">
              {[...word].map((letter, i) => (
                <motion.span
                  key={i}
                  className="brand-text inline-block"
                  style={{ transformOrigin: "50% 100%" }}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: "0.45em",
                      rotateX: -70,
                      filter: "blur(12px)",
                    },
                    shown: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      filter: "blur(0px)",
                      transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h1>

        {/* The glow blooms as the last letter lands, not before. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: still ? 0.55 : [0, 1, 0.6], scale: 1 }}
          transition={{ duration: 1.6, delay: 0.5, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(60% 130% at 50% 50%, rgba(255,107,87,0.4), transparent 70%)",
            filter: "blur(26px)",
          }}
        />

        {/* One pass of light across the letters, once they've settled. */}
        {!still && (
          <motion.span
            aria-hidden
            className="brand-shine t-hero pointer-events-none absolute inset-0 flex flex-wrap justify-center gap-x-[0.3em] tracking-[0.08em]"
            initial={{ backgroundPosition: "180% 0" }}
            animate={{ backgroundPosition: "-80% 0" }}
            transition={{ duration: 1.2, delay: 0.9, ease: "easeInOut" }}
          >
            {WORDS.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </motion.span>
        )}
      </div>

      <div className="mt-2 flex w-full items-center gap-4">
        <motion.span
          className="h-px flex-1 origin-right bg-gradient-to-r from-transparent to-accent/50"
          initial={{ scaleX: still ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.span
          className="t-label whitespace-nowrap text-moon-dim"
          initial={{ opacity: still ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.05 }}
        >
          Games for the room
        </motion.span>
        <motion.span
          className="h-px flex-1 origin-left bg-gradient-to-l from-transparent to-accent/50"
          initial={{ scaleX: still ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
