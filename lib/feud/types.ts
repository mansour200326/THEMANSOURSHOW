/** The Feud — two teams, one survey board, three strikes. */

export type FeudAnswer = {
  text: string;
  points: number;
};

export type FeudQuestion = {
  question: string;
  /** Highest points first. */
  answers: FeudAnswer[];
};

export type FeudTeam = {
  id: string;
  name: string;
  score: number;
};

export type FeudPhase =
  | "setup"
  | "face-off"
  | "play"
  | "steal"
  | "round-end"
  | "winner";

export type FeudState = {
  phase: FeudPhase;
  theme: string;
  teams: FeudTeam[];
  questions: FeudQuestion[];
  round: number;
  /** Index into teams — who's answering. */
  control: number;
  strikes: number;
  /** Points banked on the board this round, not yet awarded. */
  pot: number;
  /** Which answers are face-up, by index. */
  revealed: number[];
  /** How the round finished, for the round-end card. */
  outcome: "cleared" | "stolen" | "held" | null;
  past: FeudState[];
};

export const STRIKES_ALLOWED = 3;

export const currentQuestion = (state: FeudState): FeudQuestion | undefined =>
  state.questions[state.round];

export const otherTeam = (state: FeudState) =>
  (state.control + 1) % Math.max(state.teams.length, 1);

export const allRevealed = (state: FeudState): boolean => {
  const q = currentQuestion(state);
  return Boolean(q) && state.revealed.length >= (q?.answers.length ?? 0);
};
