import {
  type FeudQuestion,
  type FeudState,
  type FeudTeam,
  FEUD_CLOCK_DEFAULT,
  STRIKES_ALLOWED,
  allRevealed,
  currentQuestion,
  nextInLine,
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
  struckOut: [],
  handoverAt: null,
  clock: null,
  clockSeconds: FEUD_CLOCK_DEFAULT,
  lastGuess: null,
  past: [],
});

export type FeudAction =
  | {
      type: "START";
      teamNames: string[];
      theme: string;
      questions: FeudQuestion[];
      /** Seconds per answer; 0 for no clock. Defaults when absent. */
      clockSeconds?: number;
    }
  | { type: "SET_CONTROL"; team: number }
  | { type: "GUESS"; text: string; matched: number | null; repeat?: boolean }
  | { type: "REVEAL"; index: number }
  | { type: "STRIKE" }
  | { type: "CLOCK"; run: boolean }
  | { type: "NEXT_ROUND" }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: FeudState };

/**
 * A fresh clock, or none.
 *
 * Zero and absent mean opposite things and both turn up. Zero is the host
 * choosing to play without a clock, so it must produce nothing. Absent is a
 * game saved to this browser before think time was a setting — those are
 * mid-night in somebody's living room right now, and reading a missing field
 * as zero would silently take their clock away with no way to get it back.
 */
const startClock = (s: FeudState): FeudState["clock"] => {
  const seconds = s.clockSeconds ?? FEUD_CLOCK_DEFAULT;
  return seconds > 0 ? { startedAt: Date.now(), seconds } : null;
};

const snapshot = (s: FeudState): FeudState[] =>
  [{ ...s, past: [] }, ...s.past].slice(0, UNDO_DEPTH);

const makeTeam = (name: string, i: number): FeudTeam => ({
  id: `f${i}`,
  name: name.trim() || `Team ${i + 1}`,
  score: 0,
});

/**
 * Close the round with every answer face-up. Nothing is awarded here — teams
 * are paid the moment they open an answer — so the board can be read for as
 * long as the room wants before moving on, including the ones nobody got.
 */
function endRound(
  state: FeudState,
  outcome: NonNullable<FeudState["outcome"]>,
): FeudState {
  const question = currentQuestion(state);
  const everything = question
    ? question.answers.map((_, i) => i)
    : state.revealed;
  return { ...state, phase: "round-end", outcome, revealed: everything, clock: null };
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
        clockSeconds: action.clockSeconds ?? FEUD_CLOCK_DEFAULT,
      };

    case "SET_CONTROL": {
      if (state.phase !== "face-off") return state;
      return {
        ...state,
        control: action.team,
        phase: "play",
        clock: startClock(state),
      };
    }

    /**
     * Stop the clock. Somebody always needs the toilet, and the alternative is
     * the host watching the room argue with a number counting down at them.
     */
    case "CLOCK":
      if (state.phase !== "play") return state;
      return {
        ...state,
        clock: action.run ? startClock(state) : null,
      };

    /**
     * The host types what the team shouted. A near miss still counts — the
     * matcher decides — and anything it can't place is a strike.
     */
    /**
     * The verdict arrives already decided — working out whether "chips" means
     * "snacks" can need a model, and a reducer has to stay pure and instant.
     * See lib/feud/judge.ts for who does the deciding.
     */
    case "GUESS": {
      const text = action.text.trim();
      if (!text) return state;
      if (state.phase !== "play") return state;

      const q = currentQuestion(state);
      if (!q) return state;

      const hit =
        action.matched !== null &&
        action.matched >= 0 &&
        action.matched < q.answers.length &&
        !state.revealed.includes(action.matched)
          ? action.matched
          : null;

      const playing = {
        ...state,
        lastGuess: { text, matched: hit, repeat: action.repeat, at: Date.now() },
      };
      if (hit !== null) return feudReducer(playing, { type: "REVEAL", index: hit });
      // Saying one that's already up isn't wrong, it's just late.
      return action.repeat ? playing : feudReducer(playing, { type: "STRIKE" });
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
        // Paid straight to the team that said it. A handover shouldn't move
        // points a team already earned across the table.
        teams: state.teams.map((t, i) =>
          i === state.control ? { ...t, score: t.score + answer.points } : t,
        ),
        pot: state.pot + answer.points,
        contributions: state.contributions.map((n, i) =>
          i === state.control ? n + 1 : n,
        ),
        handoverAt: null,
        // A right answer buys you the full think time for the next one.
        clock: state.clock ? { ...state.clock, startedAt: Date.now() } : null,
      };
      return allRevealed(next) ? endRound(next, "cleared") : next;
    }

    case "STRIKE": {
      if (state.phase !== "play") return state;
      const strikes = state.strikes + 1;
      const next: FeudState = {
        ...state,
        past: snapshot(state),
        strikes,
        handoverAt: null,
        // So does a wrong one — the pressure is on the answer, not the round.
        clock: state.clock ? { ...state.clock, startedAt: Date.now() } : null,
      };
      if (strikes < STRIKES_ALLOWED) return next;

      // A strikeout passes the board round the table. Whoever picks it up
      // carries on against the same answers with a clean set of strikes.
      const out = { ...next, struckOut: [...next.struckOut, next.control] };
      const heir = nextInLine(out);
      if (heir !== undefined) {
        return {
          ...out,
          control: heir,
          strikes: 0,
          handoverAt: Date.now(),
          clock: startClock(state),
        };
      }

      // Nobody left to try. Everyone keeps what they opened; show the rest.
      return endRound(out, "all-out");
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
        struckOut: [],
        handoverAt: null,
        clock: null,
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
