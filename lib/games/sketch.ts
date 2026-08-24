import { matchAnswer } from "@/lib/feud/match";
import { roundsFor } from "@/lib/games/lengths";
import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";

/**
 * One phone draws, the TV shows it appearing, everyone else types what they
 * think it is.
 *
 * Strokes are the only thing in the whole product that stream continuously,
 * and they ride the same server-authoritative path as everything else: the
 * drawer posts points, the room state grows, and the existing SSE stream
 * pushes it out. No second transport, no peer connections — the drawing is
 * just more room state, and the room already knows how to broadcast that.
 *
 * The cost is that every point bumps the room version, so points are batched
 * on the phone and coordinates are stored as small integers.
 */

/**
 * The colours a drawer can pick from. Stored as an index rather than a hex
 * string — this array streams to every phone many times a second, and an
 * index is one byte where "#37D3C8" is nine.
 *
 * These are ink colours, not screen colours, because the canvas is paper. The
 * first palette was the app's own neons on a midnight square, which had no
 * black in it — there was nowhere for black to go — and washed out anything
 * dark. A drawing surface wants to be the one light thing in the room, the way
 * every drawing game has ever done it.
 */
export const SKETCH_COLOURS = [
  "#14161C", // black
  "#D92B2B", // red
  "#E8720C", // orange
  "#E0A400", // amber
  "#1F9B4B", // green
  "#0FA3A3", // teal
  "#1F6FE0", // blue
  "#7A4DD6", // violet
  "#D6338C", // pink
  "#8A5A3C", // brown
  "#7C8497", // grey
  "#FFFFFF", // white
] as const;

/**
 * Nib widths, as a fraction of the canvas. A drawing needs both a fat pen for
 * the shape of the thing and a thin one for the face on it, and 1000-grid
 * space means the same line is the same weight on a phone and a TV.
 */
export const SKETCH_WIDTHS = [0.004, 0.008, 0.018, 0.04] as const;

/**
 * One line. `p` is a flat [x, y, x, y, …] list in 0-1000 grid space, `c` is an
 * index into SKETCH_COLOURS and `w` into SKETCH_WIDTHS. The keys are one
 * letter for the same reason those are indices: this is the only state in the
 * product that streams continuously, and every byte is sent again on each
 * update.
 */
export type Stroke = { c: number; p: number[]; w?: number };

export const strokeColour = (stroke: Stroke) =>
  SKETCH_COLOURS[stroke.c] ?? SKETCH_COLOURS[0];

export const strokeWidth = (stroke: Stroke) =>
  SKETCH_WIDTHS[stroke.w ?? 1] ?? SKETCH_WIDTHS[1];

export type SketchState = {
  kind: "sketch";
  phase: "drawing" | "reveal" | "done";
  words: string[];
  round: number;
  /** Whose turn to draw. */
  drawerId: string | null;
  /** Everything drawn this round. */
  strokes: Stroke[];
  /** The line still being drawn, so the TV sees it as it happens. */
  live: Stroke;
  /** playerId -> what they've typed, most recent last. */
  guesses: Record<string, string[]>;
  /** In the order they got it, because being fast is worth more. */
  solved: string[];
  startedAt: number | null;
  seconds: number;
  lastScores: Record<string, number>;
};

const st = (room: Room) => room.game as SketchState;

export const SKETCH_SECONDS = 90;
/** Enough to draw with, few enough that the room state stays small. */
const MAX_STROKES = 400;
const MAX_POINTS_PER_STROKE = 600;

export const sketchWord = (s: SketchState): string => s.words[s.round] ?? "";

/** The word, but only for the person drawing it. */
export const sketchWordFor = (s: SketchState, playerId: string): string | null =>
  s.drawerId === playerId || s.phase === "reveal" ? sketchWord(s) : null;

/** Later solvers score less, so there's a reason to shout first. */
const solveScore = (place: number) => Math.max(300, 1000 - place * 200);

export function createSketchGame(pool: string[]): GameModule {
  const beginRound = (room: Room, s: SketchState): Room => {
    const everyone = connectedPlayers(room);
    if (!everyone.length) return { ...room, game: { ...s, phase: "done" } };
    // A practice bot has no hands, so the pen only ever goes to a person when
    // there's a person to give it to.
    const players = everyone.filter((p) => !p.bot).length
      ? everyone.filter((p) => !p.bot)
      : everyone;
    return {
      ...room,
      game: {
        ...s,
        phase: "drawing",
        // The pen goes round the room in order.
        drawerId: players[s.round % players.length].id,
        strokes: [],
        live: { c: 0, p: [] },
        guesses: {},
        solved: [],
        startedAt: Date.now(),
        lastScores: {},
      },
    };
  };

  /** Everyone who could have got it, has. */
  const allSolved = (room: Room, s: SketchState) => {
    const guessers = connectedPlayers(room).filter((p) => p.id !== s.drawerId);
    return guessers.length > 0 && guessers.every((p) => s.solved.includes(p.id));
  };

  /** Close the round and pay the drawer for how well it landed. */
  const finish = (room: Room, s: SketchState): Room => {
    const points: Record<string, number> = {};
    s.solved.forEach((id, place) => {
      points[id] = solveScore(place);
    });
    // A drawing nobody gets is worth nothing; one everybody gets was too easy.
    if (s.drawerId && s.solved.length) {
      points[s.drawerId] = 400 * s.solved.length;
    }
    const scored = award(room, points);
    return {
      ...scored,
      game: { ...st(scored), phase: "reveal", lastScores: points },
    };
  };

  return {
    id: "sketch-and-guess",
    name: "Sketch & Guess",
    minPlayers: 2,
    needsPhones: true,

    init(room) {
      const primed = room as unknown as {
        pendingWords?: string[];
        pendingRounds?: number;
      };
      const supplied = primed.pendingWords;
      const words = [...(supplied?.length ? supplied : pool)]
        .sort(() => Math.random() - 0.5)
        .slice(0, roundsFor("sketch-and-guess", primed.pendingRounds));
      const fresh: SketchState = {
        kind: "sketch",
        phase: "drawing",
        words,
        round: 0,
        drawerId: null,
        strokes: [],
        live: { c: 0, p: [] },
        guesses: {},
        solved: [],
        startedAt: null,
        seconds: SKETCH_SECONDS,
        lastScores: {},
      };
      return beginRound({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;

      switch (action.type) {
        /** More of the line currently being drawn. */
        case "draw": {
          if (s.phase !== "drawing" || action.playerId !== s.drawerId) return room;
          const points = Array.isArray(action.payload?.points)
            ? (action.payload.points as unknown[])
                .map(Number)
                .filter((n) => Number.isFinite(n) && n >= 0 && n <= 1000)
                .map(Math.round)
            : [];
          if (!points.length) return room;
          const clampIndex = (value: unknown, count: number) =>
            Math.max(0, Math.min(count - 1, Math.round(Number(value) || 0)));
          // Both are taken from whatever the pen was set to when the stroke
          // began, so switching mid-line can't redraw it halfway.
          const fresh = !s.live.p.length;
          const colour = fresh
            ? clampIndex(action.payload?.colour, SKETCH_COLOURS.length)
            : s.live.c;
          const width = fresh
            ? clampIndex(action.payload?.width, SKETCH_WIDTHS.length)
            : (s.live.w ?? 1);
          const grown = [...s.live.p, ...points];

          /*
           * A long unbroken line used to erase its own beginning: the cap was
           * applied with slice(-n), which keeps the LAST n numbers, so once you
           * passed it the oldest points fell off while your finger was still
           * moving. The cap still has to exist — this array is re-broadcast to
           * every phone many times a second — but it's enforced by banking the
           * line so far and starting a new one from the point the pen is at,
           * which joins up invisibly and keeps everything already drawn.
           */
          if (grown.length > MAX_POINTS_PER_STROKE) {
            const banked: Stroke = { c: colour, w: width, p: grown };
            const [lastX, lastY] = grown.slice(-2);
            return {
              ...room,
              game: {
                ...s,
                strokes: [...s.strokes, banked].slice(-MAX_STROKES),
                live: { c: colour, w: width, p: [lastX, lastY] },
              },
            };
          }

          return { ...room, game: { ...s, live: { c: colour, w: width, p: grown } } };
        }

        /** Pen lifted — bank the line. */
        case "lift": {
          if (s.phase !== "drawing" || action.playerId !== s.drawerId) return room;
          if (s.live.p.length < 4) {
            return { ...room, game: { ...s, live: { c: s.live.c, p: [] } } };
          }
          return {
            ...room,
            game: {
              ...s,
              strokes: [...s.strokes, s.live].slice(-MAX_STROKES),
              live: { c: s.live.c, p: [] },
            },
          };
        }

        case "undo": {
          if (s.phase !== "drawing" || action.playerId !== s.drawerId) return room;
          return {
            ...room,
            game: { ...s, strokes: s.strokes.slice(0, -1), live: { c: s.live.c, p: [] } },
          };
        }

        case "clear": {
          if (s.phase !== "drawing" || action.playerId !== s.drawerId) return room;
          return {
            ...room,
            game: { ...s, strokes: [], live: { c: s.live.c, p: [] } },
          };
        }

        case "guess": {
          if (s.phase !== "drawing" || !action.playerId) return room;
          if (action.playerId === s.drawerId) return room;
          if (s.solved.includes(action.playerId)) return room;

          const text = String(action.payload?.text ?? "").trim().slice(0, 60);
          if (!text) return room;

          const guesses = {
            ...s.guesses,
            [action.playerId]: [...(s.guesses[action.playerId] ?? []), text].slice(-8),
          };

          // Same matcher the survey game uses, so "a bicycle" gets "bike".
          const right = Boolean(
            matchAnswer(text, [{ text: sketchWord(s), points: 1 }], [], "lenient"),
          );
          if (!right) return { ...room, game: { ...s, guesses } };

          const solved = [...s.solved, action.playerId];
          const got: SketchState = { ...s, guesses, solved };
          return allSolved(room, got)
            ? finish(room, got)
            : { ...room, game: got };
        }

        /** Time's up, or the drawer gives in. */
        case "timeup":
        case "force":
          return s.phase === "drawing" ? finish(room, s) : room;

        case "next": {
          if (s.phase !== "reveal") return room;
          const round = s.round + 1;
          if (round >= s.words.length) {
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
