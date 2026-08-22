import type { CodeGridState } from "@/lib/games/codegrid";
import type { ImpostorState } from "@/lib/games/impostor";
import type { LiveState } from "@/lib/games/liveEngine";
import type { RoundState } from "@/lib/games/roundEngine";
import type { SketchState } from "@/lib/games/sketch";
import type { Player, Room } from "@/lib/room/types";
import { connectedPlayers } from "@/lib/room/types";

/**
 * Practice bots exist so one person can walk through a segment alone. The
 * server plays their turns the instant it's their move, so nothing ever waits
 * on them. They're clearly marked in the lobby and can be cleared in one tap.
 *
 * They play badly on purpose. A bot that always knew the answer would make
 * Last One Standing unwinnable and Sketch & Guess pointless.
 */

export const BOT_ROSTER: Array<Pick<Player, "name" | "emoji">> = [
  { name: "Bot Rashid", emoji: "🤖" },
  { name: "Bot Layla", emoji: "👾" },
  { name: "Bot Tariq", emoji: "🛸" },
];

/** Short, plausible answers per segment — enough to make a preview feel real. */
const ANSWERS: Record<string, string[]> = {
  "who-said-it": [
    "Sleep in and regret nothing",
    "Never trust a quiet lift",
    "I reverse park on the first try",
    "Coffee and a long drive",
    "I once argued with a parking meter",
  ],
  "bluff-trivia": [
    "Twelve",
    "A silver spoon",
    "Ninety-nine",
    "A very small horse",
    "About forty minutes",
  ],
  groupthink: ["Blue", "Coffee", "Red", "Traffic", "Apple", "Paris"],
  "last-one-standing": [
    "Not a clue",
    "Seven",
    "Paris",
    "A badger",
    "Tuesday",
    "Blue",
  ],
  "sketch-and-guess": ["A house", "A dog", "A car", "A tree", "A boat", "A face"],
};

const CLUES = ["Middle", "Warm", "Halfway", "Sort of", "Mostly", "Nearly"];
const GRID_CLUES = ["Water", "Sharp", "Loud", "Round", "Cold", "Old"];

const FALLBACK = ["Something reasonable", "No idea honestly", "Probably that"];

function botAnswer(gameId: string, seed: number): string {
  const pool = ANSWERS[gameId] ?? FALLBACK;
  return pool[Math.abs(seed) % pool.length];
}

/** Stable per-bot offset, so two bots never write the same line in a round. */
const botIndex = (id: string) => {
  const n = Number.parseInt(id.replace("bot-", ""), 10);
  return Number.isFinite(n) ? n : 0;
};

type Act = {
  type: string;
  playerId?: string;
  payload?: Record<string, unknown>;
};

type Reducer = (room: Room, action: Act) => Room;

type GameState =
  | RoundState
  | LiveState
  | ImpostorState
  | CodeGridState
  | SketchState;

/**
 * One move for one bot, or null if none of them can act. Split out per game so
 * each stays readable — settleBots just keeps calling it until it runs dry.
 */
function nextBotMove(room: Room, state: GameState): Act | null {
  const bots = room.players.filter((p) => p.bot && p.connected);
  if (!bots.length) return null;

  if (state.kind === "round") {
    for (const bot of bots) {
      if (state.phase === "collect" && state.submissions[bot.id] === undefined) {
        return {
          type: "submit",
          playerId: bot.id,
          payload: {
            text: botAnswer(
              room.gameId ?? "",
              botIndex(bot.id) + state.round * BOT_ROSTER.length,
            ),
          },
        };
      }
      if (state.phase === "vote" && state.votes[bot.id] === undefined) {
        const choices = state.options.filter((o) => o.authorId !== bot.id);
        if (!choices.length) continue;
        const pick = choices[Math.floor(Math.random() * choices.length)];
        return {
          type: "vote",
          playerId: bot.id,
          payload: { optionId: pick.id },
        };
      }
    }
    return null;
  }

  if (state.kind === "live") {
    for (const bot of bots) {
      if (state.benched.includes(bot.id)) continue;

      if (state.phase === "brief" && state.lead === bot.id) {
        return {
          type: "clue",
          playerId: bot.id,
          payload: { text: CLUES[botIndex(bot.id) % CLUES.length] },
        };
      }
      if (state.phase !== "collect") continue;
      if (state.lead === bot.id && state.variant === "dial") continue;
      if (state.answers[bot.id] !== undefined) continue;

      if (state.variant === "standing") {
        return {
          type: "submit",
          playerId: bot.id,
          payload: {
            text: botAnswer(
              "last-one-standing",
              botIndex(bot.id) + state.round * BOT_ROSTER.length,
            ),
          },
        };
      }
      if (state.variant === "timeline") {
        // A shuffled order, so a bot occasionally nails one by luck.
        const order = [...state.shuffled].sort(() => Math.random() - 0.5);
        return {
          type: "submit",
          playerId: bot.id,
          payload: { text: order.join(",") },
        };
      }
      return {
        type: "submit",
        playerId: bot.id,
        payload: { text: String(10 + Math.floor(Math.random() * 81)) },
      };
    }
    return null;
  }

  if (state.kind === "impostor") {
    for (const bot of bots) {
      if (state.phase === "deal" && !state.ready.includes(bot.id)) {
        return { type: "ready", playerId: bot.id };
      }
      if (state.phase === "vote" && state.votes[bot.id] === undefined) {
        const others = connectedPlayers(room).filter((p) => p.id !== bot.id);
        if (!others.length) continue;
        const pick = others[Math.floor(Math.random() * others.length)];
        return {
          type: "vote",
          playerId: bot.id,
          payload: { playerId: pick.id },
        };
      }
    }
    return null;
  }

  if (state.kind === "grid") {
    const turn = state.teams[state.turn];
    if (state.phase === "clue" && turn?.spymaster) {
      const bot = bots.find((b) => b.id === turn.spymaster);
      if (bot) {
        return {
          type: "clue",
          playerId: bot.id,
          payload: {
            word: GRID_CLUES[Math.floor(Math.random() * GRID_CLUES.length)],
            count: 1,
          },
        };
      }
    }
    if (state.phase === "guess") {
      // Only step in when the guessing team is all bots — otherwise they'd
      // steamroll the person whose turn it actually is.
      const humanOnTurn = room.players.some(
        (p) => p.connected && !p.bot && turn?.members.includes(p.id),
      );
      const guesser = humanOnTurn
        ? undefined
        : bots.find((b) => turn?.members.includes(b.id));
      if (guesser) {
        const open = state.words
          .map((_, i) => i)
          .filter((i) => !state.revealed.includes(i));
        if (open.length) {
          return {
            type: "tap",
            playerId: guesser.id,
            payload: { index: open[Math.floor(Math.random() * open.length)] },
          };
        }
      }
    }
    return null;
  }

  if (state.kind === "sketch") {
    if (state.phase !== "drawing") return null;
    for (const bot of bots) {
      if (bot.id === state.drawerId) continue;
      if (state.solved.includes(bot.id)) continue;
      // One wrong guess each, then they give up — a bot that solved it
      // instantly would end every round before anyone could look up.
      if ((state.guesses[bot.id]?.length ?? 0) > 0) continue;
      return {
        type: "guess",
        playerId: bot.id,
        payload: {
          text: botAnswer("sketch-and-guess", botIndex(bot.id) + state.round),
        },
      };
    }
    return null;
  }

  return null;
}

/**
 * Runs bots until none of them can act. Bounded so a misbehaving game can never
 * spin the request thread.
 */
export function settleBots(room: Room, reduce: Reducer): Room {
  let current = room;

  for (let step = 0; step < 40; step++) {
    const state = current.game as GameState | null;
    if (!state) break;
    const move = nextBotMove(current, state);
    if (!move) break;
    const next = reduce(current, move);
    // A rejected move would loop forever otherwise.
    if (next === current) break;
    current = next;
  }

  return current;
}
