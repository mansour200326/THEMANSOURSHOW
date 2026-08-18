import type { RoundState } from "@/lib/games/roundEngine";
import type { Player, Room } from "@/lib/room/types";

/**
 * Practice bots exist so one person can walk through a segment alone. The
 * server plays their turns the instant it's their move, so nothing ever waits
 * on them. They're clearly marked in the lobby and can be cleared in one tap.
 */

export const BOT_ROSTER: Array<Pick<Player, "name" | "emoji">> = [
  { name: "Bot Rashid", emoji: "🤖" },
  { name: "Bot Layla", emoji: "👾" },
  { name: "Bot Tariq", emoji: "🛸" },
];

/** Short, plausible answers per segment — enough to make a preview feel real. */
const ANSWERS: Record<string, string[]> = {
  "guess-who-said-it": [
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
  "herd-mentality": ["Blue", "Coffee", "Red", "Traffic", "Apple", "Paris"],
};

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

type Reducer = (room: Room, action: {
  type: string;
  playerId?: string;
  payload?: Record<string, unknown>;
}) => Room;

/**
 * Runs bots until none of them can act. Bounded so a misbehaving game can never
 * spin the request thread.
 */
export function settleBots(room: Room, reduce: Reducer): Room {
  let current = room;

  for (let step = 0; step < 40; step++) {
    const state = current.game as RoundState | null;
    if (!state || state.kind !== "round") break;
    if (state.phase !== "collect" && state.phase !== "vote") break;

    const bots = current.players.filter((p) => p.bot && p.connected);
    if (!bots.length) break;

    let acted = false;

    for (const bot of bots) {
      if (state.phase === "collect" && state.submissions[bot.id] === undefined) {
        current = reduce(current, {
          type: "submit",
          playerId: bot.id,
          payload: {
            text: botAnswer(
              current.gameId ?? "",
              botIndex(bot.id) + state.round * BOT_ROSTER.length,
            ),
          },
        });
        acted = true;
        break; // Phase may have flipped — re-read before the next bot moves.
      }

      if (state.phase === "vote" && state.votes[bot.id] === undefined) {
        const choices = state.options.filter((o) => o.authorId !== bot.id);
        if (!choices.length) continue;
        const pick = choices[Math.floor(Math.random() * choices.length)];
        current = reduce(current, {
          type: "vote",
          playerId: bot.id,
          payload: { optionId: pick.id },
        });
        acted = true;
        break;
      }
    }

    if (!acted) break;
  }

  return current;
}
