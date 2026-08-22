import type { GameModule } from "@/lib/games/types";
import {
  bluffTrivia,
  guessWhoSaidIt,
  herdMentality,
  mostLikelyTo,
} from "@/lib/games/roundGames";
import { emojiRiddles, triviaRoyale } from "@/lib/games/buzzGames";
import { dialItIn, lastOneStanding, timeline } from "@/lib/games/liveGames";
import { createImpostorGame } from "@/lib/games/impostor";
import { impostorPack } from "@/lib/games/impostorPack";
import { createCodeGrid } from "@/lib/games/codegrid";
import { createSketchGame } from "@/lib/games/sketch";
import { GRID_WORDS, SKETCH_WORDS } from "@/lib/games/wordPacks";

const impostor = createImpostorGame(impostorPack);
const codeGrid = createCodeGrid(GRID_WORDS);
const sketchAndGuess = createSketchGame(SKETCH_WORDS);

/**
 * Every phone-controlled segment the room knows how to run. Big Board isn't
 * here — it's the one game that runs entirely in the host's browser with no
 * room — and nor are Categories or Three in Five, for the same reason.
 */
export const games: Record<string, GameModule> = {
  [triviaRoyale.id]: triviaRoyale,
  [mostLikelyTo.id]: mostLikelyTo,
  [guessWhoSaidIt.id]: guessWhoSaidIt,
  [bluffTrivia.id]: bluffTrivia,
  [herdMentality.id]: herdMentality,
  [emojiRiddles.id]: emojiRiddles,
  [lastOneStanding.id]: lastOneStanding,
  [timeline.id]: timeline,
  [dialItIn.id]: dialItIn,
  [impostor.id]: impostor,
  [codeGrid.id]: codeGrid,
  [sketchAndGuess.id]: sketchAndGuess,
};

export const gameList = Object.values(games);
