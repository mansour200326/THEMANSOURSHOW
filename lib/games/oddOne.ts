import type { GameModule } from "@/lib/games/types";
import {
  type Action,
  type Room,
  award,
  connectedPlayers,
} from "@/lib/room/types";
import { startsAfterLeadIn } from "@/lib/games/leadIn";

/**
 * Bluff Trivia — everyone gets the same question, except one of you.
 *
 * The old version was invent-a-fake-answer-and-vote-for-the-truth, and it
 * had a problem: it rewarded whoever was best at sounding like an
 * encyclopaedia, and the room split into people who write good lies and
 * people who don't. This is the Impostor shape applied to a question. Every
 * phone gets "what's the best pizza topping?" and one phone, quietly, gets
 * "what's the worst pizza topping?". Everyone answers. Then the answers go
 * up with names on and the room works out whose answer is the one that
 * doesn't quite fit — while that person tries to look like it does.
 *
 * The decoy is written to be *adjacent* to the real question, not random.
 * "Worst topping" next to "best topping" produces an answer that's the
 * right kind of thing and slightly wrong, which is the whole game. A decoy
 * from a different subject produces an answer that's obviously wrong, which
 * is no game at all.
 *
 * The only thing that has to be secret is who has the decoy. The TV shows
 * no question at all while people are answering — the odd one out can see
 * the TV — and both questions at the reveal.
 */

export type QuestionPair = {
  /** What everyone else is asked. */
  question: string;
  /** What the one person is asked instead. Same shape, slightly off. */
  decoy: string;
};

export type OddState = {
  kind: "odd";
  phase: "answer" | "vote" | "reveal" | "done";
  round: number;
  pairs: QuestionPair[];
  /** Who has the decoy this round. Stripped from every snapshot but the reveal's. */
  oddId: string | null;
  /** playerId -> what they typed. */
  answers: Record<string, string>;
  /** playerId -> who they think it is. */
  votes: Record<string, string>;
  /** Frozen at the vote so TV and phones agree on the order. */
  order: string[];
  /** Whether the room got them. Set at reveal. */
  caught: boolean | null;
  lastScores: Record<string, number>;
  /** When answering opened, for the clock on the TV. */
  startedAt: number | null;
  seconds: number;
};

/** Long enough to type an opinion, not long enough to overthink one. */
export const ODD_ANSWER_SECONDS = 40;
export const ODD_MAX_ANSWER = 60;

/** Points for landing a vote on the right person, and for surviving the vote. */
const CATCH_POINTS = 500;
const ESCAPE_POINTS = 1000;

const state = (room: Room) => room.game as OddState;

/** Everyone still connected has acted. */
const allIn = (room: Room, record: Record<string, string>) => {
  const live = connectedPlayers(room);
  return live.length > 0 && live.every((p) => record[p.id] !== undefined);
};

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const oddPair = (s: OddState): QuestionPair | undefined => s.pairs[s.round];

export function createOddGame(pack: QuestionPair[]): GameModule {
  /** Deal the decoy to somebody who didn't have it last time, where possible. */
  const beginRound = (room: Room, s: OddState): Room => {
    const live = connectedPlayers(room).filter((p) => !p.bot);
    const candidates = live.filter((p) => p.id !== s.oddId);
    const pool = candidates.length ? candidates : live;
    const odd = pool[Math.floor(Math.random() * pool.length)]?.id ?? null;
    return {
      ...room,
      game: {
        ...s,
        phase: "answer",
        oddId: odd,
        answers: {},
        votes: {},
        order: [],
        caught: null,
        lastScores: {},
        startedAt: startsAfterLeadIn(),
        seconds: ODD_ANSWER_SECONDS,
      },
    };
  };

  /** Answers are in: put them up, and open the vote. */
  const openVote = (room: Room, s: OddState): Room => ({
    ...room,
    game: {
      ...s,
      phase: "vote",
      // Shuffled once and frozen, so the odd one isn't always last because
      // they took longest to think of something.
      order: shuffle(Object.keys(s.answers)),
      startedAt: null,
    },
  });

  /** Votes are in: who got it, and what it cost. */
  const reveal = (room: Room, s: OddState): Room => {
    const tally: Record<string, number> = {};
    Object.values(s.votes).forEach((target) => {
      tally[target] = (tally[target] ?? 0) + 1;
    });
    const top = Math.max(0, ...Object.values(tally));
    const leaders = Object.keys(tally).filter((id) => tally[id] === top);
    // Caught means the room agreed on them — a split vote is an escape.
    const caught = top > 0 && leaders.length === 1 && leaders[0] === s.oddId;

    const points: Record<string, number> = {};
    if (caught) {
      Object.entries(s.votes).forEach(([voter, target]) => {
        if (target === s.oddId) points[voter] = CATCH_POINTS;
      });
    } else if (s.oddId) {
      points[s.oddId] = ESCAPE_POINTS;
    }

    const scored = award(room, points);
    return {
      ...scored,
      game: { ...state(scored), phase: "reveal", caught, lastScores: points },
    };
  };

  return {
    id: "bluff-trivia",
    name: "Bluff Trivia",
    minPlayers: 3,
    needsPhones: true,

    init(room) {
      const primed = room as unknown as {
        pendingPairs?: QuestionPair[];
        pendingRounds?: number;
      };
      const source = primed.pendingPairs?.length ? primed.pendingPairs : pack;
      const rounds = Math.max(1, Math.min(source.length, primed.pendingRounds ?? 6));
      const fresh: OddState = {
        kind: "odd",
        phase: "answer",
        round: 0,
        pairs: shuffle(source).slice(0, rounds),
        oddId: null,
        answers: {},
        votes: {},
        order: [],
        caught: null,
        lastScores: {},
        startedAt: null,
        seconds: ODD_ANSWER_SECONDS,
      };
      return beginRound({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = state(room);
      if (!s) return room;

      switch (action.type) {
        case "answer": {
          if (s.phase !== "answer" || !action.playerId) return room;
          const text = String(action.payload?.text ?? "").trim().slice(0, ODD_MAX_ANSWER);
          if (!text) return room;
          const answers = { ...s.answers, [action.playerId]: text };
          const filled = { ...s, answers };
          return allIn(room, answers)
            ? openVote(room, filled)
            : { ...room, game: filled };
        }

        case "vote": {
          if (s.phase !== "vote" || !action.playerId) return room;
          const target = String(action.payload?.playerId ?? "");
          // You can't vote for yourself, and you can only vote for somebody
          // who answered — a name that isn't on the board isn't a suspect.
          if (!target || target === action.playerId || s.answers[target] === undefined) {
            return room;
          }
          const votes = { ...s.votes, [action.playerId]: target };
          const voted = { ...room, game: { ...s, votes } };
          return allIn(room, votes) ? reveal(room, { ...s, votes }) : voted;
        }

        /** Host, or the clock, stops waiting on somebody. */
        case "force": {
          if (s.phase === "answer") {
            // Fewer than two answers is not a round anybody can vote on.
            return Object.keys(s.answers).length >= 2 ? openVote(room, s) : room;
          }
          if (s.phase === "vote") return reveal(room, s);
          return room;
        }

        case "next": {
          if (s.phase !== "reveal") return room;
          const round = s.round + 1;
          if (round >= s.pairs.length) {
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

/* ------------------------------------------------------------ bundled pack */

/**
 * Every decoy is the same question with one thing turned. That's the craft:
 * the odd answer has to be the right *kind* of thing.
 */
export const ODD_ONE_PACK: QuestionPair[] = [
  { question: "What's the best pizza topping?", decoy: "What's the worst pizza topping?" },
  { question: "Name a country you'd love to visit.", decoy: "Name a country you'd never visit." },
  { question: "What's a great film to watch on a plane?", decoy: "What's a film that's far too long?" },
  { question: "Name something you'd take to a desert island.", decoy: "Name something you'd leave behind in a fire." },
  { question: "What's the best thing about summer?", decoy: "What's the worst thing about summer?" },
  { question: "Name a job you'd be good at.", decoy: "Name a job you'd be terrible at." },
  { question: "What's a food you could eat every day?", decoy: "What's a food you ate too much of once?" },
  { question: "Name an animal that would make a good pet.", decoy: "Name an animal that would make a terrible pet." },
  { question: "What's a song everyone knows the words to?", decoy: "What's a song you're sick of hearing?" },
  { question: "Name something you'd find in a kitchen.", decoy: "Name something you'd find in a garage." },
  { question: "What's the best age to be?", decoy: "What's the hardest age to be?" },
  { question: "Name a sport you'd watch for hours.", decoy: "Name a sport you find boring." },
  { question: "What's a good name for a dog?", decoy: "What's a good name for a boat?" },
  { question: "Name a city famous for its food.", decoy: "Name a city famous for its weather." },
  { question: "What's the best thing to order at a café?", decoy: "What's the best thing to order at a bar?" },
  { question: "Name a skill everyone should learn.", decoy: "Name a skill nobody really needs." },
  { question: "What's a perfect Sunday activity?", decoy: "What's a perfect Friday night activity?" },
  { question: "Name something people always forget to pack.", decoy: "Name something people always overpack." },
  { question: "What's a great gift for a friend?", decoy: "What's a great gift for a colleague?" },
  { question: "Name a superhero you'd want on your side.", decoy: "Name a villain you'd want on your side." },
];

export const oddOneOut = createOddGame(ODD_ONE_PACK);
