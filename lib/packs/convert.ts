import type { Board } from "@/lib/board/types";
import type { BuzzItem } from "@/lib/games/buzzEngine";
import type { ImpostorPlace } from "@/lib/games/impostor";
import type { LiveItem } from "@/lib/games/liveEngine";
import type { FeudQuestion } from "@/lib/feud/types";
import {
  BOARD_VALUES,
  type BoardCategory,
  type PackData,
  type PackKind,
  type Place,
  type QA,
  type Riddle,
  type Spectrum,
  type SurveyRound,
  type TimelineRound,
} from "@/lib/packs/types";

/**
 * Turning what the host typed into what the engines expect.
 *
 * Everything here drops half-finished rows rather than refusing them. Someone
 * writing a quiz with the room already arriving will leave a box empty, and
 * losing the whole pack over it would be the wrong trade — a five-clue category
 * with four clues is a four-clue category, not an error.
 */

const clean = (s: string) => s.trim();
const filled = (s: string) => clean(s).length > 0;

export function packToBoard(categories: BoardCategory[]): Board {
  return {
    categories: categories
      .filter((c) => filled(c.title) && c.clues.some((q) => filled(q.clue) && filled(q.answer)))
      .map((c) => ({
        title: clean(c.title).toUpperCase(),
        clues: c.clues
          .map((q, i) => ({
            value: BOARD_VALUES[i] ?? (i + 1) * 100,
            clue: clean(q.clue),
            answer: clean(q.answer),
          }))
          .filter((q) => filled(q.clue) && filled(q.answer)),
      })),
  };
}

export function packToSurvey(rounds: SurveyRound[]): FeudQuestion[] {
  return rounds
    .filter((r) => filled(r.question))
    .map((r) => ({
      question: clean(r.question),
      answers: r.answers
        .filter((a) => filled(a.text))
        // The board reads top-down, so the biggest number has to be first
        // whatever order they were typed in.
        .sort((a, b) => b.points - a.points)
        .map((a) => ({ text: clean(a.text), points: Math.max(1, a.points) })),
    }))
    .filter((r) => r.answers.length >= 2);
}

export function packToRiddles(riddles: Riddle[]): BuzzItem[] {
  return riddles
    .filter((r) => filled(r.emoji) && filled(r.answer))
    .map((r) => ({
      prompt: clean(r.emoji),
      answer: clean(r.answer),
      value: 500,
      hint: filled(r.hint) ? clean(r.hint) : undefined,
    }));
}

export function packToQuestions(rows: QA[]): LiveItem[] {
  return rows
    .filter((q) => filled(q.prompt) && filled(q.answer))
    .map((q) => ({ prompt: clean(q.prompt), answer: clean(q.answer) }));
}

/** Bluff Trivia rides the round engine, which wants a prompt and its truth. */
export function packToBluff(rows: QA[]) {
  return rows
    .filter((q) => filled(q.prompt) && filled(q.answer))
    .map((q) => ({ text: clean(q.prompt), answer: clean(q.answer) }));
}

export function packToTimeline(rounds: TimelineRound[]): LiveItem[] {
  return rounds
    .map((r) => ({
      prompt: clean(r.prompt) || "Put these in order.",
      events: r.events.filter(filled).map(clean),
    }))
    .filter((r) => r.events.length >= 3);
}

export function packToSpectrums(rows: Spectrum[]): LiveItem[] {
  return rows
    .filter((s) => filled(s.left) && filled(s.right))
    .map((s) => ({
      prompt: "Where does it sit?",
      left: clean(s.left),
      right: clean(s.right),
    }));
}

export function packToPlaces(places: Place[]): ImpostorPlace[] {
  return places
    .filter((p) => filled(p.name) && p.roles.filter(filled).length >= 2)
    .map((p) => ({ name: clean(p.name), roles: p.roles.filter(filled).map(clean) }));
}

export const packToWords = (words: string[]) => words.filter(filled).map(clean);
export const packToPrompts = (prompts: string[]) => prompts.filter(filled).map(clean);

/**
 * How many playable items a pack yields. The setup screens use this to decide
 * whether "play mine" can be pressed, so it has to count the same way the
 * converters do.
 */
export function packSize(kind: PackKind, data: PackData[PackKind]): number {
  switch (kind) {
    case "board":
      return packToBoard(data as BoardCategory[]).categories.length;
    case "survey":
      return packToSurvey(data as SurveyRound[]).length;
    case "riddles":
      return packToRiddles(data as Riddle[]).length;
    case "qa":
      return packToQuestions(data as QA[]).length;
    case "timeline":
      return packToTimeline(data as TimelineRound[]).length;
    case "spectrum":
      return packToSpectrums(data as Spectrum[]).length;
    case "places":
      return packToPlaces(data as Place[]).length;
    case "words":
      return packToWords(data as string[]).length;
    case "prompts":
      return packToPrompts(data as string[]).length;
    default:
      return 0;
  }
}

/* --------------------------------------------- into a game:start payload */

/**
 * The room games all take their content on the start action, but each reads a
 * different slot. This is the one place that mapping lives, so adding a game
 * means adding a line here rather than hunting through the host screen.
 */
export function packToStartPayload(
  gameId: string,
  kind: PackKind,
  data: PackData[PackKind],
): Record<string, unknown> {
  switch (gameId) {
    case "trivia-royale":
      return { board: packToBoard(data as BoardCategory[]) };
    case "emoji-riddles":
      return { items: packToRiddles(data as Riddle[]) };
    case "last-one-standing":
      return { items: packToQuestions(data as QA[]) };
    case "timeline":
      return { items: packToTimeline(data as TimelineRound[]) };
    case "dial-it-in":
      return { items: packToSpectrums(data as Spectrum[]) };
    case "impostor":
      return { places: packToPlaces(data as Place[]) };
    case "code-grid":
    case "sketch-and-guess":
      return { words: packToWords(data as string[]) };
    case "bluff-trivia":
      return { prompts: packToBluff(data as QA[]) };
    case "most-likely-to":
    case "who-said-it":
    case "groupthink":
      return { prompts: packToPrompts(data as string[]).map((text) => ({ text })) };
    default:
      return {};
  }
}
