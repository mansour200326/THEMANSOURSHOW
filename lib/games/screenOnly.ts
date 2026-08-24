/**
 * The four games that need no phones — just the television and two teams.
 *
 * They aren't in the registry because they don't run on the room engine at
 * all: each is its own page with its own state, played off the big screen.
 * The lobby lists them alongside the twelve that do, so this is where the
 * other four live and the two lists together are the sixteen.
 */
export type ScreenOnlyGame = {
  id: string;
  name: string;
  href: string;
};

export const SCREEN_ONLY: ScreenOnlyGame[] = [
  { id: "big-board", name: "Big Board", href: "/big-board" },
  { id: "face-off", name: "Face-Off", href: "/face-off" },
  { id: "categories", name: "Categories", href: "/categories" },
  { id: "three-in-five", name: "Three in Five", href: "/three-in-five" },
];
