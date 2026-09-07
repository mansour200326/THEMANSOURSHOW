"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { play } from "@/lib/sound";

/** How long "GO" stays up after the round goes live. */
const GO_MS = 600;

/**
 * Three, two, one, go — on the television, before a timed round.
 *
 * Reads the same start stamp the clocks read, so it can't disagree with
 * them: the digits are on screen exactly while every clock says the round
 * hasn't started. Each number gets a beat; "go" gets the sting. It sits
 * over the screen and never replaces it, so the prompt underneath is
 * readable the whole time — people should be reading it during the count.
 *
 * Everything shown is computed from the stamp and the clock, on every tick.
 * An earlier version remembered the previous digit to decide when to show
 * "GO", and that memory was one render behind, so GO flashed for a frame or
 * stuck. Now: digits while three seconds or fewer remain, GO for a fixed
 * window after zero, nothing otherwise. No memory, nothing to get stuck.
 */
export function CountIn({ startedAt }: { startedAt: number | null | undefined }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 50);
    return () => window.clearInterval(id);
  }, [startedAt]);

  let shown: string | null = null;
  if (startedAt) {
    const until = (startedAt - now) / 1000;
    if (until > 0 && until <= 3) shown = String(Math.ceil(until));
    else if (until <= 0 && -until * 1000 < GO_MS) shown = "GO";
  }

  // A beat per digit and the sting on go, each exactly once.
  const sounded = useRef<string | null>(null);
  useEffect(() => {
    if (shown === sounded.current) return;
    sounded.current = shown;
    if (shown === "GO") play("go");
    else if (shown) play("countdown");
  }, [shown]);

  /*
   * No exit animation, on purpose. The digits change every second, and an
   * element mid-exit stays in the tree until its animation finishes — which
   * a throttled tab never does, so exited digits piled up as ghosts behind
   * the clock. Only the current digit is rendered; when there isn't one,
   * nothing is. There is nothing to strand.
   */
  if (!shown) return null;
  return (
    <>
      {(
        <motion.div
          key={shown}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
        >
          <span
            className={[
              "accent-text font-display text-[clamp(6rem,28vmin,22rem)] font-bold leading-none drop-shadow-[0_0_60px_rgb(var(--accent-rgb)/0.5)]",
              // GO hides itself on a CSS timeline as well: the tick that
              // would clear it is the first thing a busy tab starves.
              shown === "GO" ? "animate-go-out" : "",
            ].join(" ")}
          >
            {shown}
          </span>
        </motion.div>
      )}
    </>
  );
}
