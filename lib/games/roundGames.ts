import {
  type Prompt,
  type RoundState,
  type VoteOption,
  createRoundGame,
  shuffle,
  tally,
} from "@/lib/games/roundEngine";
import { type Room, connectedPlayers } from "@/lib/room/types";
import { normalise } from "@/lib/feud/match";

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

/* ---------------------------------------------------------- 2. Who Said It */

export const guessWhoSaidIt = createRoundGame(
  {
    id: "who-said-it",
    name: "Who Said It",
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



/* ------------------------------------------------------------ 4. Groupthink */

/*
 * Grouping used to be done by a local rule that only stripped punctuation, so
 * "The Beach" and "beach" were two different answers and a round where four
 * people plainly agreed paid nobody a thing. The game is "answer like everyone
 * else would" — it cannot be decided on whether people typed the same
 * characters. It uses the same matcher as the survey board now, which drops
 * filler words and plurals, so agreeing counts as agreeing.
 */
export const herdMentality = createRoundGame(
  {
    id: "groupthink",
    name: "Groupthink",
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
  "who-said-it": GUESS_WHO,
  "groupthink": HERD_MENTALITY,
};
