import type { GameState } from "@/lib/jeopardy/types";

const KEY = "huddle:jeopardy:v1";

/** Undo history is intentionally dropped — a refresh keeps the game, not the stack. */
export function saveGame(state: GameState) {
  if (typeof window === "undefined") return;
  // Sitting on setup isn't a game — leave any saved one alone so a stray
  // refresh doesn't destroy it. Only quitting clears the slot.
  if (state.phase === "setup") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...state, past: [] }));
  } catch {
    // Storage full or blocked (private mode) — the game keeps running in memory.
  }
}

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.board?.categories?.length || !parsed.teams?.length) return null;
    return { ...parsed, past: [] };
  } catch {
    return null;
  }
}

export function clearGame() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
