import { type BuzzItem, createBuzzGame } from "@/lib/games/buzzEngine";
import { sampleBoard } from "@/lib/jeopardy/sampleBoard";

/* ------------------------------------------------------------ Trivia Royale */

/** Same board as Team Jeopardy — but everyone races for it on their phone. */
export const triviaRoyale = createBuzzGame(
  {
    id: "trivia-royale",
    name: "Trivia Royale",
    blurb:
      "The classic board, but everyone races to buzz first. Wrong answers cost you.",
    minPlayers: 1,
    mode: "board",
    deductOnWrong: true,
  },
  { board: sampleBoard },
);

/* ------------------------------------------------------------ Emoji Riddles */

const EMOJI_RIDDLES: BuzzItem[] = [
  { prompt: "🦁👑🌅", answer: "The Lion King", value: 500 },
  { prompt: "🕷️🧑‍🦱🕸️", answer: "Spider-Man", value: 500 },
  { prompt: "🧊🚢💔", answer: "Titanic", value: 500 },
  { prompt: "👨‍🍳🐀🇫🇷", answer: "Ratatouille", value: 500 },
  { prompt: "🔵💊🔴💊🕶️", answer: "The Matrix", value: 500 },
  { prompt: "🐠🔍🌊", answer: "Finding Nemo", value: 500 },
  { prompt: "🧙‍♂️💍🌋", answer: "The Lord of the Rings", value: 500 },
  { prompt: "🦖🏝️🧬", answer: "Jurassic Park", value: 500 },
  { prompt: "👻🚫🔫", answer: "Ghostbusters", value: 500 },
  { prompt: "🤖🌍🌱", answer: "WALL-E", value: 500 },
  { prompt: "❄️👸🎶", answer: "Frozen", value: 500 },
  { prompt: "🏠🎈🇻🇪", answer: "Up", value: 500 },
  { prompt: "🦇🃏🌃", answer: "The Dark Knight", value: 500 },
  { prompt: "🐷🕷️🕸️", answer: "Charlotte's Web", value: 500 },
  { prompt: "🍫🏭🎫", answer: "Charlie and the Chocolate Factory", value: 500 },
];

export const emojiRiddles = createBuzzGame(
  {
    id: "emoji-riddles",
    name: "Emoji Riddles",
    blurb:
      "Decode the emoji. First to buzz in and shout it wins the points.",
    minPlayers: 1,
    mode: "sequence",
    // Guessing wrong shouldn't cost you here — it kills the shouting.
    deductOnWrong: false,
  },
  { items: EMOJI_RIDDLES },
);
