import { type LiveItem, createLiveGame } from "@/lib/games/liveEngine";

/* ------------------------------------------------------- content packs */

/**
 * Bundled fallbacks, same deal as every other game: the room can play without
 * an API key, and the generator replaces these when there is one.
 */

const STANDING: LiveItem[] = [
  { prompt: "Name any country whose name begins and ends with the same letter.", answer: "Austria" },
  { prompt: "What's the only even prime number?", answer: "Two" },
  { prompt: "Which planet is closest to the sun?", answer: "Mercury" },
  { prompt: "How many sides does a hexagon have?", answer: "Six" },
  { prompt: "What's the largest ocean on Earth?", answer: "The Pacific" },
  { prompt: "Which gas do plants take in to make food?", answer: "Carbon dioxide" },
  { prompt: "What's the capital of Japan?", answer: "Tokyo" },
  { prompt: "How many minutes are in a full day?", answer: "1440" },
  { prompt: "What's the longest river in the world?", answer: "The Nile" },
  { prompt: "Which metal is liquid at room temperature?", answer: "Mercury" },
  { prompt: "How many strings does a standard violin have?", answer: "Four" },
  { prompt: "What's the smallest country in the world?", answer: "Vatican City" },
];

const TIMELINE: LiveItem[] = [
  {
    prompt: "Put these inventions in the order they arrived.",
    events: ["The printing press", "The telephone", "Television", "The mobile phone", "The smartphone"],
  },
  {
    prompt: "Order these from earliest to latest.",
    events: ["The Great Fire of London", "The French Revolution", "The first aeroplane flight", "The moon landing", "The first iPhone"],
  },
  {
    prompt: "Which came first? Order them.",
    events: ["The Olympics begin in Athens", "The Titanic sinks", "The Second World War ends", "The Berlin Wall falls", "The euro enters circulation"],
  },
  {
    prompt: "Order these by when they were released.",
    events: ["The Godfather", "Star Wars", "Jurassic Park", "The Lord of the Rings", "Avatar"],
  },
  {
    prompt: "Order these from oldest to newest.",
    events: ["The wheel", "Paper", "Gunpowder", "The steam engine", "The internet"],
  },
  {
    prompt: "Put these in the order they were founded.",
    events: ["Oxford University", "The Bank of England", "Coca-Cola", "Ford", "Google"],
  },
];

const DIAL: LiveItem[] = [
  { prompt: "Where does it sit?", left: "Overrated", right: "Underrated" },
  { prompt: "Where does it sit?", left: "A snack", right: "A meal" },
  { prompt: "Where does it sit?", left: "Rude", right: "Polite" },
  { prompt: "Where does it sit?", left: "Useless", right: "Essential" },
  { prompt: "Where does it sit?", left: "Cheap", right: "Luxury" },
  { prompt: "Where does it sit?", left: "Quiet night", right: "Big night" },
  { prompt: "Where does it sit?", left: "Forgettable", right: "Iconic" },
  { prompt: "Where does it sit?", left: "A hobby", right: "An obsession" },
];

/* -------------------------------------------------------------- games */

export const lastOneStanding = createLiveGame(
  {
    id: "last-one-standing",
    name: "Last One Standing",
    blurb:
      "Everyone answers at once. Get it wrong and you're on the bench until one player is left.",
    minPlayers: 2,
    variant: "standing",
    rounds: 12,
  },
  STANDING,
);

export const timeline = createLiveGame(
  {
    id: "timeline",
    name: "Timeline",
    blurb:
      "Five things, one right order. Put them in sequence on your phone before the reveal.",
    minPlayers: 1,
    variant: "timeline",
    rounds: 6,
  },
  TIMELINE,
);

export const dialItIn = createLiveGame(
  {
    id: "dial-it-in",
    name: "Dial It In",
    blurb:
      "One player sees a hidden point on a spectrum and gives one word. Everyone else dials it in.",
    minPlayers: 2,
    variant: "dial",
    rounds: 8,
  },
  DIAL,
);

export const livePacks = {
  "last-one-standing": STANDING,
  timeline: TIMELINE,
  "dial-it-in": DIAL,
};
