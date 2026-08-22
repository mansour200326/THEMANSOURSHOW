import { type BuzzItem, createBuzzGame } from "@/lib/games/buzzEngine";
import { sampleBoard } from "@/lib/bigboard/sampleBoard";

/* ------------------------------------------------------------ Trivia Royale */

/** Same board as Big Board — but everyone races for it on their phone. */
export const triviaRoyale = createBuzzGame(
  {
    id: "trivia-royale",
    name: "Trivia Royale",
    minPlayers: 1,
    mode: "board",
    deductOnWrong: true,
  },
  { board: sampleBoard },
);

/* ------------------------------------------------------------ Emoji Riddles */

/**
 * Deliberately not all films. A pack of nothing but movies turns into the same
 * five people shouting, and it runs out fast — countries, food, songs and
 * sayings pull in whoever knows what. Each riddle carries the sort of thing
 * it is, because 🧊🇮🇸 is fair if you know you want a country and impossible
 * if you don't.
 */
const EMOJI_RIDDLES: BuzzItem[] = [
  /* Films */
  { prompt: "🦁👑🌅", answer: "The Lion King", value: 500, hint: "Film" },
  { prompt: "🧊🚢💔", answer: "Titanic", value: 500, hint: "Film" },
  { prompt: "👨‍🍳🐀🇫🇷", answer: "Ratatouille", value: 500, hint: "Film" },
  { prompt: "🔵💊🔴💊🕶️", answer: "The Matrix", value: 500, hint: "Film" },
  { prompt: "🦖🏝️🧬", answer: "Jurassic Park", value: 500, hint: "Film" },
  { prompt: "🤖🌍🌱", answer: "WALL-E", value: 500, hint: "Film" },
  { prompt: "🏠🎈☁️", answer: "Up", value: 500, hint: "Film" },
  { prompt: "🍫🏭🎫", answer: "Charlie and the Chocolate Factory", value: 500, hint: "Film" },

  /* Countries */
  { prompt: "🧊🏝️🌋", answer: "Iceland", value: 500, hint: "Country" },
  { prompt: "🦘🪃☀️", answer: "Australia", value: 500, hint: "Country" },
  { prompt: "🍕🍝🗼", answer: "Italy", value: 500, hint: "Country" },
  { prompt: "🐼🏯🥢", answer: "China", value: 500, hint: "Country" },
  { prompt: "🌶️🌮🎺", answer: "Mexico", value: 500, hint: "Country" },
  { prompt: "🍁🏒🐻", answer: "Canada", value: 500, hint: "Country" },
  { prompt: "🐫🕌🛢️", answer: "Saudi Arabia", value: 500, hint: "Country" },
  { prompt: "☕⚽🌴", answer: "Brazil", value: 500, hint: "Country" },
  { prompt: "🍣🗻🎌", answer: "Japan", value: 500, hint: "Country" },
  { prompt: "🐘🍛🕉️", answer: "India", value: 500, hint: "Country" },

  /* Food */
  { prompt: "🥖🧀🍷", answer: "A cheese board", value: 500, hint: "Food" },
  { prompt: "🥚🍞🍳", answer: "French toast", value: 500, hint: "Food" },
  { prompt: "🐟🍟", answer: "Fish and chips", value: 500, hint: "Food" },
  { prompt: "🍚🐔🧄", answer: "Chicken and rice", value: 500, hint: "Food" },
  { prompt: "🥩🔥🍢", answer: "A barbecue", value: 500, hint: "Food" },
  { prompt: "🍦🍫🍌", answer: "A banana split", value: 500, hint: "Food" },

  /* Songs */
  { prompt: "👶🦈🌊", answer: "Baby Shark", value: 500, hint: "Song" },
  { prompt: "☔🎶💃", answer: "Singin' in the Rain", value: 500, hint: "Song" },
  { prompt: "👋🌍👋🌙", answer: "Hello", value: 500, hint: "Song" },
  { prompt: "🎂🎉🎈🎵", answer: "Happy Birthday", value: 500, hint: "Song" },

  /* Sayings */
  { prompt: "🍰🍰🍽️", answer: "A piece of cake", value: 500, hint: "Saying" },
  { prompt: "🐱👅", answer: "Cat got your tongue", value: 500, hint: "Saying" },
  { prompt: "🌧️🐱🐶", answer: "Raining cats and dogs", value: 500, hint: "Saying" },
  { prompt: "💔🧊", answer: "Break the ice", value: 500, hint: "Saying" },
  { prompt: "🐦🖐️🌳🐦🐦", answer: "A bird in the hand", value: 500, hint: "Saying" },

  /* Places */
  { prompt: "🗼💡🥐", answer: "Paris", value: 500, hint: "City" },
  { prompt: "🕌🏜️🏗️", answer: "Dubai", value: 500, hint: "City" },
  { prompt: "🗽🍎🚕", answer: "New York", value: 500, hint: "City" },
  { prompt: "☕🌧️☂️", answer: "London", value: 500, hint: "City" },

  /* Jobs */
  { prompt: "🚒💧🪜", answer: "A firefighter", value: 500, hint: "Job" },
  { prompt: "✂️💇‍♂️🪞", answer: "A hairdresser", value: 500, hint: "Job" },
  { prompt: "⚖️📚👔", answer: "A lawyer", value: 500, hint: "Job" },
  { prompt: "🦷🪥🩺", answer: "A dentist", value: 500, hint: "Job" },

  /* Sport */
  { prompt: "🥅⚽🧤", answer: "A goalkeeper", value: 500, hint: "Sport" },
  { prompt: "🏊🚴🏃", answer: "A triathlon", value: 500, hint: "Sport" },
  { prompt: "🎾🍓🇬🇧", answer: "Wimbledon", value: 500, hint: "Sport" },

  /* Animals */
  { prompt: "🐴🦄➖🎠", answer: "A horse", value: 500, hint: "Animal" },
  { prompt: "🌊🐴", answer: "A seahorse", value: 500, hint: "Animal" },
  { prompt: "🐝🐻", answer: "A honey badger", value: 500, hint: "Animal" },
];

export const emojiRiddles = createBuzzGame(
  {
    id: "emoji-riddles",
    name: "Emoji Riddles",
    minPlayers: 1,
    mode: "sequence",
    // Guessing wrong shouldn't cost you here — it kills the shouting.
    deductOnWrong: false,
  },
  { items: EMOJI_RIDDLES },
);
