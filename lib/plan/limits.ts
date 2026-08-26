/**
 * What each plan is allowed to do.
 *
 * Pure data and pure functions, no server imports, because the same numbers
 * have to be true on the television, on the phone, and in the route handler
 * that actually enforces them. A limit that only exists in the UI is a
 * suggestion.
 */

export type Plan = "free" | "pro";

export type Entitlements = {
  /** How many of the sixteen games this plan can open. */
  games: number | "all";
  /** Boards and packs the model will write, per rolling night. */
  aiPerNight: number | "unlimited";
  /** Phones in a room. */
  players: number;
  /** Writing your own categories and prompts instead of taking the pack. */
  customThemes: boolean;
};

export const ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: {
    games: 3,
    aiPerNight: 2,
    players: 6,
    customThemes: false,
  },
  pro: {
    games: "all",
    aiPerNight: "unlimited",
    players: 12,
    customThemes: true,
  },
};

/**
 * The three games a free host gets.
 *
 * Chosen to be a complete night on their own rather than a sampler: one that
 * needs no phones at all, one that needs one phone, and one that uses the
 * whole room. Somebody who plays only these should have had a good evening
 * and know what they'd be paying for.
 */
export const FREE_GAME_IDS = ["big-board", "most-likely-to", "sketch-and-guess"];

/** A rolling night, so a party that runs past midnight isn't cut off. */
export const NIGHT_MS = 12 * 60 * 60 * 1000;

/**
 * The plan a user is actually on right now.
 *
 * Stored plan and effective plan are different things: Pro that ran out on
 * Sunday is free on Monday whatever the column says. Everything asks this,
 * never the column, so an expiry works without a job to sweep the table — and
 * so a Stripe webhook only ever has to write two fields.
 */
export function effectivePlan(
  stored: Plan | null | undefined,
  expiresAt: Date | string | null | undefined,
): Plan {
  if (stored !== "pro") return "free";
  if (!expiresAt) return "pro"; // no end date — comped, or lifetime
  const ends = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return Number.isFinite(ends.getTime()) && ends.getTime() > Date.now()
    ? "pro"
    : "free";
}

export const entitlementsFor = (plan: Plan): Entitlements => ENTITLEMENTS[plan];

export const canPlay = (plan: Plan, gameId: string): boolean =>
  plan === "pro" || FREE_GAME_IDS.includes(gameId);

export const playerLimit = (plan: Plan): number => ENTITLEMENTS[plan].players;

/** Why a host was stopped, in words the upgrade screen can show. */
export type Gate = "game" | "ai" | "players" | "themes";

export const GATE_COPY: Record<Gate, { title: string; line: string }> = {
  game: {
    title: "This one's on Pro",
    line: "Free hosts get three games. Pro opens all sixteen.",
  },
  ai: {
    title: "That's tonight's writing done",
    line: "Free hosts get two written boards a night. Pro writes as many as you like.",
  },
  players: {
    title: "The room is full",
    line: "Free rooms hold six phones. Pro holds twelve.",
  },
  themes: {
    title: "Your own themes are on Pro",
    line: "Free hosts play the bundled packs. Pro lets you write the whole thing.",
  },
};
