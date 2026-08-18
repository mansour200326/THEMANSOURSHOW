import {
  type Prompt,
  type RoundState,
  type VoteOption,
  createRoundGame,
  shuffle,
  tally,
} from "@/lib/games/roundEngine";
import { type Room, connectedPlayers } from "@/lib/room/types";

/* ------------------------------------------------------------ content packs */

const MOST_LIKELY_TO: Prompt[] = [
  { text: "Most likely to move countries without telling anyone" },
  { text: "Most likely to get lost in their own neighbourhood" },
  { text: "Most likely to become suspiciously rich overnight" },
  { text: "Most likely to start an argument and never let it go" },
  { text: "Most likely to be late to their own wedding" },
  { text: "Most likely to survive a week alone in the wild" },
  { text: "Most likely to spend a month's rent on something ridiculous" },
  { text: "Most likely to fall asleep during the film" },
  { text: "Most likely to text their ex at 2am" },
  { text: "Most likely to become a driving instructor and be terrible at it" },
  { text: "Most likely to get famous for something embarrassing" },
  { text: "Most likely to still be in this group chat in 30 years" },
  { text: "Most likely to order the most expensive thing on the menu" },
  { text: "Most likely to cry at a cartoon" },
  { text: "Most likely to fight a seagull and lose" },
];

const GUESS_WHO: Prompt[] = [
  { text: "What's the worst piece of advice you've ever taken?" },
  { text: "Describe your perfect Friday in five words." },
  { text: "What's something you're weirdly good at?" },
  { text: "What's the pettiest reason you've held a grudge?" },
  { text: "If you had to leave the country tonight, where would you go?" },
  { text: "What's your most controversial food opinion?" },
  { text: "What would your autobiography be called?" },
  { text: "What's the last thing you Googled?" },
  { text: "Name a rule you break constantly." },
  { text: "What's the worst haircut you've ever had?" },
];

const BLUFF_TRIVIA: Prompt[] = [
  { text: "A group of flamingos is officially called this.", answer: "A flamboyance" },
  { text: "This is the only food that never spoils.", answer: "Honey" },
  { text: "Bananas are berries, but this common 'berry' is not one.", answer: "The strawberry" },
  { text: "The word 'algebra' comes from a book written in this century.", answer: "The 9th century" },
  { text: "An octopus has this many hearts.", answer: "Three" },
  { text: "The shortest war in recorded history lasted roughly this long.", answer: "38 minutes" },
  { text: "This is the only mammal capable of true sustained flight.", answer: "The bat" },
  { text: "Venus is unusual among planets because it does this.", answer: "Rotates backwards" },
  { text: "The dot over a lowercase 'i' has this name.", answer: "A tittle" },
  { text: "A snail can sleep for up to this long at a stretch.", answer: "Three years" },
];

const HERD_MENTALITY: Prompt[] = [
  { text: "Name a colour." },
  { text: "Name something you'd find in a living room." },
  { text: "Name a football club." },
  { text: "Name a fast food chain." },
  { text: "Name something people lie about." },
  { text: "Name a capital city." },
  { text: "Name a thing everyone owns but nobody uses." },
  { text: "Name a fruit." },
  { text: "Name an excuse for being late." },
  { text: "Name something that ruins a road trip." },
];

/* -------------------------------------------------------------- 1. Most Likely To */

const playersAsOptions = (room: Room): VoteOption[] =>
  connectedPlayers(room).map((p) => ({
    id: p.id,
    label: p.name,
    authorId: p.id,
  }));

export const mostLikelyTo = createRoundGame(
  {
    id: "most-likely-to",
    name: "Most Likely To",
    minPlayers: 3,
    collect: null,
    rounds: 8,
    allowSelfVote: true,
    buildOptions: playersAsOptions,
    score: (room, s) => {
      const counts = tally(s.votes);
      const top = Math.max(0, ...Object.values(counts));
      if (top === 0) return {};
      // Everyone tied at the top wears it.
      return Object.fromEntries(
        Object.entries(counts)
          .filter(([, n]) => n === top)
          .map(([id]) => [id, 1000]),
      );
    },
  },
  MOST_LIKELY_TO,
);

/* ---------------------------------------------------------- 2. Guess Who Said It */

export const guessWhoSaidIt = createRoundGame(
  {
    id: "guess-who-said-it",
    name: "Guess Who Said It",
    minPlayers: 3,
    collect: { prompt: "Answer honestly — nobody sees your name", maxLength: 90 },
    rounds: 6,
    allowSelfVote: false,
    // One answer goes up; everyone guesses who wrote it.
    pickFocus: (_room, s) => {
      const ids = Object.keys(s.submissions);
      return ids.length ? ids[Math.floor(Math.random() * ids.length)] : undefined;
    },
    buildOptions: playersAsOptions,
    score: (room, s) => {
      if (!s.focus) return {};
      const points: Record<string, number> = {};
      Object.entries(s.votes).forEach(([voterId, guess]) => {
        if (guess === s.focus) points[voterId] = 1000;
      });
      // Nobody guessed you? You wrote a good one.
      const caught = Object.values(s.votes).filter((g) => g === s.focus).length;
      if (caught === 0) points[s.focus] = (points[s.focus] ?? 0) + 1000;
      return points;
    },
  },
  GUESS_WHO,
);

/* --------------------------------------------------------------- 3. Bluff Trivia */

const REAL = "__real__";

export const bluffTrivia = createRoundGame(
  {
    id: "bluff-trivia",
    name: "Bluff Trivia",
    minPlayers: 3,
    collect: { prompt: "Invent a convincing answer", maxLength: 60 },
    rounds: 6,
    allowSelfVote: false,
    buildOptions: (room, s) => {
      const truth: VoteOption = {
        id: REAL,
        label: s.prompts[s.round]?.answer ?? "—",
      };
      const fakes: VoteOption[] = Object.entries(s.submissions).map(
        ([playerId, text]) => ({ id: playerId, label: text, authorId: playerId }),
      );
      return shuffle([truth, ...fakes]);
    },
    score: (room, s) => {
      const points: Record<string, number> = {};
      Object.entries(s.votes).forEach(([voterId, choice]) => {
        if (choice === REAL) {
          points[voterId] = (points[voterId] ?? 0) + 1000;
        } else {
          // Whoever wrote that lie just fooled someone.
          const author = s.options.find((o) => o.id === choice)?.authorId;
          if (author) points[author] = (points[author] ?? 0) + 500;
        }
      });
      return points;
    },
  },
  BLUFF_TRIVIA,
);

export const BLUFF_REAL_ID = REAL;

/* ------------------------------------------------------------ 4. Herd Mentality */

const normalise = (text: string) =>
  text.trim().toLowerCase().replace(/[^a-z0-9؀-ۿ ]/g, "");

export const herdMentality = createRoundGame(
  {
    id: "herd-mentality",
    name: "Herd Mentality",
    minPlayers: 3,
    collect: { prompt: "Answer like everyone else would", maxLength: 40 },
    rounds: 8,
    allowSelfVote: true,
    skipVote: true,
    buildOptions: () => [],
    score: (_room, s) => {
      const groups: Record<string, string[]> = {};
      Object.entries(s.submissions).forEach(([playerId, text]) => {
        const key = normalise(text);
        (groups[key] ??= []).push(playerId);
      });
      const biggest = Math.max(0, ...Object.values(groups).map((g) => g.length));
      if (biggest < 2) return {};
      const points: Record<string, number> = {};
      Object.values(groups)
        .filter((g) => g.length === biggest)
        .flat()
        .forEach((id) => {
          points[id] = 1000;
        });
      return points;
    },
  },
  HERD_MENTALITY,
);

export const roundGamePacks = {
  "most-likely-to": MOST_LIKELY_TO,
  "guess-who-said-it": GUESS_WHO,
  "bluff-trivia": BLUFF_TRIVIA,
  "herd-mentality": HERD_MENTALITY,
};
