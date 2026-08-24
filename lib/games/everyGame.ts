import { gameList } from "@/lib/games/registry";
import { SCREEN_ONLY } from "@/lib/games/screenOnly";

/**
 * All sixteen, in one place.
 *
 * The twelve that run on the room engine live in the registry and the four
 * screen-only ones don't, so anything that has to cover the whole lineup —
 * the rules, the custom-pack editors, and the tests that check neither has a
 * gap — was reaching into two lists and getting it wrong. There used to be a
 * third hand-written list behind a second menu screen; that's what let the
 * game count drift out of step in three files at once.
 */
export const EVERY_GAME_ID: string[] = [
  ...SCREEN_ONLY.map((g) => g.id),
  ...gameList.map((g) => g.id),
];
