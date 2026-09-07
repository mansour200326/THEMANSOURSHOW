import { matchAnswer } from "@/lib/feud/match";
import { roundsFor } from "@/lib/games/lengths";
import { shuffle } from "@/lib/games/roundEngine";
import { SKETCH_COLOURS, type Stroke } from "@/lib/games/sketch";
import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";

/**
 * One picture, drawn by everyone, one line each, twice round the room. The
 * category is on the TV; the word is on every phone but one. The one who
 * doesn't have it draws anyway and tries to look like they do. Then the room
 * votes on who was faking. Caught, the fake gets one guess at the word; right,
 * and they win after all.
 *
 * The strokes ride the same room-state path as Sketch & Guess, and each one
 * carries who drew it, because the whole game is looking at a line and
 * wondering whether the person who drew it knew what they were drawing.
 */

export type StrokePair = { category: string; word: string };
export type SignedStroke = Stroke & { by: string };

export type StrokeState = {
  kind: "stroke";
  phase: "draw" | "vote" | "guess" | "reveal" | "done";
  /** Stripped to categories on the wire; see lib/room/redact. */
  pairs: StrokePair[];
  round: number;
  fakeId: string | null;
  /** Drawing order this round. Bots don't draw. */
  order: string[];
  /** Which stroke of the picture we're on: order.length × passes in total. */
  turn: number;
  passes: number;
  strokes: SignedStroke[];
  live: Stroke;
  votes: Record<string, string>;
  guess: string | null;
  caught: boolean | null;
  fakeWon: boolean | null;
  lastScores: Record<string, number>;
};

export const STROKE_PASSES = 2;
const MAX_POINTS = 600;

const st = (room: Room) => room.game as StrokeState;

export const strokePair = (s: StrokeState): StrokePair | undefined => s.pairs[s.round];

export const strokeTotal = (s: StrokeState) => s.order.length * s.passes;

/** Whose line it is, or null once the picture is finished. */
export const strokeDrawer = (s: StrokeState): string | null =>
  s.phase === "draw" && s.order.length && s.turn < strokeTotal(s)
    ? s.order[s.turn % s.order.length]
    : null;

/** Each artist keeps one colour all round, so the TV can be read by colour. */
export const strokeColourFor = (s: StrokeState, playerId: string): number => {
  const i = s.order.indexOf(playerId);
  // Every colour but white — white on paper is nothing.
  return i < 0 ? 0 : i % (SKETCH_COLOURS.length - 1);
};

const people = (room: Room) => {
  const everyone = connectedPlayers(room);
  const humans = everyone.filter((p) => !p.bot);
  return humans.length ? humans : everyone;
};

export function createStrokeGame(pool: StrokePair[]): GameModule {
  const beginRound = (room: Room, s: StrokeState): Room => {
    const order = shuffle(people(room)).map((p) => p.id);
    if (order.length < 2) return { ...room, game: { ...s, phase: "done" } };
    return {
      ...room,
      game: {
        ...s,
        phase: "draw",
        fakeId: order[Math.floor(Math.random() * order.length)],
        order,
        turn: 0,
        strokes: [],
        live: { c: 0, p: [] },
        votes: {},
        guess: null,
        caught: null,
        fakeWon: null,
        lastScores: {},
      },
    };
  };

  const reveal = (room: Room, s: StrokeState, fakeWon: boolean): Room => {
    const points: Record<string, number> = {};
    if (fakeWon) {
      if (s.fakeId) points[s.fakeId] = 1000;
    } else {
      connectedPlayers(room)
        .filter((p) => p.id !== s.fakeId)
        .forEach((p) => (points[p.id] = 500));
    }
    // Built from `s`, not from the room after scoring: the guess and the
    // verdict were set on `s` a moment ago, and the room hasn't seen them.
    const scored = award(room, points);
    return { ...scored, game: { ...s, phase: "reveal", fakeWon, lastScores: points } };
  };

  /** Count the votes. A tie at the top lets the fake slip through. */
  const resolveVotes = (room: Room, s: StrokeState): Room => {
    const counts: Record<string, number> = {};
    Object.values(s.votes).forEach((id) => (counts[id] = (counts[id] ?? 0) + 1));
    const top = Math.max(0, ...Object.values(counts));
    const leaders = Object.keys(counts).filter((id) => counts[id] === top);
    const caught = top > 0 && leaders.length === 1 && leaders[0] === s.fakeId;
    if (!caught) return reveal(room, { ...s, caught: false }, true);
    return { ...room, game: { ...s, phase: "guess", caught: true } };
  };

  const everyoneVoted = (room: Room, votes: Record<string, string>) => {
    const live = connectedPlayers(room);
    return live.length > 0 && live.every((p) => votes[p.id] !== undefined);
  };

  const advance = (room: Room, s: StrokeState, strokes: SignedStroke[]): Room => {
    const turn = s.turn + 1;
    const next: StrokeState = { ...s, strokes, live: { c: 0, p: [] }, turn };
    return {
      ...room,
      game: turn >= strokeTotal(s) ? { ...next, phase: "vote" } : next,
    };
  };

  return {
    id: "one-stroke",
    name: "One Stroke",
    minPlayers: 3,
    needsPhones: true,

    init(room) {
      const primed = room as unknown as { pendingPairs?: unknown; pendingRounds?: number };
      const supplied = Array.isArray(primed.pendingPairs)
        ? (primed.pendingPairs as unknown[]).filter(
            (p): p is StrokePair =>
              typeof p === "object" && p !== null &&
              typeof (p as StrokePair).word === "string" &&
              typeof (p as StrokePair).category === "string",
          )
        : [];
      const pairs = shuffle(supplied.length ? supplied : pool).slice(
        0,
        roundsFor("one-stroke", primed.pendingRounds),
      );
      const fresh: StrokeState = {
        kind: "stroke",
        phase: "draw",
        pairs,
        round: 0,
        fakeId: null,
        order: [],
        turn: 0,
        passes: STROKE_PASSES,
        strokes: [],
        live: { c: 0, p: [] },
        votes: {},
        guess: null,
        caught: null,
        fakeWon: null,
        lastScores: {},
      };
      return beginRound({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;
      const drawer = strokeDrawer(s);

      switch (action.type) {
        case "draw": {
          if (s.phase !== "draw" || !action.playerId || action.playerId !== drawer) return room;
          const points = Array.isArray(action.payload?.points)
            ? (action.payload.points as unknown[])
                .map(Number)
                .filter((n) => Number.isFinite(n) && n >= 0 && n <= 1000)
                .map(Math.round)
            : [];
          if (!points.length) return room;
          // One line is one line: past the cap, the pen simply stops taking ink.
          if (s.live.p.length >= MAX_POINTS) return room;
          const grown = [...s.live.p, ...points].slice(0, MAX_POINTS);
          return {
            ...room,
            game: { ...s, live: { c: strokeColourFor(s, action.playerId), w: 1, p: grown } },
          };
        }

        /** Pen up: that was your line. Next artist. */
        case "lift": {
          if (s.phase !== "draw" || !action.playerId || action.playerId !== drawer) return room;
          // A tap with no line isn't a stroke; the turn stays theirs.
          if (s.live.p.length < 4) return { ...room, game: { ...s, live: { c: 0, p: [] } } };
          const banked: SignedStroke = { ...s.live, by: action.playerId };
          return advance(room, s, [...s.strokes, banked]);
        }

        case "vote": {
          if (s.phase !== "vote" || !action.playerId) return room;
          const target = String(action.payload?.playerId ?? "");
          if (!target || target === action.playerId) return room;
          if (!connectedPlayers(room).some((p) => p.id === target)) return room;
          const votes = { ...s.votes, [action.playerId]: target };
          const voted: StrokeState = { ...s, votes };
          return everyoneVoted(room, votes)
            ? resolveVotes(room, voted)
            : { ...room, game: voted };
        }

        case "guess": {
          if (s.phase !== "guess" || !action.playerId || action.playerId !== s.fakeId) return room;
          const text = String(action.payload?.text ?? "").trim().slice(0, 60);
          if (!text) return room;
          const word = strokePair(s)?.word ?? "";
          const right = Boolean(matchAnswer(text, [{ text: word, points: 1 }], [], "lenient"));
          return reveal(room, { ...s, guess: text }, right);
        }

        /** The host moving a stuck room along. */
        case "force":
          if (s.phase === "draw") return advance(room, s, s.strokes);
          if (s.phase === "vote") return resolveVotes(room, s);
          if (s.phase === "guess") return reveal(room, s, false);
          return room;

        case "next": {
          if (s.phase !== "reveal") return room;
          const round = s.round + 1;
          if (round >= s.pairs.length) return { ...room, game: { ...s, phase: "done" } };
          return beginRound(room, { ...s, round });
        }

        default:
          return room;
      }
    },
  };
}

/**
 * A category wide enough that the fake has something to work with, and one
 * thing in it that a line or two can start to suggest.
 */
export const STROKE_PAIRS: StrokePair[] = [
  { category: "Animal", word: "Giraffe" },
  { category: "Kitchen", word: "Kettle" },
  { category: "Vehicle", word: "Helicopter" },
  { category: "Fruit", word: "Pineapple" },
  { category: "Sport", word: "Tennis" },
  { category: "Furniture", word: "Rocking chair" },
  { category: "Weather", word: "Tornado" },
  { category: "Instrument", word: "Saxophone" },
  { category: "Building", word: "Lighthouse" },
  { category: "Toy", word: "Yo-yo" },
  { category: "Sea creature", word: "Octopus" },
  { category: "Clothing", word: "Wellington boots" },
  { category: "Insect", word: "Butterfly" },
  { category: "Tool", word: "Hammer" },
  { category: "Dessert", word: "Ice cream cone" },
  { category: "Bird", word: "Flamingo" },
  { category: "Space", word: "Rocket" },
  { category: "Garden", word: "Wheelbarrow" },
  { category: "Bathroom", word: "Toothbrush" },
  { category: "Job", word: "Firefighter" },
  { category: "Fairground", word: "Ferris wheel" },
  { category: "Fantasy", word: "Dragon" },
  { category: "Beach", word: "Sandcastle" },
  { category: "Winter", word: "Snowman" },
  { category: "Music", word: "Drum kit" },
  { category: "Camping", word: "Tent" },
  { category: "Farm", word: "Tractor" },
  { category: "Bedroom", word: "Bunk bed" },
  { category: "Christmas", word: "Reindeer" },
  { category: "Halloween", word: "Witch" },
  { category: "Ocean", word: "Submarine" },
  { category: "Circus", word: "Unicycle" },
  { category: "Breakfast", word: "Fried egg" },
  { category: "Pet", word: "Hamster" },
  { category: "Tree", word: "Palm tree" },
  { category: "Dinosaur", word: "T-Rex" },
  { category: "Superhero", word: "Cape" },
  { category: "City", word: "Skyscraper" },
  { category: "Party", word: "Balloon" },
  { category: "Vegetable", word: "Broccoli" },
];
