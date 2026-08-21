import type { RapidMode } from "@/lib/rapid/types";

/**
 * Bundled prompts. Categories wants topics with dozens of valid answers;
 * Three in Five wants ones where three is easy to think of but hard to say
 * under pressure.
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

const FIVE_SECONDS: string[] = [
  "Name 3 breakfast cereals",
  "Name 3 things you keep in your pocket",
  "Name 3 countries in Africa",
  "Name 3 superheroes",
  "Name 3 things that are sticky",
  "Name 3 types of pasta",
  "Name 3 things in a bathroom",
  "Name 3 famous Davids",
  "Name 3 things you'd never microwave",
  "Name 3 dog breeds",
  "Name 3 things with wheels",
  "Name 3 reasons to be late",
  "Name 3 things you'd take to a desert island",
  "Name 3 card games",
  "Name 3 things that smell bad",
  "Name 3 words that rhyme with 'light'",
  "Name 3 things you shout at a football match",
  "Name 3 things in the fridge right now",
  "Name 3 slow animals",
  "Name 3 things you'd find under a bed",
];

export const rapidPack: Record<RapidMode, string[]> = {
  categories: CATEGORIES,
  "three-in-five": FIVE_SECONDS,
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
