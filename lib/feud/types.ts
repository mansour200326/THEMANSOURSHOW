/** Face-Off — two teams, one survey board, three strikes. */

export type FeudAnswer = {
  text: string;
  points: number;
  /**
   * Other ways people say this one. A survey answer is a category, not a
   * string — someone who shouts "chips" has said "snacks" — and no amount of
   * letter-comparing gets you there. Written with the pack, so the common
   * cases cost nothing at judging time.
   */
  accept?: string[];
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
  outcome: "cleared" | "all-out" | null;
  /** Answers each team has opened this round, by team index. */
  contributions: number[];
  /** Teams that have already struck out this round, by index. */
  struckOut: number[];
  /** Stamped when the board changes hands, so the TV can announce it. */
  handoverAt: number | null;
  /**
   * The shot clock. Nothing enforces it — a team that runs out doesn't strike
   * automatically, because a clock that punishes you over a slow phone is
   * worse than no clock. It's there to be looked at: it stops the huddle that
   * goes on for two minutes, and the host still calls it.
   */
  clock: { startedAt: number; seconds: number } | null;
  /** Seconds a team gets per answer. 0 means no clock at all. */
  clockSeconds: number;
  /** What the host last typed, and whether it landed. */
  lastGuess: {
    text: string;
    matched: number | null;
    /** They said one that was already face-up — no strike for that. */
    repeat?: boolean;
    at: number;
  } | null;
  past: FeudState[];
};

export const STRIKES_ALLOWED = 3;

/**
 * Think time per answer, chosen at setup.
 *
 * Twenty seconds was hardcoded and it's too fast for most rooms — a team
 * huddles, argues, and the number is at zero before anyone has said anything
 * out loud. How long a team should get is a fact about the people playing,
 * not about the game, so the host picks. Off is a real choice too: the clock
 * was added to stop a huddle running for two minutes, and some rooms would
 * rather it did.
 */
export const FEUD_CLOCK_CHOICES = [0, 20, 30, 45, 60] as const;
export const FEUD_CLOCK_DEFAULT = 30;

export const currentQuestion = (state: FeudState): FeudQuestion | undefined =>
  state.questions[state.round];

export const otherTeam = (state: FeudState) =>
  (state.control + 1) % Math.max(state.teams.length, 1);

/**
 * Who picks up the board after a strikeout. Goes round the table in order and
 * skips anyone already out; undefined once nobody is left to try.
 */
export const nextInLine = (state: FeudState): number | undefined => {
  const count = state.teams.length;
  for (let step = 1; step <= count; step++) {
    const team = (state.control + step) % count;
    if (!state.struckOut.includes(team)) return team;
  }
  return undefined;
};

export const allRevealed = (state: FeudState): boolean => {
  const q = currentQuestion(state);
  return Boolean(q) && state.revealed.length >= (q?.answers.length ?? 0);
};
