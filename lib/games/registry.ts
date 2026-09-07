import type { GameModule } from "@/lib/games/types";
import {
  guessWhoSaidIt,
  mostLikelyTo,
} from "@/lib/games/roundGames";
import { emojiRiddles, triviaRoyale } from "@/lib/games/buzzGames";
import { dialItIn, lastOneStanding, timeline } from "@/lib/games/liveGames";
import { createImpostorGame } from "@/lib/games/impostor";
import { impostorPack } from "@/lib/games/impostorPack";
import { createSketchGame } from "@/lib/games/sketch";
import { SKETCH_WORDS } from "@/lib/games/wordPacks";
import { oddOneOut } from "@/lib/games/oddOne";

const impostor = createImpostorGame(impostorPack);
const sketchAndGuess = createSketchGame(SKETCH_WORDS);

/**
 * Every phone-controlled segment the room knows how to run. Big Board isn't
 * here — it's the one game that runs entirely in the host's browser with no
 * room — and nor is Categories, for the same reason.
 */
export const games: Record<string, GameModule> = {
  [triviaRoyale.id]: triviaRoyale,
  [mostLikelyTo.id]: mostLikelyTo,
  [guessWhoSaidIt.id]: guessWhoSaidIt,
  [oddOneOut.id]: oddOneOut,
  [emojiRiddles.id]: emojiRiddles,
  [lastOneStanding.id]: lastOneStanding,
  [timeline.id]: timeline,
  [dialItIn.id]: dialItIn,
  [impostor.id]: impostor,
  [sketchAndGuess.id]: sketchAndGuess,
};

export const gameList = Object.values(games);
