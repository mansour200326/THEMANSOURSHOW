/**
 * Two shout-it-out games that share a machine:
 *   categories  — 30 seconds to name as many as you can
 *   five-seconds — 5 seconds to name exactly three
 * Both are TV-only. Nobody types; the host listens and scores.
 */

export type RapidMode = "categories" | "five-seconds";

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
  "five-seconds": 5,
};

export const RAPID_TITLE: Record<RapidMode, string> = {
  categories: "Categories",
  "five-seconds": "5 Second Rule",
};

export const RAPID_RULE: Record<RapidMode, string> = {
  categories: "Name as many as you can before the clock runs out.",
  "five-seconds": "Name three. Five seconds. Go.",
};

export const rapidPrompt = (s: RapidState): string | undefined =>
  s.prompts[s.round];
