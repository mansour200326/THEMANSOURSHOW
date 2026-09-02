import {
  RAPID_BIDS,
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
  bid: 0,
  lastCount: 0,
  lastMade: false,
  seconds: RAPID_SECONDS[mode],
  lastAward: 0,
  past: [],
});

export type RapidAction =
  | { type: "START"; teamNames: string[]; theme: string; prompts: string[] }
  /** Categories: the bidding is over — this team claimed this many. */
  | { type: "SET_BID"; team: number; count: number }
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
        // Categories starts with the room bidding, not with a clock.
        phase: RAPID_BIDS(state.mode) ? "bidding" : "ready",
        theme: action.theme,
        teams: action.teamNames.map(makeTeam),
        prompts: action.prompts,
      };

    case "SET_BID": {
      if (state.phase !== "bidding") return state;
      const team = Math.max(0, Math.min(state.teams.length - 1, action.team));
      const count = Math.max(1, Math.round(action.count));
      return { ...state, phase: "ready", turn: team, bid: count };
    }

    case "GO":
      return state.phase === "ready"
        ? { ...state, phase: "running", lastAward: 0 }
        : state;

    case "TIME_UP":
      return state.phase === "running" ? { ...state, phase: "judge" } : state;

    /** Host banks the turn: a count for Categories, 1 or 0 for Three in Five. */
    case "SCORE": {
      if (state.phase !== "judge") return state;
      const count = Math.max(0, Math.round(action.points));

      if (RAPID_BIDS(state.mode)) {
        /*
         * They either reach what they claimed or they don't, and the round is
         * worth one point either way.
         *
         * It used to pay out however many things they named, which quietly
         * made the bidding pointless: a team that bid four and named nine
         * scored nine, so the winning move was always to bid low and just
         * name a lot. Everything interesting about the auction — claiming
         * more than you're sure of to take the category off the other side —
         * only matters when the category itself is the prize.
         */
        const made = count >= state.bid;
        const other = (state.turn + 1) % state.teams.length;
        const winner = made ? state.turn : other;
        const points = 1;
        const teams = state.teams.map((t, i) =>
          i === winner ? { ...t, score: t.score + points } : t,
        );
        // One category, one team — so a category is a whole round.
        const round = state.round + 1;
        const finished = round >= state.prompts.length;
        return {
          ...state,
          past: snapshot(state),
          teams,
          round,
          bid: 0,
          lastAward: points,
          lastCount: count,
          lastMade: made,
          phase: finished ? "winner" : "bidding",
        };
      }

      const teams = state.teams.map((t, i) =>
        i === state.turn ? { ...t, score: t.score + count } : t,
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
        lastAward: count,
        lastCount: count,
        lastMade: true,
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
