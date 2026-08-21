import { matchAnswer } from "@/lib/feud/match";
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
  contributions: [],
  strikeouts: 0,
  handoverAt: null,
  lastGuess: null,
  past: [],
});

export type FeudAction =
  | { type: "START"; teamNames: string[]; theme: string; questions: FeudQuestion[] }
  | { type: "SET_CONTROL"; team: number }
  | { type: "GUESS"; text: string }
  | { type: "REVEAL"; index: number }
  | { type: "STRIKE" }
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
        contributions: action.teamNames.map(() => 0),
      };

    case "SET_CONTROL": {
      if (state.phase !== "face-off") return state;
      return { ...state, control: action.team, phase: "play" };
    }

    /**
     * The host types what the team shouted. A near miss still counts — the
     * matcher decides — and anything it can't place is a strike.
     */
    case "GUESS": {
      const text = action.text.trim();
      if (!text) return state;
      if (state.phase !== "play") return state;

      const q = currentQuestion(state);
      if (!q) return state;

      const hit = matchAnswer(
        text,
        q.answers.map((a) => a.text),
        state.revealed,
      );
      const stamped = { text, matched: hit?.index ?? null, at: Date.now() };

      const playing = { ...state, lastGuess: stamped };
      return hit
        ? feudReducer(playing, { type: "REVEAL", index: hit.index })
        : feudReducer(playing, { type: "STRIKE" });
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
        contributions: state.contributions.map((n, i) =>
          i === state.control ? n + 1 : n,
        ),
        handoverAt: null,
      };
      // Board cleared — the team in control keeps everything.
      return allRevealed(next) ? bank(next, next.control, "cleared") : next;
    }

    case "STRIKE": {
      if (state.phase !== "play") return state;
      const strikes = state.strikes + 1;
      const next: FeudState = {
        ...state,
        past: snapshot(state),
        strikes,
        handoverAt: null,
      };
      if (strikes < STRIKES_ALLOWED) return next;

      // First strikeout hands the board to the other team, who carry on with
      // the pot already on it and a clean set of strikes.
      if (next.strikeouts === 0) {
        return {
          ...next,
          control: otherTeam(next),
          strikes: 0,
          strikeouts: 1,
          handoverAt: Date.now(),
        };
      }

      // Both teams out — whoever opened more of the board takes the pot.
      const best = next.contributions.reduce(
        (bestIndex, count, i) =>
          count > next.contributions[bestIndex] ? i : bestIndex,
        0,
      );
      return bank(next, best, "both-out");
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
        lastGuess: null,
        contributions: state.teams.map(() => 0),
        strikeouts: 0,
        handoverAt: null,
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
