"use client";

import { useEffect, useRef, useState } from "react";
import { play } from "@/lib/sound";

/**
 * "Round 3 of 8", full screen, for a second and a bit.
 *
 * Rounds used to run straight into each other and the night had no rhythm:
 * you couldn't feel where you were. This is the beat between them.
 *
 * It's a CSS animation, start to finish — in, hold, out, hidden — rather
 * than a timer that hides it. A timer is the first thing a browser throttles
 * on a busy or backgrounded tab, and the first version's card overstayed by
 * most of a second and landed on top of the count-in that follows it. The
 * compositor doesn't get throttled. The element stays in the tree, hidden,
 * until the next round replaces it; it takes no pointer events and never
 * covers the screen for longer than its timeline says.
 */
export function useRoundCard(round: number, total: number, enabled = true) {
  const [shown, setShown] = useState<number | null>(null);
  const seen = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || total <= 1) return;
    if (seen.current === round) return;
    seen.current = round;
    setShown(round);
    play("card");
  }, [round, total, enabled]);

  if (shown === null) return null;
  return (
    <div
      key={shown}
      aria-hidden
      className="animate-round-card pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 backdrop-blur-sm"
    >
      <div className="text-center">
        <p className="font-display text-[clamp(1rem,2.4vw,2.4rem)] uppercase tracking-[0.4em] text-moon-deep">
          Round
        </p>
        <p className="accent-text font-display text-[clamp(4rem,18vmin,14rem)] font-bold leading-none">
          {shown + 1}
        </p>
        <p className="font-display text-[clamp(1rem,2.2vw,2.2rem)] uppercase tracking-[0.3em] text-moon-dim">
          of {total}
        </p>
      </div>
    </div>
  );
}
