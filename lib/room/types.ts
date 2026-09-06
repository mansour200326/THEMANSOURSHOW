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

/**
 * One finished game's final scores, kept for the night.
 *
 * Keyed by display name rather than player id, because the screen-only games
 * score teams and the room games score people, and a night has both. A name
 * that appears in several games adds up; one that appears in one game just
 * has that game's points.
 */
export type NightEntry = {
  gameId: string;
  label: string;
  at: number;
  scores: Array<{ name: string; points: number }>;
};

/**
 * What the host's phone is allowed to see that the television isn't.
 * Set by the screen-only games — the answers still face down on the board.
 */
export type HostSheet = {
  title: string;
  lines: Array<{ text: string; note?: string; hidden: boolean }>;
  at: number;
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
  /** Every finished game tonight, oldest first. */
  night?: NightEntry[];
  /**
   * Lets a phone act as the host's private screen. Shown on the TV in the
   * lobby only; a phone that opens the room "as host:<key>" gets the sheet
   * and nothing else does. Never in a phone's snapshot.
   */
  hostKey?: string;
  hostSheet?: HostSheet | null;
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
