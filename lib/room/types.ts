/**
 * The room is the whole session: who's here, which segment is running, and
 * whatever that segment is keeping track of. Every game is a pure function
 * over this object, so the server never needs to know how any game works.
 */

export type Player = {
  id: string;
  name: string;
  emoji: string;
  /** Points in the game being played. Reset when a game starts or ends. */
  score: number;
  connected: boolean;
  joinedAt: number;
  /** Practice bot — the server plays its turns so you can try a game alone. */
  bot?: boolean;
};

export type Room = {
  code: string;
  players: Player[];
  /** null = sitting in the lobby. */
  gameId: string | null;
  /** Whatever the active game module is tracking. */
  game: unknown;
  createdAt: number;
  /** Last change of any kind. What decides when a dead room is dropped. */
  touchedAt?: number;
  /** Phones allowed, fixed by the host's plan when the room was made. */
  maxPlayers?: number;
  /** Bumped on every mutation so clients can drop stale snapshots. */
  version: number;
};

export type Action = {
  type: string;
  /** Absent means the host sent it from the TV. */
  playerId?: string;
  payload?: Record<string, unknown>;
};

export const isHost = (action: Action) => !action.playerId;

export const playerById = (room: Room, id: string | undefined) =>
  id ? room.players.find((p) => p.id === id) : undefined;

export const connectedPlayers = (room: Room) =>
  room.players.filter((p) => p.connected);

/** Award points to the night-long running total. */
export function award(
  room: Room,
  points: Record<string, number>,
): Room {
  return {
    ...room,
    players: room.players.map((p) =>
      points[p.id] ? { ...p, score: p.score + points[p.id] } : p,
    ),
  };
}

export const AVATARS = [
  "🦅", "🐪", "🦁", "🐉", "🦈", "🐺", "🦊", "🐝",
  "🌙", "⚡", "🔥", "💎", "🎯", "👑", "🚀", "🍉",
];

/** Unambiguous on a TV from across the room — no O/0, no I/1. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function makeRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
