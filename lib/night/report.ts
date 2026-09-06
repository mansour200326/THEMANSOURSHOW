"use client";

import type { HostSheet } from "@/lib/room/types";

/**
 * How the screen-only games talk to the room they were opened from.
 *
 * Big Board, Face-Off and the rapid games run on their own, in the
 * television's browser, with no room involved — unless they were opened from
 * a lobby, in which case the room code rides along in the URL. Then two
 * things become possible: their final scores can join the night's ledger,
 * and the answers still face down can be shown on the host's phone.
 *
 * Both are fire-and-forget. Neither is allowed to slow a game down or to
 * fail in a way the room can see.
 */
export function roomFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.search).get("room");
  return code ? code.toUpperCase() : null;
}

async function send(code: string, type: string, payload: Record<string, unknown>) {
  try {
    await fetch(`/api/room/${code}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
      keepalive: true,
    });
  } catch {
    /* The night ledger is a bonus on top of a game that already worked. */
  }
}

export function recordNight(
  gameId: string,
  label: string,
  scores: Array<{ name: string; points: number }>,
) {
  const code = roomFromUrl();
  if (!code) return;
  void send(code, "night:record", { gameId, label, scores });
}

export function setHostSheet(sheet: HostSheet | null) {
  const code = roomFromUrl();
  if (!code) return;
  void send(code, "sheet:set", { sheet });
}
