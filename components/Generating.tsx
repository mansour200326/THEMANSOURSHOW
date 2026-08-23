"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * The screen while the AI writes.
 *
 * This can run for the better part of a minute, which is a long time to stare
 * at a room full of people saying nothing is happening. Three things keep it
 * alive: the topics shimmer as though they're being worked on, a row of dots
 * keeps time, and the line underneath changes every few seconds so the screen
 * visibly isn't frozen.
 *
 * Cancel is always there. A host who changes their mind, or an API having a
 * bad night, shouldn't need a refresh to get out.
 */

const REASSURANCE = [
  "Thinking of the good ones…",
  "Checking the facts…",
  "Making sure nothing repeats…",
  "Getting the difficulty right…",
  "Nearly there…",
];

export function Generating({
  title,
  items,
  note,
  onCancel,
}: {
  /** What's being written — "Writing the board", "Writing the survey". */
  title: string;
  /** The topics it's being written from, shown as shimmering cards. */
  items: string[];
  note?: string;
  onCancel: () => void;
}) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setLine((n) => (n + 1) % REASSURANCE.length),
      3800,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[4vmin] px-6 text-center">
      <div>
        <p className="t-label font-display uppercase text-moon-deep">
          Big Night presents
        </p>
        <h1 className="accent-text mt-1 font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
          {title}
        </h1>
      </div>

      {items.length > 0 && (
        <div className="flex w-full max-w-4xl flex-wrap justify-center gap-[0.6vmin]">
          {items.map((label, i) => (
            <motion.div
              key={label + i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex min-w-[12rem] flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-dusk-lit/60 to-midnight-deep px-4 py-6"
            >
              <span className="font-display text-sm uppercase tracking-wider text-moon sm:text-lg">
                {label}
              </span>
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "linear",
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* A pulse that keeps time, so the screen never looks stalled. */}
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-accent"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.15, 0.85] }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              delay: i * 0.13,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="min-h-[3.5rem] max-w-xl">
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display uppercase tracking-[0.2em] text-accent"
        >
          {REASSURANCE[line]}
        </motion.p>
        {note && (
          <p className="mt-2 text-balance text-sm text-moon-dim">{note}</p>
        )}
      </div>

      <button onClick={onCancel} className="btn-ghost text-sm">
        Cancel
      </button>
    </main>
  );
}
