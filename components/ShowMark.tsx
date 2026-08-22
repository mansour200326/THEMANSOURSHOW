"use client";

import { motion, useReducedMotion } from "framer-motion";

const WORDS = ["Big", "Night"];
const LETTERS = WORDS.join("").length;

/**
 * The moment the letters hit, in seconds. Everything loud is pinned to it —
 * flash, shockwave, sparks, the kick — so it all lands as one bang instead of
 * a sequence of separate effects.
 *
 * Everything downstream is expressed as IMPACT plus an offset, and nothing is
 * allowed to start after the blast has finished. A gap between the last effect
 * ending and the next thing starting reads as the page having hung, which is
 * worse than the animation being too long.
 */
export const IMPACT = 0.6;

const SPARKS = 16;

/**
 * Deterministic scatter. Random here would desync the server and client render,
 * and the golden angle spreads them without any two lining up.
 */
const spark = (i: number) => {
  const angle = (i * 137.508 * Math.PI) / 180;
  const reach = 26 + (i % 4) * 7;
  return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach * 0.62 };
};

/** Which way each letter comes in from, so they don't arrive as a neat row. */
const entry = (i: number) => ({
  x: (i % 2 === 0 ? -1 : 1) * (8 + (i % 3) * 5),
  y: i % 3 === 0 ? -22 : 18,
  rotate: (i % 2 === 0 ? -1 : 1) * (14 + (i % 4) * 6),
});

/**
 * The wordmark.
 *
 * `sm` is the quiet one that sits in a corner all night. `lg` is the cold open,
 * and it detonates: the letters are thrown in from different directions and
 * slam into place hard enough to overshoot, the impact throws a flash, a
 * shockwave and sparks, and the whole mark takes the recoil.
 *
 * The whole thing runs about a second and a half and never loops. This is a
 * party starting, not a screensaver.
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

  if (still) {
    return (
      <div className="flex flex-col items-center font-display uppercase">
        <h1 className="brand-text t-hero tracking-[0.08em] drop-shadow-[0_0_50px_rgba(255,107,87,0.35)]">
          Big Night
        </h1>
        <Rule />
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex flex-col items-center font-display uppercase"
      /* The recoil. The mark itself takes the hit, not the page. */
      animate={{
        x: [0, -10, 8, -5, 3, -1, 0],
        y: [0, 6, -5, 3, -2, 1, 0],
        rotate: [0, -0.8, 0.6, -0.35, 0.15, 0],
      }}
      transition={{ duration: 0.7, delay: IMPACT, ease: "easeOut" }}
    >
      {/* Blast light, one frame of overexposure */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.3, 1.6, 2.2] }}
        transition={{ duration: 0.8, delay: IMPACT, ease: "easeOut" }}
        style={{
          // Soft gradient stops rather than a CSS blur filter. Animating scale
          // and opacity on a blurred layer is the one thing here that can drop
          // frames, and the gradient looks the same without it.
          background:
            "radial-gradient(circle, rgba(255,220,210,0.85) 0%, rgba(255,107,87,0.45) 30%, rgba(255,107,87,0.12) 52%, transparent 72%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Shockwave */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[26vmin] w-[26vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-coral"
        initial={{ opacity: 0, scale: 0.15 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.15, 1.5, 2.9] }}
        transition={{ duration: 1, delay: IMPACT, ease: [0.1, 0.8, 0.3, 1] }}
      />

      {/* Sparks thrown out of the middle */}
      {Array.from({ length: SPARKS }).map((_, i) => {
        const { x, y } = spark(i);
        return (
          <motion.span
            aria-hidden
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[0.5vmin] w-[0.5vmin] rounded-full bg-coral-bright"
            initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: [0, 1, 0],
              x: `${x}vmin`,
              y: `${y}vmin`,
              scale: [1, 0.9, 0.2],
            }}
            transition={{
              duration: 0.8 + (i % 3) * 0.1,
              delay: IMPACT,
              ease: [0.05, 0.8, 0.2, 1],
            }}
          />
        );
      })}

      <h1 className="t-hero flex flex-wrap justify-center gap-x-[0.3em] tracking-[0.08em]">
        {WORDS.map((word, w) => (
          <span key={word} className="flex">
            {[...word].map((letter, i) => {
              // Index across the whole wordmark, so the stagger runs B→T.
              const n = w === 0 ? i : WORDS[0].length + i;
              const from = entry(n);
              return (
                <motion.span
                  key={i}
                  className="brand-text inline-block"
                  initial={{
                    opacity: 0,
                    scale: 3.2,
                    x: `${from.x}vmin`,
                    y: `${from.y}vmin`,
                    rotate: from.rotate,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    // Stiff and underdamped: they arrive too fast and bounce
                    // back off the stop. That overshoot is the whole effect.
                    type: "spring",
                    stiffness: 320,
                    damping: 16,
                    mass: 1.2,
                    delay: (n / LETTERS) * IMPACT,
                    opacity: { duration: 0.2, delay: (n / LETTERS) * IMPACT },
                    filter: { duration: 0.34, delay: (n / LETTERS) * IMPACT },
                  }}
                >
                  {letter}
                </motion.span>
              );
            })}
          </span>
        ))}
      </h1>

      <Rule animated />
    </motion.div>
  );
}

/** The strapline and its two rules, snapping outward on the recoil. */
function Rule({ animated }: { animated?: boolean }) {
  const line = "h-px flex-1 bg-gradient-to-r from-transparent to-accent/50";
  if (!animated) {
    return (
      <div className="mt-2 flex w-full items-center gap-4">
        <span className={line} />
        <span className="t-label whitespace-nowrap text-moon-dim">
          Games for the room
        </span>
        <span className={`${line} rotate-180`} />
      </div>
    );
  }
  return (
    <div className="mt-2 flex w-full items-center gap-4">
      <motion.span
        className={`${line} origin-right`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: IMPACT + 0.08, ease: [0.2, 1, 0.3, 1] }}
      />
      <motion.span
        className="t-label whitespace-nowrap text-moon-dim"
        initial={{ opacity: 0, letterSpacing: "0.8em" }}
        animate={{ opacity: 1, letterSpacing: "0.22em" }}
        transition={{ duration: 0.6, delay: IMPACT + 0.08, ease: [0.2, 1, 0.3, 1] }}
      >
        Games for the room
      </motion.span>
      <motion.span
        className={`${line} origin-left rotate-180`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: IMPACT + 0.08, ease: [0.2, 1, 0.3, 1] }}
      />
    </div>
  );
}
