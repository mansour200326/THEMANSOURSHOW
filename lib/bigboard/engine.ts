import {
  type Board,
  type TileRef,
  clueAt,
  maxClueValue,
  tileKey,
  totalTiles,
} from "@/lib/board/types";
import {
  type GameState,
  type Rules,
  type Team,
  defaultRules,
} from "@/lib/bigboard/types";
import type { FinalClue } from "@/lib/board/types";

const UNDO_DEPTH = 25;

export const emptyState = (board: Board): GameState => ({
  phase: "setup",
  theme: "",
  teams: [],
  rules: defaultRules,
  board,
  spent: [],
  dailyDoubles: [],
  active: null,
  activeIsDaily: false,
  wager: null,
  turn: 0,
  lockedOut: [],
  final: null,
  past: [],
});

export type Action =
  | {
      type: "START";
      teamNames: string[];
      theme: string;
      rules: Rules;
      board: Board;
      finalClue?: FinalClue | null;
    }
  | { type: "PICK"; ref: TileRef }
  | { type: "SET_WAGER"; amount: number }
  | { type: "JUDGE"; teamIndex: number; correct: boolean }
  | { type: "SKIP" }
  | { type: "SET_FINAL_WAGER"; teamId: string; amount: number }
  | { type: "LOCK_FINAL_WAGERS" }
  | { type: "SHOW_FINAL_JUDGING" }
  | { type: "JUDGE_FINAL"; teamId: string; correct: boolean }
  | { type: "FINISH_FINAL" }
  | { type: "ADJUST"; teamId: string; delta: number }
  | { type: "UNDO" }
  | { type: "REMATCH" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: GameState };

/* ---------------------------------------------------------------- helpers */

const makeTeam = (name: string, i: number): Team => ({
  id: `t${i}`,
  name: name.trim() || `Team ${i + 1}`,
  score: 0,
});

/** Two random tiles, never in the cheapest row — same as the TV show. */
function pickDailyDoubles(board: Board, count = 2): string[] {
  const candidates: string[] = [];
  board.categories.forEach((cat, c) => {
    cat.clues.forEach((_, r) => {
      if (r > 0) candidates.push(tileKey(c, r));
    });
  });
  const chosen: string[] = [];
  while (chosen.length < Math.min(count, candidates.length)) {
    const key = candidates[Math.floor(Math.random() * candidates.length)];
    if (!chosen.includes(key)) chosen.push(key);
  }
  return chosen;
}

const snapshot = (state: GameState): GameState[] =>
  [{ ...state, past: [] }, ...state.past].slice(0, UNDO_DEPTH);

export const isBoardCleared = (state: GameState): boolean =>
  state.spent.length >= totalTiles(state.board);

export const activeValue = (state: GameState): number => {
  if (state.activeIsDaily && state.wager != null) return state.wager;
  if (!state.active) return 0;
  return clueAt(state.board, state.active)?.value ?? 0;
};

export const maxDailyWager = (state: GameState, teamIndex: number): number =>
  Math.max(state.teams[teamIndex]?.score ?? 0, maxClueValue(state.board));

/** Generous floor so a team on zero still has a Final Round to play. */
export const maxFinalWager = (team: Team): number => Math.max(team.score, 500);

/** Board exhausted: either roll into Final Round or crown a winner. */
function afterBoard(state: GameState): GameState {
  if (!isBoardCleared(state)) return state;
  if (state.rules.finalRound && state.final) {
    return { ...state, phase: "final-wager", active: null };
  }
  return { ...state, phase: "winner", active: null };
}

function closeClue(state: GameState): GameState {
  const key = state.active ? tileKey(state.active.c, state.active.r) : null;
  const next: GameState = {
    ...state,
    phase: "board",
    spent: key && !state.spent.includes(key) ? [...state.spent, key] : state.spent,
    active: null,
    activeIsDaily: false,
    wager: null,
    lockedOut: [],
  };
  return afterBoard(next);
}

const advanceTurn = (state: GameState): number =>
  state.teams.length ? (state.turn + 1) % state.teams.length : 0;

/* ---------------------------------------------------------------- reducer */

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START": {
      const teams = action.teamNames.map(makeTeam);
      return {
        ...emptyState(action.board),
        phase: "board",
        theme: action.theme,
        teams,
        rules: action.rules,
        board: action.board,
        dailyDoubles: action.rules.dailyDoubles
          ? pickDailyDoubles(action.board)
          : [],
        final:
          action.rules.finalRound && action.finalClue
            ? { clue: action.finalClue, wagers: {}, results: {} }
            : null,
      };
    }

    case "PICK": {
      if (state.phase !== "board") return state;
      const key = tileKey(action.ref.c, action.ref.r);
      if (state.spent.includes(key)) return state;
      if (!clueAt(state.board, action.ref)) return state;

      const isDaily = state.dailyDoubles.includes(key);
      return {
        ...state,
        past: snapshot(state),
        phase: isDaily ? "wager" : "clue",
        active: action.ref,
        activeIsDaily: isDaily,
        wager: null,
        lockedOut: [],
      };
    }

    case "SET_WAGER": {
      if (state.phase !== "wager") return state;
      const cap = maxDailyWager(state, state.turn);
      const amount = Math.max(0, Math.min(Math.round(action.amount), cap));
      return { ...state, phase: "clue", wager: amount };
    }

    case "JUDGE": {
      if (state.phase !== "clue" || !state.active) return state;
      const value = activeValue(state);
      const withPast = { ...state, past: snapshot(state) };

      if (action.correct) {
        const teams = withPast.teams.map((t, i) =>
          i === action.teamIndex ? { ...t, score: t.score + value } : t,
        );
        const turn =
          withPast.rules.turnMode === "winner-picks"
            ? action.teamIndex
            : advanceTurn(withPast);
        return closeClue({ ...withPast, teams, turn });
      }

      // Wrong answer.
      const teams = withPast.teams.map((t, i) =>
        i === action.teamIndex && withPast.rules.deduct
          ? { ...t, score: t.score - value }
          : t,
      );
      const lockedOut = withPast.lockedOut.includes(action.teamIndex)
        ? withPast.lockedOut
        : [...withPast.lockedOut, action.teamIndex];

      const stealPossible =
        withPast.rules.steal &&
        !withPast.activeIsDaily &&
        lockedOut.length < withPast.teams.length;

      if (stealPossible) {
        return { ...withPast, teams, lockedOut };
      }
      return closeClue({ ...withPast, teams, lockedOut, turn: advanceTurn(withPast) });
    }

    case "SKIP": {
      if (state.phase !== "clue" && state.phase !== "wager") return state;
      const withPast = { ...state, past: snapshot(state) };
      return closeClue({ ...withPast, turn: advanceTurn(withPast) });
    }

    case "SET_FINAL_WAGER": {
      if (!state.final) return state;
      const team = state.teams.find((t) => t.id === action.teamId);
      if (!team) return state;
      const amount = Math.max(
        0,
        Math.min(Math.round(action.amount), maxFinalWager(team)),
      );
      return {
        ...state,
        final: {
          ...state.final,
          wagers: { ...state.final.wagers, [action.teamId]: amount },
        },
      };
    }

    case "LOCK_FINAL_WAGERS": {
      if (!state.final) return state;
      const wagers = { ...state.final.wagers };
      state.teams.forEach((t) => {
        if (wagers[t.id] == null) wagers[t.id] = 0;
      });
      return { ...state, phase: "final-clue", final: { ...state.final, wagers } };
    }

    case "SHOW_FINAL_JUDGING":
      return state.final ? { ...state, phase: "final-judge" } : state;

    case "JUDGE_FINAL": {
      if (!state.final) return state;
      const prev = state.final.results[action.teamId];
      if (prev === action.correct) return state;
      const wager = state.final.wagers[action.teamId] ?? 0;

      // Roll back a previous judgement before applying the new one.
      const teams = state.teams.map((t) => {
        if (t.id !== action.teamId) return t;
        let score = t.score;
        if (prev === true) score -= wager;
        if (prev === false) score += wager;
        score += action.correct ? wager : -wager;
        return { ...t, score };
      });

      return {
        ...state,
        past: snapshot(state),
        teams,
        final: {
          ...state.final,
          results: { ...state.final.results, [action.teamId]: action.correct },
        },
      };
    }

    case "FINISH_FINAL":
      return { ...state, phase: "winner" };

    /**
     * The host correcting the score by hand — a cheat, a bad call, a round
     * counted twice. Undo only reaches the last thing that happened.
     */
    case "ADJUST": {
      const delta = Math.round(action.delta);
      if (!Number.isFinite(delta) || delta === 0) return state;
      return {
        ...state,
        past: snapshot(state),
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, score: t.score + delta } : t,
        ),
      };
    }

    case "UNDO": {
      const [prev, ...rest] = state.past;
      if (!prev) return state;
      return { ...prev, past: rest };
    }

    case "REMATCH":
      return {
        ...state,
        phase: "board",
        teams: state.teams.map((t) => ({ ...t, score: 0 })),
        spent: [],
        dailyDoubles: state.rules.dailyDoubles
          ? pickDailyDoubles(state.board)
          : [],
        active: null,
        activeIsDaily: false,
        wager: null,
        turn: 0,
        lockedOut: [],
        final: state.final
          ? { clue: state.final.clue, wagers: {}, results: {} }
          : null,
        past: [],
      };

    case "RESET":
      return emptyState(state.board);

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

/** Teams sorted for the podium — highest score first. */
export const standings = (teams: Team[]): Team[] =>
  [...teams].sort((a, b) => b.score - a.score);

export const winners = (teams: Team[]): Team[] => {
  if (!teams.length) return [];
  const top = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === top);
};
