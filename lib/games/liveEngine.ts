import { matchAnswer } from "@/lib/feud/match";
import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";

/**
 * Games where everybody answers the same thing at the same time, and the
 * scoring is a calculation rather than a vote. Last One Standing, Timeline and
 * Dial It In are all this machine — what changes is the shape of the answer a
 * phone sends and the sum that turns it into points.
 *
 * The vote-based games live in roundEngine; the race-to-buzz ones in
 * buzzEngine. This is the third shape and the last one needed.
 */

export type LiveItem = {
  /** What the TV shows. */
  prompt: string;
  /** Last One Standing: the answer being looked for. */
  answer?: string;
  /** Timeline: the events, already in their true order. */
  events?: string[];
  /** Dial It In: the two ends of the spectrum. */
  left?: string;
  right?: string;
  /** Dial It In: where on the 0-100 line the truth sits. */
  target?: number;
};

export type LiveVariant = "standing" | "timeline" | "dial";

export type LiveState = {
  kind: "live";
  variant: LiveVariant;
  /**
   * brief   — Dial It In only: the clue-giver is looking at the target.
   * collect — phones are answering.
   * reveal  — the answer is up and points are on the board.
   * done    — out of items, or one survivor left.
   */
  phase: "brief" | "collect" | "reveal" | "done";
  items: LiveItem[];
  round: number;
  /**
   * playerId -> their answer, as a string. Timeline sends a comma-separated
   * list of indices; Dial It In sends a number. Keeping one shape means the
   * room never has to know which game is running.
   */
  answers: Record<string, string>;
  /** The order the events were shown in, so TV and phones agree. */
  shuffled: number[];
  /** Out of the game for good — Last One Standing only. */
  benched: string[];
  /** Dial It In: who's giving the clue this round. */
  lead: string | null;
  clue: string;
  lastScores: Record<string, number>;
  /** Who got it right last round, for the reveal screen. */
  correct: string[];
};

const st = (room: Room) => room.game as LiveState;

export const liveCurrent = (s: LiveState): LiveItem | undefined =>
  s.items[s.round];

/** Everyone still in the game — benched players stop being asked. */
export const liveActive = (room: Room, s: LiveState) =>
  connectedPlayers(room).filter((p) => !s.benched.includes(p.id));

/** The events in the order the room is looking at them. */
export const liveShuffledEvents = (s: LiveState): string[] => {
  const item = liveCurrent(s);
  if (!item?.events) return [];
  return s.shuffled.map((i) => item.events![i]);
};

const shuffleIndices = (n: number): number[] => {
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/* ------------------------------------------------------------- scoring */

/** Did they say the thing? Reuses Face-Off's matcher so near misses count. */
export const standingCorrect = (guess: string, answer: string): boolean =>
  Boolean(matchAnswer(guess, [{ text: answer, points: 1 }], [], "lenient"));

/** Timeline: a point per event in the right slot, double for a perfect run. */
export function timelineScore(submitted: number[], count: number): number {
  if (submitted.length !== count) return 0;
  const right = submitted.filter((eventIndex, slot) => eventIndex === slot).length;
  return right === count ? count * 200 : right * 100;
}

/** Dial It In: closer is better, and only the near misses score at all. */
export function dialScore(guess: number, target: number): number {
  const off = Math.abs(guess - target);
  if (off <= 4) return 1000;
  if (off <= 10) return 600;
  if (off <= 20) return 300;
  return 0;
}

/* -------------------------------------------------------------- module */

export type LiveSpec = {
  id: string;
  name: string;
  blurb: string;
  minPlayers: number;
  variant: LiveVariant;
  /** How many items to play. Trimmed to the size of the pack. */
  rounds: number;
};

export function createLiveGame(spec: LiveSpec, pack: LiveItem[]): GameModule {
  /** Set up a round: pick who leads, shuffle what needs shuffling. */
  const beginRound = (room: Room, s: LiveState): Room => {
    const item = s.items[s.round];
    const players = liveActive(room, s);
    const next: LiveState = {
      ...s,
      phase: spec.variant === "dial" ? "brief" : "collect",
      answers: {},
      clue: "",
      lastScores: {},
      correct: [],
      shuffled: item?.events ? shuffleIndices(item.events.length) : [],
      // The clue passes round the room so nobody leads twice in a row.
      lead: players.length
        ? players[s.round % players.length].id
        : null,
    };
    return { ...room, game: next };
  };

  /** Everyone who should have answered has. */
  const allIn = (room: Room, s: LiveState): boolean => {
    const expected = liveActive(room, s).filter(
      (p) => spec.variant !== "dial" || p.id !== s.lead,
    );
    return (
      expected.length > 0 && expected.every((p) => s.answers[p.id] !== undefined)
    );
  };

  /** Work out the points, bench anyone who's out, and show the answer. */
  const closeRound = (room: Room): Room => {
    const s = st(room);
    const item = liveCurrent(s);
    if (!item) return room;

    const points: Record<string, number> = {};
    const correct: string[] = [];
    let benched = s.benched;

    if (spec.variant === "standing") {
      liveActive(room, s).forEach((p) => {
        const said = s.answers[p.id] ?? "";
        if (said && standingCorrect(said, item.answer ?? "")) {
          points[p.id] = 500;
          correct.push(p.id);
        } else {
          benched = [...benched, p.id];
        }
      });
      // Everybody out on the same question — nobody deserves to lose there.
      if (correct.length === 0) benched = s.benched;
    }

    if (spec.variant === "timeline") {
      const count = item.events?.length ?? 0;
      liveActive(room, s).forEach((p) => {
        const submitted = (s.answers[p.id] ?? "")
          .split(",")
          .filter(Boolean)
          .map(Number);
        const score = timelineScore(submitted, count);
        if (score) points[p.id] = score;
        if (score === count * 200) correct.push(p.id);
      });
    }

    if (spec.variant === "dial") {
      const target = item.target ?? 50;
      let total = 0;
      let guesses = 0;
      liveActive(room, s).forEach((p) => {
        if (p.id === s.lead) return;
        const guess = Number(s.answers[p.id]);
        if (!Number.isFinite(guess)) return;
        const score = dialScore(guess, target);
        if (score) {
          points[p.id] = score;
          correct.push(p.id);
        }
        total += score;
        guesses++;
      });
      // The clue-giver lives or dies by how well the room read them.
      if (s.lead && guesses) points[s.lead] = Math.round(total / guesses);
    }

    const scored = award(room, points);
    return {
      ...scored,
      game: { ...st(scored), phase: "reveal", lastScores: points, benched, correct },
    };
  };

  return {
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    minPlayers: spec.minPlayers,
    needsPhones: true,

    init(room) {
      const supplied = (room as unknown as { pendingItems?: LiveItem[] })
        .pendingItems;
      const chosen = (supplied?.length ? supplied : pack).slice(0, spec.rounds);
      // The dial's hidden point has to move every game, so it's rolled at
      // kickoff rather than written into the pack. Kept off the extremes —
      // a target of 2 is a coin flip, not a clue.
      const items =
        spec.variant === "dial"
          ? chosen.map((item) => ({
              ...item,
              target: 10 + Math.floor(Math.random() * 81),
            }))
          : chosen;
      const fresh: LiveState = {
        kind: "live",
        variant: spec.variant,
        phase: "collect",
        items,
        round: 0,
        answers: {},
        shuffled: [],
        benched: [],
        lead: null,
        clue: "",
        lastScores: {},
        correct: [],
      };
      return beginRound({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;

      switch (action.type) {
        /** Dial It In: the clue-giver has written their word. */
        case "clue": {
          if (s.phase !== "brief" || action.playerId !== s.lead) return room;
          const clue = String(action.payload?.text ?? "").trim().slice(0, 60);
          if (!clue) return room;
          return { ...room, game: { ...s, phase: "collect", clue } };
        }

        case "submit": {
          if (s.phase !== "collect" || !action.playerId) return room;
          if (s.benched.includes(action.playerId)) return room;
          if (spec.variant === "dial" && action.playerId === s.lead) return room;

          const value = String(action.payload?.text ?? "").trim().slice(0, 120);
          if (!value) return room;

          const answers = { ...s.answers, [action.playerId]: value };
          const filled: Room = { ...room, game: { ...s, answers } };
          return allIn(filled, st(filled)) ? closeRound(filled) : filled;
        }

        /** Host stops waiting on somebody who wandered off. */
        case "force": {
          if (s.phase === "brief") {
            return { ...room, game: { ...s, phase: "collect", clue: s.clue || "—" } };
          }
          return s.phase === "collect" ? closeRound(room) : room;
        }

        case "next": {
          if (s.phase !== "reveal") return room;
          const survivors = liveActive(room, s);
          const round = s.round + 1;
          const outOfItems = round >= s.items.length;
          // Last One Standing ends the moment there's only one left.
          const settled = spec.variant === "standing" && survivors.length <= 1;
          if (outOfItems || settled) {
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
