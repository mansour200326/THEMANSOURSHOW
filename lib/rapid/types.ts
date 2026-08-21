/**
 * Two shout-it-out games that share a machine:
 *   categories  — 30 seconds to name as many as you can
 *   five-seconds — 5 seconds to name exactly three
 * Both are TV-only. Nobody types; the host listens and scores.
 */

export type RapidMode = "categories" | "three-in-five";

export type RapidTeam = {
  id: string;
  name: string;
  score: number;
};

export type RapidPhase =
  | "setup"
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
  /** Whose turn — index into teams. */
  turn: number;
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
  categories: "Name as many as you can before the clock runs out.",
  "three-in-five": "Name three. Five seconds. Go.",
};

export const rapidPrompt = (s: RapidState): string | undefined =>
  s.prompts[s.round];
