import type { Board, FinalClue, TileRef } from "@/lib/board/types";

export type Team = {
  id: string;
  name: string;
  score: number;
};

export type Rules = {
  /** Wrong answer lets another team steal the clue. */
  steal: boolean;
  /** Wrong answers subtract the clue value instead of costing nothing. */
  deduct: boolean;
  /** Per-clue countdown. */
  timer: boolean;
  timerSeconds: number;
  /** Hidden wager tiles. */
  dailyDoubles: boolean;
  /** Final Jeopardy round after the board is cleared. */
  finalRound: boolean;
  /** Who picks the next tile. */
  turnMode: "rotate" | "winner-picks";
};

export const defaultRules: Rules = {
  steal: true,
  deduct: true,
  timer: false,
  timerSeconds: 30,
  dailyDoubles: true,
  finalRound: false,
  turnMode: "rotate",
};

export type Phase =
  | "setup"
  | "board"
  | "wager"
  | "clue"
  | "final-wager"
  | "final-clue"
  | "final-judge"
  | "winner";

export type FinalState = {
  clue: FinalClue;
  /** teamId -> wager */
  wagers: Record<string, number>;
  /** teamId -> correct | null (unjudged) */
  results: Record<string, boolean | null>;
};

export type GameState = {
  phase: Phase;
  theme: string;
  teams: Team[];
  rules: Rules;
  board: Board;
  /** tileKey[] of clues already played */
  spent: string[];
  /** tileKey[] holding a daily double */
  dailyDoubles: string[];
  active: TileRef | null;
  activeIsDaily: boolean;
  /** Wager locked in for the active daily double. */
  wager: number | null;
  /** Index into teams — whose pick it is. */
  turn: number;
  /**
   * Teams that already answered the active clue wrong, by index.
   * They can't steal it.
   */
  lockedOut: number[];
  final: FinalState | null;
  /** Undo stack. Stripped before persisting. */
  past: GameState[];
};
