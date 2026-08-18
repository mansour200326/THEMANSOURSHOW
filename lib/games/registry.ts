import type { GameModule } from "@/lib/games/types";
import {
  bluffTrivia,
  guessWhoSaidIt,
  herdMentality,
  mostLikelyTo,
} from "@/lib/games/roundGames";

/**
 * Every phone-controlled segment the room knows how to run. Team Jeopardy isn't
 * here — it's the one game that runs entirely in the host's browser with no room.
 */
export const games: Record<string, GameModule> = {
  [mostLikelyTo.id]: mostLikelyTo,
  [guessWhoSaidIt.id]: guessWhoSaidIt,
  [bluffTrivia.id]: bluffTrivia,
  [herdMentality.id]: herdMentality,
};

export const gameList = Object.values(games);
