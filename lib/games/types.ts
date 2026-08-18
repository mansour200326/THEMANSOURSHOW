import type { Action, Room } from "@/lib/room/types";

/**
 * A segment is a pure reducer over the room plus a bit of metadata. Views live
 * separately (client components keyed by id) so this file stays importable from
 * both the server and the browser.
 */
export type GameModule = {
  id: string;
  name: string;
  /** One line explaining how it works, shown on the lobby card. */
  blurb: string;
  /** Minimum connected players before the host can start it. */
  minPlayers: number;
  /** TV-only games don't need anyone to join on a phone. */
  needsPhones: boolean;
  /** Build the starting state. Called with the room as it is at kickoff. */
  init: (room: Room) => Room;
  /** Every action the room doesn't handle itself lands here. */
  reduce: (room: Room, action: Action) => Room;
};

/** Content packs a game needs generated before it can start. */
export type ContentRequest = {
  gameId: string;
  playerNames: string[];
  vibe?: string;
};
