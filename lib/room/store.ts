import "server-only";

import { games } from "@/lib/games/registry";
import { BOT_ROSTER, settleBots } from "@/lib/room/bots";
import { loadRooms, saveRooms } from "@/lib/room/persist";
import {
  type Action,
  type Player,
  type Room,
  AVATARS,
  makeRoomCode,
} from "@/lib/room/types";

/**
 * Rooms live in this process's memory. That's deliberate: one laptop serving one
 * living room needs no Redis, no accounts, no network hop.
 *
 * Memory is still the source of truth, but every change is now mirrored to disk
 * (see persist.ts) and read back at boot, so restarting the server — or
 * deploying a fix while people are playing — no longer ends the game and
 * invalidates the code on the TV.
 *
 * Stashed on globalThis so Next's dev hot-reload doesn't wipe a live game.
 */
type Listener = (room: Room) => void;

const g = globalThis as unknown as {
  __showRooms?: Map<string, Room>;
  __showListeners?: Map<string, Set<Listener>>;
};

const rooms = (g.__showRooms ??= new Map<string, Room>(
  loadRooms().map((room) => [room.code, room]),
));
const listeners = (g.__showListeners ??= new Map<string, Set<Listener>>());

/* ------------------------------------------------------------------ access */

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function createRoom(): Room {
  let code = makeRoomCode();
  // Vanishingly unlikely, but a collision would hijack someone else's game.
  while (rooms.has(code)) code = makeRoomCode();

  const room: Room = {
    code,
    players: [],
    gameId: null,
    game: null,
    createdAt: Date.now(),
    version: 0,
  };
  rooms.set(code, room);
  saveRooms(rooms.values());
  return room;
}

/* --------------------------------------------------------------- broadcast */

export function subscribe(code: string, fn: Listener): () => void {
  const key = code.toUpperCase();
  const set = listeners.get(key) ?? new Set<Listener>();
  set.add(fn);
  listeners.set(key, set);
  return () => {
    set.delete(fn);
    if (set.size === 0) listeners.delete(key);
  };
}

function publish(room: Room) {
  rooms.set(room.code, room);
  saveRooms(rooms.values());
  listeners.get(room.code)?.forEach((fn) => {
    try {
      fn(room);
    } catch {
      // A dead SSE connection shouldn't take down everyone else's game.
    }
  });
}

/* ----------------------------------------------------------------- actions */

/**
 * Scores are per game, not per night. Somebody who cleaned up at Big Board
 * shouldn't walk into Sketch & Guess two thousand points ahead — every game
 * is its own contest, and the phones show the score of the game being played.
 */
/**
 * Someone has left. Hand on anything they were holding.
 *
 * A player who walks out mid-game used to strand whatever job they had — the
 * pen in Sketch & Guess, the key card in Code Grid, the clue in Dial It In —
 * and the round would sit there waiting for a person who had gone home. Which
 * is exactly what happened: the room had to restart the whole game.
 *
 * Every case here hands the role to somebody still in the room, or ends the
 * round if there's nobody sensible to hand it to.
 */
function releaseRoles(room: Room, goneId: string): Room {
  const game = room.game as Record<string, unknown> | null;
  if (!game?.kind) return room;
  const others = room.players.filter((p) => p.connected && p.id !== goneId);
  const nextId = others[0]?.id ?? null;

  switch (game.kind) {
    case "sketch": {
      if (game.drawerId !== goneId) return room;
      // Nobody left to draw — close the round on what's already down.
      if (!nextId) return { ...room, game: { ...game, phase: "reveal" } };
      return {
        ...room,
        game: { ...game, drawerId: nextId, strokes: [], live: { c: 0, p: [] }, startedAt: Date.now() },
      };
    }

    case "live": {
      if (game.lead !== goneId) return room;
      return { ...room, game: { ...game, lead: nextId } };
    }

    case "grid": {
      const teams = (game.teams as { name: string; spymaster: string | null; members: string[] }[]) ?? [];
      if (!teams.some((t) => t.spymaster === goneId || t.members.includes(goneId))) {
        return room;
      }
      return {
        ...room,
        game: {
          ...game,
          teams: teams.map((t) => {
            const members = t.members.filter((id) => id !== goneId);
            if (t.spymaster !== goneId) return { ...t, members };
            // Promote a team-mate; a side with nobody left can't give clues.
            return { ...t, spymaster: members[0] ?? null, members: members.slice(1) };
          }),
        },
      };
    }

    case "impostor": {
      // The impostor walking out makes the round unwinnable either way.
      if (game.impostorId !== goneId) return room;
      return { ...room, game: { ...game, phase: "reveal", outcome: "impostor-survived" } };
    }

    case "buzz": {
      const patch: Record<string, unknown> = {};
      if (game.buzzedBy === goneId) {
        patch.buzzedBy = null;
        patch.phase = "open";
      }
      if (game.picker === goneId) patch.picker = nextId;
      return Object.keys(patch).length ? { ...room, game: { ...game, ...patch } } : room;
    }

    default:
      return room;
  }
}

const clearScores = (players: Player[]): Player[] =>
  players.map((p) => (p.score === 0 ? p : { ...p, score: 0 }));

const nextAvatar = (room: Room) => {
  const taken = new Set(room.players.map((p) => p.emoji));
  return AVATARS.find((a) => !taken.has(a)) ?? AVATARS[room.players.length % AVATARS.length];
};

/** Room-level actions everyone shares, regardless of which game is running. */
function reduceRoom(room: Room, action: Action): Room {
  switch (action.type) {
    case "player:join": {
      const name = String(action.payload?.name ?? "").trim().slice(0, 14);
      if (!name) return room;

      // Same name = same person coming back (refresh, dropped Wi-Fi).
      const existing = room.players.find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        return {
          ...room,
          players: room.players.map((p) =>
            p.id === existing.id ? { ...p, connected: true } : p,
          ),
        };
      }
      if (room.players.length >= 12) return room;

      const player: Player = {
        id: String(action.payload?.id ?? crypto.randomUUID()),
        name,
        emoji: nextAvatar(room),
        score: 0,
        connected: true,
        joinedAt: Date.now(),
      };
      return { ...room, players: [...room.players, player] };
    }

    case "player:leave":
      return {
        ...room,
        players: room.players.map((p) =>
          p.id === action.playerId ? { ...p, connected: false } : p,
        ),
      };

    /** The host removing somebody, or somebody removing themselves. */
    case "player:kick":
    case "player:quit": {
      const goneId =
        action.type === "player:quit"
          ? action.playerId
          : String(action.payload?.id ?? "");
      if (!goneId) return room;
      const without: Room = {
        ...room,
        players: room.players.filter((p) => p.id !== goneId),
      };
      return releaseRoles(without, goneId);
    }

    case "game:start": {
      const id = String(action.payload?.gameId ?? "");
      const game = games[id];
      if (!game) return room;
      /**
       * Content generated during setup rides along on the start action. Each
       * engine reads whichever slot it understands and ignores the rest; the
       * lot is deleted straight after so it never reaches a client.
       */
      const PENDING = [
        "pendingBoard",
        "pendingItems",
        "pendingPlaces",
        "pendingWords",
        "pendingPrompts",
        "pendingSeconds",
      ] as const;
      const primed = {
        ...room,
        gameId: id,
        game: null,
        // Every game starts everyone level.
        players: clearScores(room.players),
        pendingBoard: action.payload?.board,
        pendingItems: action.payload?.items,
        pendingPlaces: action.payload?.places,
        pendingWords: action.payload?.words,
        pendingSeconds: action.payload?.seconds,
        pendingPrompts: action.payload?.prompts,
      };
      const started = game.init(primed as typeof room);
      PENDING.forEach((key) => {
        delete (started as Record<string, unknown>)[key];
      });
      return started;
    }

    case "game:end":
      /**
       * Back to the lobby with a clean slate. The finished game's standings
       * stay on screen right up until the host taps away from them, so this
       * never wipes a result anybody is still reading.
       */
      return {
        ...room,
        gameId: null,
        game: null,
        players: clearScores(room.players),
      };

    case "bots:add": {
      const already = room.players.filter((p) => p.bot).length;
      const wanted = BOT_ROSTER.slice(already, already + 2);
      if (!wanted.length) return room;
      const added: Player[] = wanted.map((bot, i) => ({
        id: `bot-${already + i}`,
        name: bot.name,
        emoji: bot.emoji,
        score: 0,
        connected: true,
        joinedAt: Date.now(),
        bot: true,
      }));
      return { ...room, players: [...room.players, ...added] };
    }

    case "bots:clear":
      return { ...room, players: room.players.filter((p) => !p.bot) };

    case "scores:reset":
      return { ...room, players: room.players.map((p) => ({ ...p, score: 0 })) };

    default: {
      // Not a room action — hand it to whatever segment is on.
      const game = room.gameId ? games[room.gameId] : null;
      return game ? game.reduce(room, action) : room;
    }
  }
}

export function dispatch(code: string, action: Action): Room | undefined {
  const room = getRoom(code);
  if (!room) return undefined;

  // Bots take their turns in the same tick, so nobody ever waits on them.
  const next = settleBots(reduceRoom(room, action), reduceRoom);
  if (next === room) return room;

  const published = { ...next, version: room.version + 1 };
  publish(published);
  return published;
}

/** Directly replace a room's state — used by content generation. */
export function patchRoom(code: string, patch: Partial<Room>): Room | undefined {
  const room = getRoom(code);
  if (!room) return undefined;
  const published = { ...room, ...patch, version: room.version + 1 };
  publish(published);
  return published;
}
