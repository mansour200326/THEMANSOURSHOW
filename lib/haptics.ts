"use client";

/**
 * The phone in your hand, agreeing with the screen.
 *
 * A buzzer game where the phone doesn't kick when you buzz is leaving half
 * the feedback on the table — the player is looking at the television, not
 * their hand, and the hand is where the news should arrive.
 *
 * Android does this through navigator.vibrate. iOS Safari doesn't expose it
 * at all, and there is no honest web substitute; on an iPhone these calls
 * do nothing, silently, and the game is exactly as it was. That's the whole
 * design: it can only add.
 */
const PATTERNS = {
  /** You buzzed and it counted. */
  buzz: [40],
  /** It's you — your turn, your pick, your clue. */
  turn: [30, 60, 30],
  /** Points. */
  right: [20, 40, 20, 40, 60],
  /** No points. */
  wrong: [120],
  /** Something arrived — a prompt, a question, the round starting. */
  nudge: [15],
} as const;

export type Haptic = keyof typeof PATTERNS;

export function haptic(kind: Haptic) {
  try {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    nav.vibrate?.([...PATTERNS[kind]]);
  } catch {
    /* A phone that can't buzz is still a phone that can play. */
  }
}
