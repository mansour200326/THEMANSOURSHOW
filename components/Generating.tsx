"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * The screen while the AI writes.
 *
 * This can run for the better part of a minute, which is a long time to stare
 * at a room full of people saying nothing is happening. So the screen shows
 * the work: each category is a card with a rail that fills as its clues get
 * written, a cursor blinks under whichever one is "being worked on", and the
 * line underneath changes every few seconds. None of it is real progress —
 * the model doesn't report any — but it moves at about the speed the writing
 * does, and a screen that moves is a screen nobody refreshes.
 *
 * Nothing here fades in from nothing. A throttled tab can leave a fade at its
 * first frame, and a loading screen with nothing on it is exactly the thing
 * this exists to prevent.
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

/** How long the rails take to fill, roughly what a board takes. */
const EXPECTED_MS = 45_000;

export function Generating({
  title,
  items,
  note,
  onCancel,
}: {
  /** What's being written — "Writing the board", "Writing the survey". */
  title: string;
  /** The topics it's being written from, shown as cards being filled in. */
  items: string[];
  note?: string;
  onCancel: () => void;
}) {
  const [line, setLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setLine((n) => (n + 1) % REASSURANCE.length),
      3800,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - started), 250);
    return () => window.clearInterval(id);
  }, []);

  // The cards fill one after another, the last one never quite finishing.
  const overall = Math.min(0.96, elapsed / EXPECTED_MS);
  const per = items.length ? 1 / items.length : 1;
  const working = Math.min(items.length - 1, Math.floor(overall / per));

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[4vmin] px-6 text-center">
      <div>
        <p className="t-label font-display uppercase text-moon-deep">
          Big Night presents
        </p>
        <h1 className="accent-text mt-1 font-display text-[clamp(2.2rem,6vw,6rem)] font-bold uppercase leading-none tracking-tight">
          {title}
        </h1>
      </div>

      {items.length > 0 && (
        <div className="flex w-full max-w-5xl flex-wrap justify-center gap-[1vmin]">
          {items.map((label, i) => {
            const fill = Math.max(0, Math.min(1, (overall - i * per) / per));
            const done = fill >= 1;
            return (
              <motion.div
                key={label + i}
                initial={{ y: 18, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 220, damping: 20 }}
                className={[
                  "relative flex min-w-[13rem] flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border px-5 py-[2.2vmin]",
                  done
                    ? "border-emerald-400/40 bg-emerald-500/[0.07]"
                    : i === working
                      ? "border-accent/50 bg-accent/[0.07]"
                      : "border-line/10 bg-line/[0.02]",
                ].join(" ")}
              >
                <span className="font-display text-[clamp(1rem,1.6vw,1.9rem)] uppercase tracking-wider text-moon">
                  {label}
                </span>
                {/* The rail: how much of this category is written. */}
                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line/10">
                  <span
                    className={`block h-full rounded-full transition-[width] duration-500 ease-linear ${done ? "bg-emerald-400" : "bg-accent"}`}
                    style={{ width: `${Math.round(fill * 100)}%` }}
                  />
                </span>
                <span className="font-display text-[clamp(0.75rem,1vw,1.2rem)] uppercase tracking-[0.2em] text-moon-deep">
                  {done ? "Written" : i === working ? "Writing…" : "Waiting"}
                </span>
                {i === working && !done && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-line/12 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* A pulse that keeps time, so the screen never looks stalled. */}
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-accent"
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.2, 0.85] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.13, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="min-h-[3.5rem] max-w-2xl">
        <motion.p
          key={line}
          initial={{ y: 6 }}
          animate={{ y: 0 }}
          className="font-display text-[clamp(1rem,1.6vw,1.9rem)] uppercase tracking-[0.2em] text-accent"
        >
          {REASSURANCE[line]}
        </motion.p>
        {note && (
          <p className="mt-2 text-balance text-[clamp(0.95rem,1.3vw,1.5rem)] text-moon-dim">{note}</p>
        )}
      </div>

      <button onClick={onCancel} className="btn-ghost text-[clamp(0.9rem,1.2vw,1.4rem)]">
        Cancel
      </button>
    </main>
  );
}
