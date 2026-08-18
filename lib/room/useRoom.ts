"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@/lib/room/types";

export type Connection = "connecting" | "open" | "lost" | "missing";

/**
 * Holds one SSE connection to the room and gives back the latest snapshot.
 * EventSource reconnects on its own, but a room that 404s (server restarted,
 * wrong code) is terminal — we surface that rather than retrying forever.
 */
export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<Connection>("connecting");
  const version = useRef(-1);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    let source: EventSource | null = null;

    // A 404 means the room is genuinely gone — don't let EventSource loop on it.
    // Checked against the plain endpoint so we don't open a stream to close it.
    fetch(`/api/room/${code}`)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("missing");
          return;
        }
        source = new EventSource(`/api/room/${code}/stream`);
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
    };
  }, [code]);

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
