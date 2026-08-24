"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@/lib/room/types";

export type Connection = "connecting" | "open" | "lost" | "missing";

/*
 * The live connection state, published for anything that wants to show it.
 *
 * There is only ever one room stream per screen, and the thing that needs to
 * report on it — a banner pinned to the top of the page — sits outside every
 * one of these components, in the layout. Threading the status back up through
 * pages that each have a dozen early returns would have meant restructuring
 * all of them; this is the same shape the sound control already uses.
 */
const watchers = new Set<(status: Connection) => void>();
let current: Connection = "connecting";

export function watchConnection(fn: (status: Connection) => void) {
  watchers.add(fn);
  fn(current);
  return () => {
    watchers.delete(fn);
  };
}

function announce(status: Connection) {
  current = status;
  watchers.forEach((fn) => fn(status));
}

/**
 * Holds one SSE connection to the room and gives back the latest snapshot.
 * EventSource reconnects on its own, but a room that 404s (server restarted,
 * wrong code) is terminal — we surface that rather than retrying forever.
 */
export function useRoom(code: string, viewerId?: string | null) {
  // Who's watching, so the server can strip what this screen shouldn't see.
  // No id means the TV, which everybody in the room can look at.
  const as = viewerId ? `?as=${encodeURIComponent(viewerId)}` : "";
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatusRaw] = useState<Connection>("connecting");
  /*
   * "missing" is the end of the line. A room that's gone doesn't come back,
   * and the page has already switched to a screen that says so — but the
   * stream can still be mid-retry underneath, and each failed attempt was
   * shouting "lost" over the top of it. The result was a red reconnecting
   * banner pinned above a message explaining that there was nothing to
   * reconnect to.
   */
  const dead = useRef(false);
  const setStatus = useCallback((next: Connection) => {
    if (dead.current) return;
    if (next === "missing") dead.current = true;
    setStatusRaw(next);
    announce(next);
  }, []);
  const version = useRef(-1);

  useEffect(() => {
    if (!code) return;
    dead.current = false;
    let cancelled = false;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    /*
     * EventSource only retries by itself when the connection drops mid-stream.
     * If the server answers with a status it doesn't like — a 404 for a room
     * that no longer exists — it fires one error, closes, and never tries
     * again. The banner sat there saying "reconnecting" while nothing was,
     * over a lobby that had stopped existing, which is worse than either
     * truth on its own: it told people to wait for something that was never
     * coming.
     *
     * So an error that leaves the stream CLOSED gets asked why. A 404 is
     * final and says so; anything else is worth trying again, backing off so
     * a server having a bad minute isn't hammered by every phone in the room.
     */
    const open = () => {
      if (cancelled) return;
      source = new EventSource(`/api/room/${code}/stream${as}`);

      source.onopen = () => {
        attempt = 0;
        setStatus("open");
      };

      source.onmessage = (event) => {
        const next = JSON.parse(event.data) as Room;
        // Snapshots can arrive out of order across a reconnect.
        if (next.version < version.current) return;
        version.current = next.version;
        attempt = 0;
        setRoom(next);
        setStatus("open");
      };

      source.onerror = () => {
        if (cancelled) return;
        setStatus("lost");
        // Still CONNECTING means the browser is already retrying for us.
        if (source?.readyState !== EventSource.CLOSED) return;

        source.close();
        fetch(`/api/room/${code}${as}`)
          .then((res) => {
            if (cancelled) return;
            if (res.status === 404) {
              // The room is gone. Say so, rather than waiting forever.
              setStatus("missing");
              return;
            }
            schedule();
          })
          .catch(() => schedule());
      };
    };

    const schedule = () => {
      if (cancelled) return;
      const wait = Math.min(10000, 1000 * 2 ** attempt++);
      retry = setTimeout(open, wait);
    };

    // Checked against the plain endpoint first so a dead code doesn't cost a
    // stream just to close it.
    fetch(`/api/room/${code}${as}`)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("missing");
          return;
        }
        open();
      })
      .catch(() => {
        if (!cancelled) setStatus("lost");
      });

    return () => {
      cancelled = true;
      source?.close();
      if (retry) clearTimeout(retry);
      announce("connecting");
    };
  }, [code, as, setStatus]);

  const send = useCallback(
    async (
      type: string,
      payload?: Record<string, unknown>,
      playerId?: string,
    ) => {
      await fetch(`/api/room/${code}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload, playerId }),
      }).catch(() => {
        /* the stream will resync us — no need to surface a blip */
      });
    },
    [code],
  );

  return { room, status, send };
}
