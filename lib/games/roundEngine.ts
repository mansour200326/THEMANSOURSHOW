import type { GameModule } from "@/lib/games/types";
import {
  type Action,
  type Room,
  award,
  connectedPlayers,
} from "@/lib/room/types";

/**
 * The shape shared by every prompt → answer → vote → reveal game. Most Likely
 * To, Guess Who Said It, Bluff Trivia and Herd Mentality are all this machine
 * with different content and a different scoring rule.
 */

export type Prompt = {
  text: string;
  /** Bluff Trivia's real answer; unused elsewhere. */
  answer?: string;
};

export type VoteOption = {
  id: string;
  label: string;
  /** Who wrote it — only shown at reveal. */
  authorId?: string;
};

export type RoundState = {
  kind: "round";
  phase: "collect" | "vote" | "reveal" | "done";
  round: number;
  prompts: Prompt[];
  /** playerId -> what they wrote this round. */
  submissions: Record<string, string>;
  /** playerId -> option id they voted for. */
  votes: Record<string, string>;
  /** Frozen at reveal so the TV and phones agree on what's on screen. */
  options: VoteOption[];
  /** The one submission this round is asking about, for games that need it. */
  focus?: string;
  lastScores: Record<string, number>;
};

export type RoundSpec = {
  id: string;
  name: string;
  blurb: string;
  minPlayers: number;
  /** null = skip straight to voting (Most Likely To votes on people). */
  collect: { prompt: string; maxLength: number } | null;
  /** Rounds to play. Trimmed to the size of the content pack. */
  rounds: number;
  /** Options to vote on, built once everyone has submitted. */
  buildOptions: (room: Room, state: RoundState) => VoteOption[];
  /** Picks the submission this round is about (Guess Who Said It). */
  pickFocus?: (room: Room, state: RoundState) => string | undefined;
  /** Points to award when voting closes. */
  score: (room: Room, state: RoundState) => Record<string, number>;
  /** Can you vote for your own submission / yourself? */
  allowSelfVote: boolean;
  /** Voting is skipped entirely — score straight off the submissions. */
  skipVote?: boolean;
};

const state = (room: Room) => room.game as RoundState;

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Everyone still connected has acted. */
const allIn = (room: Room, record: Record<string, string>) => {
  const live = connectedPlayers(room);
  return live.length > 0 && live.every((p) => record[p.id] !== undefined);
};

export function createRoundGame(
  spec: RoundSpec,
  pack: Prompt[],
): GameModule {
  const startPhase = spec.collect ? "collect" : "vote";

  /** Freeze what everyone votes on, so TV and phones can't disagree. */
  const enterVote = (room: Room, s: RoundState): RoundState => {
    const focused: RoundState = {
      ...s,
      phase: "vote",
      focus: spec.pickFocus?.(room, s),
    };
    return { ...focused, options: spec.buildOptions(room, focused) };
  };

  const beginRound = (room: Room, s: RoundState): Room => {
    const next: RoundState = {
      ...s,
      phase: startPhase,
      submissions: {},
      votes: {},
      options: [],
      focus: undefined,
      lastScores: {},
    };
    // No collect step means the options are the players themselves.
    return {
      ...room,
      game: startPhase === "vote" ? enterVote(room, next) : next,
    };
  };

  const closeVoting = (room: Room): Room => {
    const s = state(room);
    const points = spec.score(room, s);
    const scored = award(room, points);
    return {
      ...scored,
      game: { ...state(scored), phase: "reveal", lastScores: points },
    };
  };

  return {
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    minPlayers: spec.minPlayers,
    needsPhones: true,

    init(room) {
      const prompts = shuffle(pack).slice(0, spec.rounds);
      const fresh: RoundState = {
        kind: "round",
        phase: startPhase,
        round: 0,
        prompts,
        submissions: {},
        votes: {},
        options: [],
        lastScores: {},
      };
      return beginRound({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = state(room);
      if (!s) return room;

      switch (action.type) {
        case "submit": {
          if (s.phase !== "collect" || !action.playerId) return room;
          const text = String(action.payload?.text ?? "")
            .trim()
            .slice(0, spec.collect?.maxLength ?? 80);
          if (!text) return room;

          const submissions = { ...s.submissions, [action.playerId]: text };
          const filled: RoundState = { ...s, submissions };

          if (!allIn(room, submissions)) {
            return { ...room, game: filled };
          }
          if (spec.skipVote) {
            return closeVoting({ ...room, game: { ...filled, phase: "vote" } });
          }
          return { ...room, game: enterVote(room, filled) };
        }

        case "vote": {
          if (s.phase !== "vote" || !action.playerId) return room;
          const optionId = String(action.payload?.optionId ?? "");
          const option = s.options.find((o) => o.id === optionId);
          if (!option) return room;
          if (!spec.allowSelfVote && option.authorId === action.playerId) {
            return room;
          }

          const votes = { ...s.votes, [action.playerId]: optionId };
          const voted: Room = { ...room, game: { ...s, votes } };
          return allIn(room, votes) ? closeVoting(voted) : voted;
        }

        /** Host override — stop waiting on someone who wandered off. */
        case "force": {
          if (s.phase === "collect") {
            if (spec.skipVote) {
              return closeVoting({ ...room, game: { ...s, phase: "vote" } });
            }
            return { ...room, game: enterVote(room, s) };
          }
          if (s.phase === "vote") return closeVoting(room);
          return room;
        }

        case "next": {
          if (s.phase !== "reveal") return room;
          const round = s.round + 1;
          if (round >= s.prompts.length) {
            return { ...room, game: { ...s, phase: "done" } };
          }
          return beginRound(room, { ...s, round });
        }

        default:
          return room;
      }
    },
  };
}

/* ------------------------------------------------------------ scoring bits */

/** How many votes each option received. */
export function tally(votes: Record<string, string>): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(votes).forEach((id) => {
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}

export { shuffle };
