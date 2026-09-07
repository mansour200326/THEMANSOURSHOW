/**
 * Three, two, one.
 *
 * A timed round used to start the instant its phase began, which meant the
 * clock was already running while the room was still looking down at the
 * last thing. Every timed phase now stamps its start three seconds in the
 * future. Clocks on the television and on every phone compute from that
 * same stamp, so they all agree the round hasn't started yet — and the TV
 * counts the gap down out loud.
 *
 * Nothing is added to the round itself. The seconds are before it: a beat
 * and a half for the round card, then three, two, one. The card and the
 * count are both full-screen, and they used to fire together — "3" behind
 * "ROUND 1 OF 6" — so the count only draws its digits once it's down to
 * three, which is after the card has gone.
 */
export const LEAD_IN_MS = 4500;

/** When a timed phase should be stamped to start. */
export const startsAfterLeadIn = () => Date.now() + LEAD_IN_MS;

/** Seconds of count-in remaining, or 0 once the round is live. */
export const leadInLeft = (startedAt: number | null | undefined): number =>
  startedAt ? Math.max(0, (startedAt - Date.now()) / 1000) : 0;

/**
 * Seconds left on a clock that may not have started yet. Before the stamp
 * it's the full length; after, it counts down; never below zero.
 */
export const clockLeft = (startedAt: number | null | undefined, seconds: number): number =>
  startedAt ? Math.min(seconds, Math.max(0, seconds - (Date.now() - startedAt) / 1000)) : seconds;
