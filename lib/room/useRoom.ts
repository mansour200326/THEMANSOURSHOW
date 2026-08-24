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
  const setStatus = useCallback((next: Connection) => {
    setStatusRaw(next);
    announce(next);
  }, []);
  const version = useRef(-1);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    let source: EventSource | null = null;

    // A 404 means the room is genuinely gone — don't let EventSource loop on it.
    // Checked against the plain endpoint so we don't open a stream to close it.
    fetch(`/api/room/${code}${as}`)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("missing");
          return;
        }
        source = new EventSource(`/api/room/${code}/stream${as}`);
        source.onopen = () => setStatus("open");
        source.onmessage = (event) => {
          const next = JSON.parse(event.data) as Room;
          // Snapshots can arrive out of order across a reconnect.
          if (next.version < version.current) return;
          version.current = next.version;
          setRoom(next);
          setStatus("open");
        };
        source.onerror = () => setStatus("lost");
      })
      .catch(() => {
        if (!cancelled) setStatus("lost");
      });

    return () => {
      cancelled = true;
      source?.close();
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
