import type { ImpostorState } from "@/lib/games/impostor";
import type { OddState } from "@/lib/games/oddOne";
import type { SketchState } from "@/lib/games/sketch";
import type { ActState } from "@/lib/games/actOut";
import type { StrokeState } from "@/lib/games/oneStroke";
import type { Room } from "@/lib/room/types";

/**
 * What each screen is allowed to see.
 *
 * Every client holds an SSE connection and gets the whole room on every change,
 * which is fine right up until a game has a secret in it. Three of them do: the
 * impostor's identity, and the word being drawn. Sending
 * the full state and hiding it in the UI would be no protection at all — the
 * payload is one devtools tab away — so the secrets are stripped on the server,
 * per recipient, before anything is written to the wire.
 *
 * The TV is a viewer too, and the strictest one: it's the screen everybody in
 * the room can see, so it gets less than the phones do.
 */

/** Fields only ever added on the way out. Reducers must not read them. */
export type ViewerExtras = {
  /** Impostor: you're it. Absent for everyone else, including the TV. */
  youAreImpostor?: boolean;
  yourPlace?: string;
  yourRole?: string;
  /** Sketch & Guess, Act It Out, Something Sketchy: the word, for whoever may know it. */
  yourWord?: string;
  /** Something Sketchy: you're the one without the word. */
  youAreFake?: boolean;
  /** Bluff Trivia: the question this phone was asked — the decoy, for one of them. */
  yourQuestion?: string;
  youAreOdd?: boolean;
  /**
   * Counts that are public in the real game but get destroyed by the
   * redaction, so they're recomputed from the unredacted state and put back.
   */
  remaining?: [number, number];
  totalRounds?: number;
};

const OPEN_PHASES = ["reveal", "done"];

function redactImpostor(
  s: ImpostorState,
  viewerId: string | null,
): ImpostorState & ViewerExtras {
  // Once it's over, everything is on the TV anyway.
  if (OPEN_PHASES.includes(s.phase)) return s;

  const isImpostor = viewerId !== null && s.impostorId === viewerId;
  const place = s.places[s.placeIndex];

  return {
    ...s,
    // Nobody is told who it is, and the TV least of all.
    impostorId: null,
    // The place is the secret the impostor is trying to work out.
    placeIndex: -1,
    roles: {},
    ...(viewerId === null
      ? {}
      : isImpostor
        ? { youAreImpostor: true }
        : {
            yourPlace: place?.name,
            yourRole: s.roles[viewerId] ?? "A regular",
          }),
  };
}


function redactSketch(
  s: SketchState,
  viewerId: string | null,
): SketchState & ViewerExtras {
  if (s.phase !== "drawing") return s;
  const drawing = viewerId !== null && s.drawerId === viewerId;
  return {
    ...s,
    // How many rounds there are is fine to know; which words they are is not.
    totalRounds: s.words.length,
    // The whole list goes, not just the current one — the next word is a
    // secret too, and the TV shows this screen to the people guessing.
    words: [],
    ...(drawing ? { yourWord: s.words[s.round] } : {}),
  };
}

/**
 * The room as this viewer is allowed to see it. Pass null for the TV.
 * Games without secrets pass straight through untouched.
 */
export function redactFor(room: Room, viewerId: string | null): Room {
  /*
   * Two things ride on the room that aren't for everyone. The host key is
   * shown on the TV — the one screen with no player behind it — so the host
   * can type it into their phone; no phone ever receives it. The sheet goes
   * the other way: only to a phone that presented the key, never to the TV,
   * because the TV is what the sheet is hiding things from.
   */
  const isTv = viewerId === null;
  const isHostPhone =
    viewerId !== null &&
    viewerId.startsWith("host:") &&
    Boolean(room.hostKey) &&
    viewerId.slice(5).toUpperCase() === room.hostKey;

  const scrubbed: Room = {
    ...room,
    hostKey: isTv ? room.hostKey : undefined,
    hostSheet: isHostPhone ? room.hostSheet : null,
  };
  room = scrubbed;

  const game = room.game as { kind?: string } | null;
  if (!game?.kind) return room;

  switch (game.kind) {
    case "impostor":
      return { ...room, game: redactImpostor(game as ImpostorState, viewerId) };
    case "sketch":
      return { ...room, game: redactSketch(game as SketchState, viewerId) };
    case "odd":
      return { ...room, game: redactOdd(game as OddState, viewerId) };
    case "act":
      return { ...room, game: redactAct(game as ActState, viewerId) };
    case "stroke":
      return { ...room, game: redactStroke(game as StrokeState, viewerId) };
    default:
      return room;
  }
}

/**
 * Bluff Trivia. Two things must not reach the wrong screen: who has the
 * decoy, and — until the reveal — the questions themselves, because the odd
 * one out is sitting in front of the television and would simply read the
 * real one off it. Each phone gets its own question and nothing about
 * anyone else's; the TV gets no question at all until it's time.
 */
function redactOdd(s: OddState, viewerId: string | null): OddState & ViewerExtras {
  if (OPEN_PHASES.includes(s.phase)) return s;

  const pair = s.pairs[s.round];
  const isOdd = viewerId !== null && s.oddId === viewerId;
  const asked = viewerId === null ? undefined : isOdd ? pair?.decoy : pair?.question;

  return {
    ...s,
    oddId: null,
    // The whole pack is on the wire otherwise; the TV would have every decoy.
    pairs: s.pairs.map(() => ({ question: "", decoy: "" })),
    ...(asked !== undefined ? { yourQuestion: asked } : {}),
    ...(isOdd ? { youAreOdd: true } : {}),
  };
}

/**
 * Act It Out. The deck never leaves the server: the TV is in front of the
 * whole room and every phone but one belongs to somebody guessing. The actor
 * gets the current word and nothing else; the words already got or passed are
 * public by then and stay.
 */
function redactAct(s: ActState, viewerId: string | null): ActState & ViewerExtras {
  const actor = viewerId !== null && s.actorId === viewerId;
  const word = s.words.length ? s.words[s.cursor % s.words.length] : "";
  return {
    ...s,
    words: [],
    ...(actor && s.phase === "acting" ? { yourWord: word } : {}),
  };
}

/**
 * Something Sketchy. Two secrets: the word, which every phone but the fake's gets,
 * and who the fake is, which nobody gets until they're caught. The category
 * is public — it's the fake's only foothold and it's on the TV on purpose.
 */
function redactStroke(s: StrokeState, viewerId: string | null): StrokeState & ViewerExtras {
  if (OPEN_PHASES.includes(s.phase)) return s;
  const isFake = viewerId !== null && s.fakeId === viewerId;
  const pair = s.pairs[s.round];
  return {
    ...s,
    // Once caught, who it is stops being a secret; what the word is does not.
    fakeId: s.phase === "guess" ? s.fakeId : null,
    pairs: s.pairs.map((p) => ({ category: p.category, word: "" })),
    ...(viewerId === null || isFake ? {} : { yourWord: pair?.word }),
    ...(isFake ? { youAreFake: true } : {}),
  };
}
