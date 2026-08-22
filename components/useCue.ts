"use client";

import { useEffect, useRef } from "react";
import { type Cue, play } from "@/lib/sound";

/**
 * Play a cue when something changes — a buzz landing, a tile turning, a team
 * going out.
 *
 * The first render never makes a noise. Games reconnect, re-hydrate and
 * re-render constantly, and a screen that shouts the moment it appears would
 * fire the whole soundtrack at once on every rejoin.
 */
export function useCue(key: unknown, cue: Cue | null) {
  const seen = useRef<unknown>(undefined);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      seen.current = key;
      return;
    }
    if (key === seen.current) return;
    seen.current = key;
    if (cue) play(cue);
  }, [key, cue]);
}

/** Fires once, when a condition first becomes true. */
export function useCueWhen(active: boolean, cue: Cue) {
  const fired = useRef(false);
  useEffect(() => {
    if (active && !fired.current) {
      fired.current = true;
      play(cue);
    }
    if (!active) fired.current = false;
  }, [active, cue]);
}
