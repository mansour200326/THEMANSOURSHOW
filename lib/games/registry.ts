import type { GameModule } from "@/lib/games/types";
import {
  captionThis,
  guessWhoSaidIt,
  mostLikelyTo,
  punchline,
} from "@/lib/games/roundGames";
import { emojiRiddles, triviaRoyale } from "@/lib/games/buzzGames";
import { dialItIn, lastOneStanding, timeline } from "@/lib/games/liveGames";
import { createImpostorGame } from "@/lib/games/impostor";
import { impostorPack } from "@/lib/games/impostorPack";
import { createSketchGame } from "@/lib/games/sketch";
import { SKETCH_WORDS } from "@/lib/games/wordPacks";
import { oddOneOut } from "@/lib/games/oddOne";
import { ACT_WORDS, createActGame } from "@/lib/games/actOut";
import { STROKE_PAIRS, createStrokeGame } from "@/lib/games/oneStroke";

const impostor = createImpostorGame(impostorPack);
const sketchAndGuess = createSketchGame(SKETCH_WORDS);
const actItOut = createActGame(ACT_WORDS);
const oneStroke = createStrokeGame(STROKE_PAIRS);

/**
 * Every phone-controlled segment the room knows how to run. Big Board isn't
 * here — it's the one game that runs entirely in the host's browser with no
 * room — and nor is Categories, for the same reason.
 */
export const games: Record<string, GameModule> = {
  [triviaRoyale.id]: triviaRoyale,
  [mostLikelyTo.id]: mostLikelyTo,
  [guessWhoSaidIt.id]: guessWhoSaidIt,
  [punchline.id]: punchline,
  [captionThis.id]: captionThis,
  [oddOneOut.id]: oddOneOut,
  [emojiRiddles.id]: emojiRiddles,
  [lastOneStanding.id]: lastOneStanding,
  [timeline.id]: timeline,
  [dialItIn.id]: dialItIn,
  [impostor.id]: impostor,
  [sketchAndGuess.id]: sketchAndGuess,
  [actItOut.id]: actItOut,
  [oneStroke.id]: oneStroke,
};

export const gameList = Object.values(games);
