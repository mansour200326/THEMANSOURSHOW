/**
 * Shared board shapes. These are the JSON contract the AI generator returns and
 * the shape both Big Board (Phase 1) and Trivia Royale (Phase 4) render.
 * Keep this file free of game-specific / team-specific concepts.
 */

/**
 * A picture clue's picture. Absent on most clues — a board is still a board
 * without any, and a picture is only ever added when a real, correctly
 * identified, properly licensed one was found. See lib/images/commons.ts.
 */
export type ClueImage = {
  url: string;
  /** Author and licence, shown alongside the answer rather than the clue. */
  credit: string;
  licence: string;
  sourceUrl: string;
};

export type Clue = {
  value: number;
  clue: string;
  answer: string;
  image?: ClueImage;
};

export type Category = {
  title: string;
  clues: Clue[];
};

export type Board = {
  title?: string;
  categories: Category[];
};

export type FinalClue = {
  category: string;
  clue: string;
  answer: string;
};

/** Coordinate of a tile: category index + clue index within that category. */
export type TileRef = { c: number; r: number };

export const tileKey = (c: number, r: number) => `${c}-${r}`;
export const refKey = (ref: TileRef) => tileKey(ref.c, ref.r);

export const clueAt = (board: Board, ref: TileRef): Clue | null =>
  board.categories[ref.c]?.clues[ref.r] ?? null;

/** Highest clue value anywhere on the board — the floor for a daily-double wager. */
export const maxClueValue = (board: Board): number =>
  board.categories.reduce(
    (max, cat) => cat.clues.reduce((m, clue) => Math.max(m, clue.value), max),
    0,
  );

export const totalTiles = (board: Board): number =>
  board.categories.reduce((n, cat) => n + cat.clues.length, 0);
