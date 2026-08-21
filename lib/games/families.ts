/**
 * Every game belongs to a family, and the family decides the colour that lights
 * the screen. Coral is the brand and never appears here on purpose — no single
 * game is allowed to wear it.
 */
export type Family = "trivia" | "deception" | "social" | "word";

export const FAMILY_OF: Record<string, Family> = {
  /* Quiz-shaped: a board, a buzzer, a right answer. */
  "big-board": "trivia",
  "trivia-royale": "trivia",
  "bluff-trivia": "trivia",
  "last-one-standing": "trivia",
  /* Someone in the room is lying. */
  impostor: "deception",
  "code-grid": "deception",
  /* The game is about the people playing it. */
  "most-likely-to": "social",
  "who-said-it": "social",
  groupthink: "social",
  "face-off": "social",
  /* Words, clocks and canvases. */
  "emoji-riddles": "word",
  timeline: "word",
  "dial-it-in": "word",
  "sketch-and-guess": "word",
  categories: "word",
  "three-in-five": "word",
};

/**
 * The class that sets --accent for a screen. Nothing (moonlight) when there's
 * no game on — the lobby and the landing page stay neutral so the brand reads.
 */
export function familyClass(gameId?: string | null): string {
  const family = gameId ? FAMILY_OF[gameId] : undefined;
  return family ? `g-${family}` : "";
}
