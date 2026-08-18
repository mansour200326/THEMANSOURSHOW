"use client";

import { use } from "react";
import Link from "next/link";
import { Lobby } from "@/components/host/Lobby";
import { RoundHost } from "@/components/host/RoundHost";
import type { RoundState } from "@/lib/games/roundEngine";
import { useRoom } from "@/lib/room/useRoom";

export default function HostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const roomCode = code.toUpperCase();
  const { room, status, send } = useRoom(roomCode);

  if (status === "missing") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide text-slate-200">
          Room {roomCode} is gone
        </h1>
        <p className="max-w-md text-slate-400">
          Rooms live in the server&apos;s memory, so restarting it clears them.
          Start a fresh one and the phones can rejoin.
        </p>
        <Link href="/" className="btn-cream px-8 py-4 text-lg">
          Host a new room
        </Link>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="font-display uppercase tracking-[0.25em] text-slate-500">
          Opening room {roomCode}…
        </p>
      </main>
    );
  }

  if (!room.gameId) {
    return (
      <Lobby
        room={room}
        onStart={(gameId) => send("game:start", { gameId })}
        onAddBots={() => send("bots:add")}
        onClearBots={() => send("bots:clear")}
      />
    );
  }

  const state = room.game as RoundState | null;

  if (state?.kind === "round") {
    return (
      <RoundHost
        room={room}
        state={state}
        onForce={() => send("force")}
        onNext={() => send("next")}
        onQuit={() => send("game:end")}
      />
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <button onClick={() => send("game:end")} className="btn-ghost">
        Back to the lobby
      </button>
    </main>
  );
}
