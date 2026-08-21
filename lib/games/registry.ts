import type { GameModule } from "@/lib/games/types";
import {
  bluffTrivia,
  guessWhoSaidIt,
  herdMentality,
  mostLikelyTo,
} from "@/lib/games/roundGames";
import { emojiRiddles, triviaRoyale } from "@/lib/games/buzzGames";

/**
 * Every phone-controlled segment the room knows how to run. Big Board isn't
 * here — it's the one game that runs entirely in the host's browser with no room.
 */
export const games: Record<string, GameModule> = {
  [triviaRoyale.id]: triviaRoyale,
  [mostLikelyTo.id]: mostLikelyTo,
  [guessWhoSaidIt.id]: guessWhoSaidIt,
  [bluffTrivia.id]: bluffTrivia,
  [herdMentality.id]: herdMentality,
  [emojiRiddles.id]: emojiRiddles,
};

export const gameList = Object.values(games);
