/**
 * A shout-it-out game, TV-only — nobody types, the host listens and scores.
 *
 *   categories — the category goes up, the teams bid against each other for
 *                how many they reckon they can name, and the winner of the
 *                bid plays the clock alone. One category, one team.
 *
 * The machine is written for a mode so a second shouting game can join it
 * without a rewrite; there was one once, and it may come back.
 */

export type RapidMode = "categories";

export type RapidTeam = {
  id: string;
  name: string;
  score: number;
};

export type RapidPhase =
  | "setup"
  /** Categories only: the room is bidding for the category. */
  | "bidding"
  | "ready"
  | "running"
  | "judge"
  | "winner";

export type RapidState = {
  mode: RapidMode;
  phase: RapidPhase;
  theme: string;
  teams: RapidTeam[];
  prompts: string[];
  /** Index into prompts. */
  round: number;
  /** Whose turn — index into teams. In Categories, who won the bidding. */
  turn: number;
  /**
   * Categories: what the team holding the category said they could name. They
   * have to reach it or the other side takes the points.
   */
  bid: number;
  /** What the last team actually managed, for the reveal. */
  lastCount: number;
  /** Whether the last turn made its bid, for the reveal. */
  lastMade: boolean;
  seconds: number;
  /** Points banked from the turn just judged, for the flash on screen. */
  lastAward: number;
  past: RapidState[];
};

export const RAPID_SECONDS: Record<RapidMode, number> = {
  categories: 30,
};

export const RAPID_TITLE: Record<RapidMode, string> = {
  categories: "Categories",
};

export const RAPID_RULE: Record<RapidMode, string> = {
  categories: "Bid for the category, then name as many as you claimed.",
};

/** Categories is bid for; a mode that isn't simply goes round the teams. */
export const RAPID_BIDS = (mode: RapidMode) => mode === "categories";

export const rapidPrompt = (s: RapidState): string | undefined =>
  s.prompts[s.round];
