import "server-only";

/**
 * Whether plan limits apply at all.
 *
 * Off by default. The tiers are built, tested and dormant: nothing is locked,
 * every host gets every game, twelve phones and as much writing as they want
 * — which is how Big Night worked before any of this existed and how it works
 * again now.
 *
 * This is one switch rather than a deletion because the limits weren't wrong,
 * they were early. Charging for something needs a product people already miss
 * when it's gone, and there is no point rationing games among a group of
 * friends who haven't finished playing them yet.
 *
 * Set BIGNIGHT_PLANS=on to turn enforcement back on. Everything downstream —
 * the lobby badges, the upgrade screens, the room caps, the nightly
 * allowance — follows from this one call, so there is nothing else to
 * remember and nothing to re-enable by hand.
 *
 * The content library is deliberately *not* behind this switch. It saves
 * money and time whether or not anybody is paying, and it always did.
 */
export const plansEnforced = (): boolean =>
  process.env.BIGNIGHT_PLANS?.trim().toLowerCase() === "on";
