import {
  type RapidMode,
  type RapidState,
  type RapidTeam,
  RAPID_SECONDS,
} from "@/lib/rapid/types";

const UNDO_DEPTH = 25;

export const emptyRapid = (mode: RapidMode): RapidState => ({
  mode,
  phase: "setup",
  theme: "",
  teams: [],
  prompts: [],
  round: 0,
  turn: 0,
  seconds: RAPID_SECONDS[mode],
  lastAward: 0,
  past: [],
});

export type RapidAction =
  | { type: "START"; teamNames: string[]; theme: string; prompts: string[] }
  | { type: "GO" }
  | { type: "TIME_UP" }
  | { type: "SCORE"; points: number }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: RapidState };

const snapshot = (s: RapidState): RapidState[] =>
  [{ ...s, past: [] }, ...s.past].slice(0, UNDO_DEPTH);

const makeTeam = (name: string, i: number): RapidTeam => ({
  id: `r${i}`,
  name: name.trim() || `Team ${i + 1}`,
  score: 0,
});

export function rapidReducer(state: RapidState, action: RapidAction): RapidState {
  switch (action.type) {
    case "START":
      return {
        ...emptyRapid(state.mode),
        phase: "ready",
        theme: action.theme,
        teams: action.teamNames.map(makeTeam),
        prompts: action.prompts,
      };

    case "GO":
      return state.phase === "ready"
        ? { ...state, phase: "running", lastAward: 0 }
        : state;

    case "TIME_UP":
      return state.phase === "running" ? { ...state, phase: "judge" } : state;

    /** Host banks the turn: a count for Categories, 1 or 0 for Three in Five. */
    case "SCORE": {
      if (state.phase !== "judge") return state;
      const points = Math.max(0, Math.round(action.points));
      const teams = state.teams.map((t, i) =>
        i === state.turn ? { ...t, score: t.score + points } : t,
      );

      const nextTurn = (state.turn + 1) % state.teams.length;
      // A round is done once it's been all the way around the teams.
      const wrapped = nextTurn === 0;
      const round = wrapped ? state.round + 1 : state.round;
      const finished = round >= state.prompts.length;

      return {
        ...state,
        past: snapshot(state),
        teams,
        turn: nextTurn,
        round,
        lastAward: points,
        phase: finished ? "winner" : "ready",
      };
    }

    case "UNDO": {
      const [prev, ...rest] = state.past;
      return prev ? { ...prev, past: rest } : state;
    }

    case "RESET":
      return emptyRapid(state.mode);

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

export const rapidStandings = (teams: RapidTeam[]) =>
  [...teams].sort((a, b) => b.score - a.score);

export const rapidWinners = (teams: RapidTeam[]) => {
  if (!teams.length) return [];
  const top = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === top);
};
