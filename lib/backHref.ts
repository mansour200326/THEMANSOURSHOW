"use client";

/**
 * Where "back" goes from one of the four screen-only games.
 *
 * These pages used to point at /games, a second lineup screen that listed the
 * same sixteen games as the room lobby. Two menus meant two places to keep in
 * step — which is how the game count ended up wrong in three files — and it
 * also meant a host who opened Big Board from their room and came back landed
 * on a menu with no room on it, having quietly left the party they were
 * running. The lobby links carry the room code now, and back goes back to it.
 */
export function backHref(): string {
  if (typeof window === "undefined") return "/";
  const room = new URLSearchParams(window.location.search).get("room");
  return room ? `/host/${room.toUpperCase()}` : "/";
}
