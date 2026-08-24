/**
 * How long each game runs, and what the host may change it to.
 *
 * Every game had its length written into it — twelve rounds of Last One
 * Standing, eight of Dial It In — which is fine for the group it was tuned
 * for and wrong for everyone else. Twelve rounds is a long time if the room
 * has drifted onto something else, and six is nothing if they're enjoying it.
 * The default is unchanged, so nobody has to care; the picker is there for
 * when the room tells you.
 *
 * Impostor isn't here: its length is minutes of one conversation, not a count
 * of rounds, and it has its own control at setup.
 */
/*
 * No option here is longer than the bundled pack. A host who skips the
 * writing step and picks the longest option has to actually get that many
 * rounds — offering fifteen and quietly playing twelve is worse than not
 * offering fifteen. The bundled sizes are, in order below: 15, 10, 10, 10,
 * 12, 6, 8, 15 words, 47 riddles.
 */
export const ROUND_CHOICES: Record<string, number[]> = {
  "most-likely-to": [4, 6, 8, 12],
  "who-said-it": [4, 6, 8, 10],
  "bluff-trivia": [4, 6, 8, 10],
  groupthink: [4, 6, 8, 10],
  "last-one-standing": [6, 8, 10, 12],
  timeline: [3, 4, 5, 6],
  "dial-it-in": [4, 6, 8],
  "sketch-and-guess": [4, 6, 8, 12],
  "emoji-riddles": [6, 10, 14, 20],
};

/** What the game plays if the host doesn't touch it. */
export const ROUND_DEFAULTS: Record<string, number> = {
  "most-likely-to": 8,
  "who-said-it": 6,
  "bluff-trivia": 6,
  groupthink: 8,
  "last-one-standing": 12,
  timeline: 6,
  "dial-it-in": 8,
  "sketch-and-guess": 8,
  "emoji-riddles": 14,
};

/** Clamped to what's on offer, so a hand-made request can't ask for 900. */
export function roundsFor(gameId: string, asked?: number): number {
  const choices = ROUND_CHOICES[gameId];
  const fallback = ROUND_DEFAULTS[gameId] ?? 8;
  if (!asked || !choices) return fallback;
  return choices.includes(asked) ? asked : fallback;
}
