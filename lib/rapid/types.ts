/**
 * Two shout-it-out games that share a machine. Both are TV-only — nobody types,
 * the host listens and scores.
 *
 *   categories    — the category goes up, the teams bid against each other for
 *                   how many they reckon they can name, and the winner of the
 *                   bid plays the clock alone. One category, one team.
 *   three-in-five — five seconds to name three. Teams simply alternate.
 */

export type RapidMode = "categories" | "three-in-five";

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
  "three-in-five": 5,
};

export const RAPID_TITLE: Record<RapidMode, string> = {
  categories: "Categories",
  "three-in-five": "Three in Five",
};

export const RAPID_RULE: Record<RapidMode, string> = {
  categories: "Bid for the category, then name as many as you claimed.",
  "three-in-five": "Name three. Five seconds. Go.",
};

/** Only Categories is bid for; Three in Five just goes round the teams. */
export const RAPID_BIDS = (mode: RapidMode) => mode === "categories";

export const rapidPrompt = (s: RapidState): string | undefined =>
  s.prompts[s.round];
