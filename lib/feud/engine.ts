import {
  type FeudQuestion,
  type FeudState,
  type FeudTeam,
  STRIKES_ALLOWED,
  allRevealed,
  currentQuestion,
  otherTeam,
} from "@/lib/feud/types";

const UNDO_DEPTH = 25;

export const emptyFeud = (): FeudState => ({
  phase: "setup",
  theme: "",
  teams: [],
  questions: [],
  round: 0,
  control: 0,
  strikes: 0,
  pot: 0,
  revealed: [],
  outcome: null,
  past: [],
});

export type FeudAction =
  | { type: "START"; teamNames: string[]; theme: string; questions: FeudQuestion[] }
  | { type: "SET_CONTROL"; team: number }
  | { type: "REVEAL"; index: number }
  | { type: "STRIKE" }
  | { type: "STEAL_HIT"; index: number }
  | { type: "STEAL_MISS" }
  | { type: "NEXT_ROUND" }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: FeudState };

const snapshot = (s: FeudState): FeudState[] =>
  [{ ...s, past: [] }, ...s.past].slice(0, UNDO_DEPTH);

const makeTeam = (name: string, i: number): FeudTeam => ({
  id: `f${i}`,
  name: name.trim() || `Team ${i + 1}`,
  score: 0,
});

/** Hand the pot to a team and park on the round-end card. */
function bank(
  state: FeudState,
  teamIndex: number,
  outcome: NonNullable<FeudState["outcome"]>,
): FeudState {
  const teams = state.teams.map((t, i) =>
    i === teamIndex ? { ...t, score: t.score + state.pot } : t,
  );
  return { ...state, teams, phase: "round-end", outcome };
}

export function feudReducer(state: FeudState, action: FeudAction): FeudState {
  switch (action.type) {
    case "START":
      return {
        ...emptyFeud(),
        phase: "face-off",
        theme: action.theme,
        teams: action.teamNames.map(makeTeam),
        questions: action.questions,
      };

    case "SET_CONTROL": {
      if (state.phase !== "face-off") return state;
      return { ...state, control: action.team, phase: "play" };
    }

    case "REVEAL": {
      if (state.phase !== "play") return state;
      const q = currentQuestion(state);
      const answer = q?.answers[action.index];
      if (!answer || state.revealed.includes(action.index)) return state;

      const next: FeudState = {
        ...state,
        past: snapshot(state),
        revealed: [...state.revealed, action.index],
        pot: state.pot + answer.points,
      };
      // Board cleared — the team in control keeps everything.
      return allRevealed(next) ? bank(next, next.control, "cleared") : next;
    }

    case "STRIKE": {
      if (state.phase !== "play") return state;
      const strikes = state.strikes + 1;
      const next: FeudState = { ...state, past: snapshot(state), strikes };
      // Three strikes hands the other team one shot at the whole pot.
      return strikes >= STRIKES_ALLOWED ? { ...next, phase: "steal" } : next;
    }

    case "STEAL_HIT": {
      if (state.phase !== "steal") return state;
      const q = currentQuestion(state);
      const answer = q?.answers[action.index];
      if (!answer || state.revealed.includes(action.index)) return state;

      const withAnswer: FeudState = {
        ...state,
        past: snapshot(state),
        revealed: [...state.revealed, action.index],
        pot: state.pot + answer.points,
      };
      return bank(withAnswer, otherTeam(state), "stolen");
    }

    case "STEAL_MISS": {
      if (state.phase !== "steal") return state;
      return bank({ ...state, past: snapshot(state) }, state.control, "held");
    }

    case "NEXT_ROUND": {
      if (state.phase !== "round-end") return state;
      const round = state.round + 1;
      if (round >= state.questions.length) {
        return { ...state, phase: "winner" };
      }
      return {
        ...state,
        past: snapshot(state),
        phase: "face-off",
        round,
        strikes: 0,
        pot: 0,
        revealed: [],
        outcome: null,
        // Loser of the last round starts the next one.
        control: otherTeam(state),
      };
    }

    case "UNDO": {
      const [prev, ...rest] = state.past;
      return prev ? { ...prev, past: rest } : state;
    }

    case "RESET":
      return emptyFeud();

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

export const feudStandings = (teams: FeudTeam[]) =>
  [...teams].sort((a, b) => b.score - a.score);

export const feudWinners = (teams: FeudTeam[]) => {
  if (!teams.length) return [];
  const top = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === top);
};
