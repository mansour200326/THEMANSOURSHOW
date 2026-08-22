/**
 * Packs the host writes themselves.
 *
 * Every game can be played three ways: the bundled content, something the AI
 * writes, or this — the host typing their own questions in. A pack is saved in
 * the browser under a name, so the set you wrote for your brother's birthday is
 * still there next month. That reusability is the whole point; a one-off form
 * you fill in and lose isn't a template.
 *
 * There are nine content shapes across sixteen games, and they collapse into
 * far fewer than sixteen editors — most games want a list of rows with two or
 * three fields.
 */

export type PackKind =
  /** Categories, each with clues worth ascending points. */
  | "board"
  /** A survey question with ranked answers. */
  | "survey"
  /** Emoji, what they mean, and what sort of thing it is. */
  | "riddles"
  /** A question with one short answer. */
  | "qa"
  /** Five things in their true order. */
  | "timeline"
  /** Two ends of a scale. */
  | "spectrum"
  /** A place and the people you'd find there. */
  | "places"
  /** Single words. */
  | "words"
  /** One line each — a prompt, a category, a thing to shout about. */
  | "prompts";

export type BoardClue = { clue: string; answer: string };
export type BoardCategory = { title: string; clues: BoardClue[] };
export type SurveyAnswer = { text: string; points: number };
export type SurveyRound = { question: string; answers: SurveyAnswer[] };
export type Riddle = { emoji: string; answer: string; hint: string };
export type QA = { prompt: string; answer: string };
export type TimelineRound = { prompt: string; events: string[] };
export type Spectrum = { left: string; right: string };
export type Place = { name: string; roles: string[] };

export type PackData = {
  board: BoardCategory[];
  survey: SurveyRound[];
  riddles: Riddle[];
  qa: QA[];
  timeline: TimelineRound[];
  spectrum: Spectrum[];
  places: Place[];
  words: string[];
  prompts: string[];
};

export type SavedPack<K extends PackKind = PackKind> = {
  id: string;
  /** What the host called it. */
  name: string;
  kind: K;
  /** The game it was written for. */
  gameId: string;
  updatedAt: number;
  data: PackData[K];
};

/** Which shape each game's content takes. */
export const PACK_KIND: Record<string, PackKind> = {
  "big-board": "board",
  "trivia-royale": "board",
  "face-off": "survey",
  "emoji-riddles": "riddles",
  "last-one-standing": "qa",
  timeline: "timeline",
  "dial-it-in": "spectrum",
  impostor: "places",
  "code-grid": "words",
  "sketch-and-guess": "words",
  categories: "prompts",
  "three-in-five": "prompts",
  "most-likely-to": "prompts",
  "who-said-it": "prompts",
  groupthink: "prompts",
  "bluff-trivia": "qa",
};

/** How many rows a pack needs before it can be played. */
export const PACK_MINIMUM: Record<PackKind, number> = {
  board: 3,
  survey: 1,
  riddles: 4,
  qa: 4,
  timeline: 1,
  spectrum: 3,
  places: 4,
  words: 25,
  prompts: 3,
};

/** What one row is called, for the buttons and the counters. */
export const PACK_NOUN: Record<PackKind, { one: string; many: string }> = {
  board: { one: "category", many: "categories" },
  survey: { one: "question", many: "questions" },
  riddles: { one: "riddle", many: "riddles" },
  qa: { one: "question", many: "questions" },
  timeline: { one: "round", many: "rounds" },
  spectrum: { one: "scale", many: "scales" },
  places: { one: "place", many: "places" },
  words: { one: "word", many: "words" },
  prompts: { one: "prompt", many: "prompts" },
};

/** The values on a Big Board column, and how many clues that means. */
export const BOARD_VALUES = [100, 200, 300, 400, 500];

export const emptyPackData = (kind: PackKind): PackData[PackKind] => {
  switch (kind) {
    case "board":
      return Array.from({ length: 3 }, () => ({
        title: "",
        clues: BOARD_VALUES.map(() => ({ clue: "", answer: "" })),
      }));
    case "survey":
      return [
        {
          question: "",
          answers: Array.from({ length: 6 }, () => ({ text: "", points: 0 })),
        },
      ];
    case "riddles":
      return Array.from({ length: 6 }, () => ({ emoji: "", answer: "", hint: "" }));
    case "qa":
      return Array.from({ length: 6 }, () => ({ prompt: "", answer: "" }));
    case "timeline":
      return [{ prompt: "", events: ["", "", "", "", ""] }];
    case "spectrum":
      return Array.from({ length: 4 }, () => ({ left: "", right: "" }));
    case "places":
      return Array.from({ length: 5 }, () => ({
        name: "",
        roles: ["", "", "", "", "", ""],
      }));
    case "words":
      return Array.from({ length: 25 }, () => "");
    case "prompts":
      return Array.from({ length: 6 }, () => "");
  }
};
