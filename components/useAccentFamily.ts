"use client";

import { useEffect } from "react";
import { FAMILY_OF } from "@/lib/games/families";

const ALL = ["g-trivia", "g-deception", "g-social", "g-word"];

/**
 * Lights the whole document in the current game's colour.
 *
 * The room screens swap between games without unmounting, and each one renders
 * from a dozen different branches, so stamping the class on <html> beats
 * threading a wrapper through all of them. Pass null to go back to neutral.
 */
export function useAccentFamily(gameId?: string | null) {
  useEffect(() => {
    const family = gameId ? FAMILY_OF[gameId] : undefined;
    const root = document.documentElement;
    root.classList.remove(...ALL);
    if (family) root.classList.add(`g-${family}`);
    return () => root.classList.remove(...ALL);
  }, [gameId]);
}
