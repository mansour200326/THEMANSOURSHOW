import type { RapidMode } from "@/lib/rapid/types";

/**
 * Bundled prompts. Categories wants topics with dozens of valid answers.
 */
const CATEGORIES: string[] = [
  "Things you'd find in a kitchen",
  "Football clubs",
  "Things that are red",
  "Countries in Europe",
  "Breakfast foods",
  "Animals with four legs",
  "Things in a hospital",
  "Movies with one-word titles",
  "Things you pack for a holiday",
  "Board games",
  "Things that fly",
  "Jobs people had 100 years ago",
  "Things in a classroom",
  "Fruits",
  "Things that are cold",
  "Musical instruments",
  "Things you do at a wedding",
  "Cartoon characters",
  "Things in a car",
  "Sports played with a ball",
];


export const rapidPack: Record<RapidMode, string[]> = {
  categories: CATEGORIES,
};

/** Fresh order every game so a repeat night doesn't repeat prompts. */
export function drawPrompts(mode: RapidMode, count: number): string[] {
  const pool = [...rapidPack[mode]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
