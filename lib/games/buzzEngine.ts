import { type Board, type TileRef, clueAt, tileKey, totalTiles } from "@/lib/board/types";
import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";
import { roundsFor } from "@/lib/games/lengths";

/**
 * Race-to-answer games. The server decides who buzzed first — phones only ever
 * send "I pressed it", and whichever request lands first wins. That's the whole
 * point of routing every input through one authority: no disputes.
 */

export type BuzzItem = {
  /** What the TV shows — an emoji string, a question, a clue. */
  prompt: string;
  answer: string;
  value: number;
  /**
   * What sort of thing the answer is. Emoji Riddles needs this the moment it
   * stops being all films: 🧊🇮🇸 is a fair riddle if you know you're looking
   * for a country and an impossible one if you don't.
   */
  hint?: string;
};

export type BuzzState = {
  kind: "buzz";
  /** board = pick a tile first; sequence = work through a list. */
  mode: "board" | "sequence";
  phase: "picking" | "open" | "buzzed" | "scored" | "done";
  board: Board | null;
  spent: string[];
  active: TileRef | null;
  items: BuzzItem[];
  index: number;
  /** Player who owns the current attempt. */
  buzzedBy: string | null;
  /** Already had a go at this item and got it wrong. */
  lockedOut: string[];
  /** Whoever answered last picks next. */
  picker: string | null;
  /**
   * When the clue went up. Buzzing before the room has had a chance to read it
   * is how the fastest thumb wins every round rather than the fastest brain.
   */
  openedAt: number | null;
  revealed: boolean;
  lastScores: Record<string, number>;
};

const st = (room: Room) => room.game as BuzzState;

/**
 * How long the clue is on screen before the buzzers arm. Anyone who jumps the
 * gun is locked out of that clue — the same penalty a real quiz show applies,
 * and the only thing that actually stops people mashing the button.
 */
export const BUZZ_ARM_MS = 1200;

export const buzzArmed = (s: BuzzState) =>
  s.openedAt !== null && Date.now() - s.openedAt >= BUZZ_ARM_MS;

export const buzzCurrent = (s: BuzzState): BuzzItem | null => {
  if (s.mode === "sequence") return s.items[s.index] ?? null;
  if (!s.board || !s.active) return null;
  const clue = clueAt(s.board, s.active);
  return clue
    ? { prompt: clue.clue, answer: clue.answer, value: clue.value }
    : null;
};

export type BuzzSpec = {
  id: string;
  name: string;
  minPlayers: number;
  mode: "board" | "sequence";
  /** Wrong answer costs you the value, as in the TV show. */
  deductOnWrong: boolean;
};

export function createBuzzGame(
  spec: BuzzSpec,
  content: { board?: Board; items?: BuzzItem[] },
): GameModule {
  /** Clear the current item and decide where we go next. */
  const closeItem = (room: Room, s: BuzzState): Room => {
    if (spec.mode === "sequence") {
      const index = s.index + 1;
      const done = index >= s.items.length;
      return {
        ...room,
        game: {
          ...s,
          phase: done ? "done" : "open",
          index,
          buzzedBy: null,
          lockedOut: [],
          revealed: false,
          openedAt: done ? null : Date.now(),
        },
      };
    }

    const key = s.active ? tileKey(s.active.c, s.active.r) : null;
    const spent = key && !s.spent.includes(key) ? [...s.spent, key] : s.spent;
    const cleared = s.board ? spent.length >= totalTiles(s.board) : true;
    return {
      ...room,
      game: {
        ...s,
        phase: cleared ? "done" : "picking",
        spent,
        active: null,
        buzzedBy: null,
        lockedOut: [],
        revealed: false,
      },
    };
  };

  return {
    id: spec.id,
    name: spec.name,
    minPlayers: spec.minPlayers,
    needsPhones: true,

    init(room) {
      // Content generated at setup time overrides the bundled pack.
      const primed = room as unknown as {
        pendingBoard?: Board;
        pendingItems?: BuzzItem[];
        pendingRounds?: number;
      };
      const supplied = primed.pendingBoard;
      const all = primed.pendingItems?.length
        ? primed.pendingItems
        : (content.items ?? []);
      // A board game's length is its board; a run of riddles is as long as
      // the host wants it to be.
      const items =
        spec.mode === "sequence"
          ? all.slice(0, roundsFor(spec.id, primed.pendingRounds))
          : all;
      const fresh: BuzzState = {
        kind: "buzz",
        mode: spec.mode,
        phase: spec.mode === "board" ? "picking" : "open",
        board: supplied ?? content.board ?? null,
        spent: [],
        active: null,
        items,
        index: 0,
        buzzedBy: null,
        lockedOut: [],
        picker: connectedPlayers(room)[0]?.id ?? null,
        revealed: false,
        openedAt: spec.mode === "sequence" ? Date.now() : null,
        lastScores: {},
      };
      return { ...room, game: fresh };
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;

      switch (action.type) {
        case "pick": {
          if (s.phase !== "picking" || !s.board) return room;
          const c = Number(action.payload?.c);
          const r = Number(action.payload?.r);
          if (!Number.isFinite(c) || !Number.isFinite(r)) return room;
          if (s.spent.includes(tileKey(c, r))) return room;
          if (!clueAt(s.board, { c, r })) return room;
          return {
            ...room,
            game: {
              ...s,
              phase: "open",
              active: { c, r },
              openedAt: Date.now(),
              lastScores: {},
            },
          };
        }

        /**
         * First request in wins. Everything else about this game is cosmetic —
         * this line is the one that has to be right.
         */
        case "buzz": {
          if (s.phase !== "open" || !action.playerId) return room;
          if (s.buzzedBy) return room;
          if (s.lockedOut.includes(action.playerId)) return room;

          // Jumped the gun: out of this one, and the board stays open.
          if (!buzzArmed(s)) {
            return {
              ...room,
              game: { ...s, lockedOut: [...s.lockedOut, action.playerId] },
            };
          }

          return {
            ...room,
            game: { ...s, phase: "buzzed", buzzedBy: action.playerId },
          };
        }

        case "judge": {
          if (s.phase !== "buzzed" || !s.buzzedBy) return room;
          const item = buzzCurrent(s);
          if (!item) return room;
          const correct = Boolean(action.payload?.correct);
          const who = s.buzzedBy;

          if (correct) {
            const scored = award(room, { [who]: item.value });
            return closeItem(scored, {
              ...st(scored),
              picker: who,
              lastScores: { [who]: item.value },
            });
          }

          const penalised = spec.deductOnWrong
            ? award(room, { [who]: -item.value })
            : room;
          const lockedOut = [...s.lockedOut, who];
          const everyoneOut =
            lockedOut.length >= connectedPlayers(room).length;
          const next: BuzzState = {
            ...st(penalised),
            lockedOut,
            buzzedBy: null,
            lastScores: spec.deductOnWrong ? { [who]: -item.value } : {},
          };
          // Nobody left to try — show the answer and move on.
          return everyoneOut
            ? { ...penalised, game: { ...next, phase: "scored", revealed: true } }
            : {
                ...penalised,
                game: { ...next, phase: "open", openedAt: Date.now() },
              };
        }

        case "reveal":
          return { ...room, game: { ...s, revealed: true } };

        /** Host gives up on the current item. */
        case "skip": {
          if (s.phase === "picking" || s.phase === "done") return room;
          return closeItem(room, { ...s, revealed: true });
        }

        case "continue": {
          if (s.phase !== "scored") return room;
          return closeItem(room, s);
        }

        /** Host reopens buzzing after a bad lockout. */
        case "reopen": {
          if (s.phase === "buzzed") {
            return {
              ...room,
              game: {
                ...s,
                phase: "open",
                buzzedBy: null,
                // Re-arm, so the reopen isn't won by whoever was already
                // holding their thumb over the button.
                openedAt: Date.now(),
                lockedOut: [],
              },
            };
          }
          return room;
        }

        default:
          return room;
      }
    },
  };
}
